package analytics

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
	"koin/server/internal/models"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// GetExchangeRate converts from one currency to another using koin_system.exchange_rates.
func (r *Repository) GetExchangeRate(ctx context.Context, from, to string) (decimal.Decimal, error) {
	from = strings.ToUpper(strings.TrimSpace(from))
	to = strings.ToUpper(strings.TrimSpace(to))

	if from == "" || to == "" || from == to {
		return decimal.NewFromInt(1), nil
	}

	var rate decimal.Decimal
	query := `SELECT rate FROM koin_system.exchange_rates WHERE from_currency = $1 AND to_currency = $2`
	err := r.pool.QueryRow(ctx, query, from, to).Scan(&rate)
	if err == nil && !rate.IsZero() {
		return rate, nil
	}

	var invRate decimal.Decimal
	err = r.pool.QueryRow(ctx, query, to, from).Scan(&invRate)
	if err == nil && !invRate.IsZero() {
		return decimal.NewFromInt(1).DivRound(invRate, 6), nil
	}

	if from != "USD" && to != "USD" {
		rateFromUSD, errFrom := r.GetExchangeRate(ctx, from, "USD")
		rateUSDTo, errTo := r.GetExchangeRate(ctx, "USD", to)
		if errFrom == nil && errTo == nil && !rateFromUSD.IsZero() && !rateUSDTo.IsZero() {
			return rateFromUSD.Mul(rateUSDTo).Round(6), nil
		}
	}

	return decimal.NewFromInt(1), nil
}

// GetSummary calculates net worth, month income, month expense, net savings, and savings rate.
func (r *Repository) GetSummary(ctx context.Context, profileID uuid.UUID) (*models.AnalyticsSummary, error) {
	// 1. Get profile base currency
	var baseCurrency string
	err := r.pool.QueryRow(ctx, `SELECT base_currency FROM koin_auth.profiles WHERE id = $1`, profileID).Scan(&baseCurrency)
	if err != nil {
		return nil, fmt.Errorf("error getting profile base currency: %w", err)
	}
	if baseCurrency == "" {
		baseCurrency = "USD"
	}

	// 2. Calculate Net Worth from active accounts converted to base currency
	accountRows, err := r.pool.Query(ctx, `
		SELECT currency, current_balance 
		FROM koin_finance.accounts 
		WHERE created_by_profile_id = $1 AND is_archived = false
	`, profileID)
	if err != nil {
		return nil, fmt.Errorf("error querying accounts for net worth: %w", err)
	}
	defer accountRows.Close()

	netWorth := decimal.Zero
	for accountRows.Next() {
		var cur string
		var bal decimal.Decimal
		if err := accountRows.Scan(&cur, &bal); err != nil {
			return nil, fmt.Errorf("error scanning account balance: %w", err)
		}

		rate, _ := r.GetExchangeRate(ctx, cur, baseCurrency)
		convertedBal := bal.Mul(rate).Round(2)
		netWorth = netWorth.Add(convertedBal)
	}

	// 3. Current month income and expenses
	currentPeriod := time.Now().Format("2006-01")
	var monthIncome, monthExpense decimal.Decimal
	txQuery := `
		SELECT 
			COALESCE(SUM(CASE WHEN type = 'income' THEN base_amount ELSE 0 END), 0) AS month_income,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN base_amount ELSE 0 END), 0) AS month_expense
		FROM koin_finance.transactions
		WHERE profile_id = $1 AND to_char(date, 'YYYY-MM') = $2
	`
	err = r.pool.QueryRow(ctx, txQuery, profileID, currentPeriod).Scan(&monthIncome, &monthExpense)
	if err != nil {
		return nil, fmt.Errorf("error querying monthly transactions: %w", err)
	}

	netSavings := monthIncome.Sub(monthExpense)
	savingsRate := decimal.Zero
	if monthIncome.GreaterThan(decimal.Zero) {
		savingsRate = netSavings.Div(monthIncome).Mul(decimal.NewFromInt(100)).Round(2)
	}

	return &models.AnalyticsSummary{
		NetWorth:           netWorth,
		MonthIncome:        monthIncome,
		MonthExpense:       monthExpense,
		NetSavings:         netSavings,
		SavingsRatePercent: savingsRate,
		Currency:           baseCurrency,
	}, nil
}

// GetCategoryExpenses returns expenses aggregated by category for a given month (YYYY-MM).
func (r *Repository) GetCategoryExpenses(ctx context.Context, profileID uuid.UUID, monthPeriod string) ([]models.CategoryExpenseItem, error) {
	if monthPeriod == "" {
		monthPeriod = time.Now().Format("2006-01")
	}

	query := `
		SELECT 
			c.id AS category_id,
			c.name AS category_name,
			c.icon AS category_icon,
			c.color AS category_color,
			to_char(t.date, 'YYYY-MM') AS month_period,
			COUNT(t.id) AS transaction_count,
			COALESCE(SUM(t.base_amount), 0) AS total_spent,
			COALESCE(ROUND(AVG(t.base_amount), 2), 0) AS average_ticket
		FROM koin_finance.transactions t
		JOIN koin_finance.categories c ON t.category_id = c.id
		WHERE t.profile_id = $1 AND t.type = 'expense' AND to_char(t.date, 'YYYY-MM') = $2
		GROUP BY c.id, c.name, c.icon, c.color, to_char(t.date, 'YYYY-MM')
		ORDER BY total_spent DESC
	`

	rows, err := r.pool.Query(ctx, query, profileID, monthPeriod)
	if err != nil {
		return nil, fmt.Errorf("error querying category expenses: %w", err)
	}
	defer rows.Close()

	var items []models.CategoryExpenseItem
	totalAll := decimal.Zero

	for rows.Next() {
		var item models.CategoryExpenseItem
		err := rows.Scan(
			&item.CategoryID,
			&item.CategoryName,
			&item.CategoryIcon,
			&item.CategoryColor,
			&item.MonthPeriod,
			&item.TransactionCount,
			&item.TotalSpent,
			&item.AverageTicket,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning category expense item: %w", err)
		}
		totalAll = totalAll.Add(item.TotalSpent)
		items = append(items, item)
	}

	// Calculate percentages
	if totalAll.GreaterThan(decimal.Zero) {
		for i := range items {
			items[i].Percentage = items[i].TotalSpent.Div(totalAll).Mul(decimal.NewFromInt(100)).Round(1)
		}
	}

	return items, nil
}

// GetMonthlyCashflow returns monthly cashflow for the last N months.
func (r *Repository) GetMonthlyCashflow(ctx context.Context, profileID uuid.UUID, months int) ([]models.MonthlyCashflowItem, error) {
	if months <= 0 || months > 24 {
		months = 6
	}

	query := `
		SELECT 
			to_char(t.date, 'YYYY-MM') AS month_period,
			COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.base_amount ELSE 0 END), 0) AS total_income,
			COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.base_amount ELSE 0 END), 0) AS total_expense,
			COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.base_amount ELSE -t.base_amount END), 0) AS net_savings,
			CASE 
				WHEN SUM(CASE WHEN t.type = 'income' THEN t.base_amount ELSE 0 END) > 0 
				THEN ROUND(
					((SUM(CASE WHEN t.type = 'income' THEN t.base_amount ELSE 0 END) - 
					  SUM(CASE WHEN t.type = 'expense' THEN t.base_amount ELSE 0 END)) / 
					 SUM(CASE WHEN t.type = 'income' THEN t.base_amount ELSE 0 END)) * 100, 2
				)
				ELSE 0 
			END AS savings_rate_percent
		FROM koin_finance.transactions t
		WHERE t.profile_id = $1
		GROUP BY to_char(t.date, 'YYYY-MM')
		ORDER BY month_period DESC
		LIMIT $2
	`

	rows, err := r.pool.Query(ctx, query, profileID, months)
	if err != nil {
		return nil, fmt.Errorf("error querying monthly cashflow: %w", err)
	}
	defer rows.Close()

	var descItems []models.MonthlyCashflowItem
	for rows.Next() {
		var item models.MonthlyCashflowItem
		err := rows.Scan(
			&item.MonthPeriod,
			&item.TotalIncome,
			&item.TotalExpense,
			&item.NetSavings,
			&item.SavingsRatePercent,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning cashflow item: %w", err)
		}
		descItems = append(descItems, item)
	}

	// Reverse so results are chronological (oldest to newest) for charts
	chronological := make([]models.MonthlyCashflowItem, len(descItems))
	for i, item := range descItems {
		chronological[len(descItems)-1-i] = item
	}

	return chronological, nil
}
