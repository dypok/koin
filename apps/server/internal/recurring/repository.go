package recurring

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
	"koin/server/internal/models"
)

var (
	ErrRuleNotFound       = errors.New("regla recurrente no encontrada o sin permisos de acceso")
	ErrRuleAlreadyCompleted = errors.New("la regla ya ha completado todas sus cuotas")
	ErrRuleNotActive      = errors.New("la regla recurrente está pausada o inactiva")
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// Create inserts a new recurring rule or installment debt.
func (r *Repository) Create(ctx context.Context, profileID uuid.UUID, req models.CreateRecurringRuleRequest, nextRunDate time.Time) (*models.RecurringRule, error) {
	query := `
		INSERT INTO finance.recurring_rules (
			profile_id,
			account_id,
			category_id,
			name,
			type,
			amount,
			currency,
			frequency,
			day_of_month,
			is_installment,
			total_installments,
			current_installment,
			principal_amount,
			total_interest_amount,
			installment_principal,
			installment_interest,
			interest_rate,
			auto_apply,
			next_run_date,
			status,
			note
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, 0, $12, $13, $14, $15, $16, $17, $18, 'active', $19
		)
		RETURNING id, created_at, updated_at
	`

	var rule models.RecurringRule
	rule.ProfileID = profileID
	rule.AccountID = req.AccountID
	rule.CategoryID = req.CategoryID
	rule.Name = req.Name
	rule.Type = req.Type
	rule.Amount = req.Amount
	rule.Currency = req.Currency
	rule.Frequency = req.Frequency
	rule.DayOfMonth = req.DayOfMonth
	rule.IsInstallment = req.IsInstallment
	rule.TotalInstallments = req.TotalInstallments
	rule.CurrentInstallment = 0
	rule.PrincipalAmount = req.PrincipalAmount
	rule.TotalInterestAmount = req.TotalInterestAmount
	rule.InstallmentPrincipal = req.InstallmentPrincipal
	rule.InstallmentInterest = req.InstallmentInterest
	rule.InterestRate = req.InterestRate
	rule.AutoApply = req.AutoApply
	rule.NextRunDate = nextRunDate
	rule.Status = "active"
	rule.Note = req.Note

	err := r.pool.QueryRow(ctx, query,
		profileID,
		req.AccountID,
		req.CategoryID,
		req.Name,
		req.Type,
		req.Amount,
		req.Currency,
		req.Frequency,
		req.DayOfMonth,
		req.IsInstallment,
		req.TotalInstallments,
		req.PrincipalAmount,
		req.TotalInterestAmount,
		req.InstallmentPrincipal,
		req.InstallmentInterest,
		req.InterestRate,
		req.AutoApply,
		nextRunDate,
		req.Note,
	).Scan(&rule.ID, &rule.CreatedAt, &rule.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("error creating recurring rule: %w", err)
	}

	return r.GetByID(ctx, rule.ID, profileID)
}

// GetByID retrieves a single recurring rule by ID and profile with related names.
func (r *Repository) GetByID(ctx context.Context, id, profileID uuid.UUID) (*models.RecurringRule, error) {
	query := `
		SELECT 
			rr.id,
			rr.profile_id,
			rr.account_id,
			rr.category_id,
			rr.name,
			rr.type,
			rr.amount,
			rr.currency,
			rr.frequency,
			rr.day_of_month,
			rr.is_installment,
			rr.total_installments,
			rr.current_installment,
			rr.principal_amount,
			rr.total_interest_amount,
			rr.installment_principal,
			rr.installment_interest,
			rr.interest_rate,
			rr.auto_apply,
			rr.next_run_date,
			rr.last_run_at,
			rr.status,
			rr.note,
			rr.created_at,
			rr.updated_at,
			a.name AS account_name,
			a.color AS account_color,
			a.icon AS account_icon,
			a.institution_name AS account_institution_name,
			c.name AS category_name,
			c.icon AS category_icon,
			c.color AS category_color
		FROM finance.recurring_rules rr
		JOIN finance.accounts a ON a.id = rr.account_id
		LEFT JOIN finance.categories c ON c.id = rr.category_id
		WHERE rr.id = $1 AND rr.profile_id = $2
	`

	var rule models.RecurringRule
	err := r.pool.QueryRow(ctx, query, id, profileID).Scan(
		&rule.ID,
		&rule.ProfileID,
		&rule.AccountID,
		&rule.CategoryID,
		&rule.Name,
		&rule.Type,
		&rule.Amount,
		&rule.Currency,
		&rule.Frequency,
		&rule.DayOfMonth,
		&rule.IsInstallment,
		&rule.TotalInstallments,
		&rule.CurrentInstallment,
		&rule.PrincipalAmount,
		&rule.TotalInterestAmount,
		&rule.InstallmentPrincipal,
		&rule.InstallmentInterest,
		&rule.InterestRate,
		&rule.AutoApply,
		&rule.NextRunDate,
		&rule.LastRunAt,
		&rule.Status,
		&rule.Note,
		&rule.CreatedAt,
		&rule.UpdatedAt,
		&rule.AccountName,
		&rule.AccountColor,
		&rule.AccountIcon,
		&rule.AccountInstitutionName,
		&rule.CategoryName,
		&rule.CategoryIcon,
		&rule.CategoryColor,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRuleNotFound
		}
		return nil, fmt.Errorf("error querying recurring rule: %w", err)
	}

	return &rule, nil
}

// ListByProfile returns all recurring rules for a profile, optionally filtered by status.
func (r *Repository) ListByProfile(ctx context.Context, profileID uuid.UUID, status *string) ([]models.RecurringRule, error) {
	query := `
		SELECT 
			rr.id,
			rr.profile_id,
			rr.account_id,
			rr.category_id,
			rr.name,
			rr.type,
			rr.amount,
			rr.currency,
			rr.frequency,
			rr.day_of_month,
			rr.is_installment,
			rr.total_installments,
			rr.current_installment,
			rr.principal_amount,
			rr.total_interest_amount,
			rr.installment_principal,
			rr.installment_interest,
			rr.interest_rate,
			rr.auto_apply,
			rr.next_run_date,
			rr.last_run_at,
			rr.status,
			rr.note,
			rr.created_at,
			rr.updated_at,
			a.name AS account_name,
			a.color AS account_color,
			a.icon AS account_icon,
			a.institution_name AS account_institution_name,
			c.name AS category_name,
			c.icon AS category_icon,
			c.color AS category_color
		FROM finance.recurring_rules rr
		JOIN finance.accounts a ON a.id = rr.account_id
		LEFT JOIN finance.categories c ON c.id = rr.category_id
		WHERE rr.profile_id = $1
		  AND ($2::varchar IS NULL OR rr.status = $2)
		ORDER BY 
			CASE WHEN rr.status = 'active' THEN 1 WHEN rr.status = 'paused' THEN 2 ELSE 3 END,
			rr.next_run_date ASC,
			rr.created_at DESC
	`

	rows, err := r.pool.Query(ctx, query, profileID, status)
	if err != nil {
		return nil, fmt.Errorf("error listing recurring rules: %w", err)
	}
	defer rows.Close()

	var rules []models.RecurringRule
	for rows.Next() {
		var rule models.RecurringRule
		err := rows.Scan(
			&rule.ID,
			&rule.ProfileID,
			&rule.AccountID,
			&rule.CategoryID,
			&rule.Name,
			&rule.Type,
			&rule.Amount,
			&rule.Currency,
			&rule.Frequency,
			&rule.DayOfMonth,
			&rule.IsInstallment,
			&rule.TotalInstallments,
			&rule.CurrentInstallment,
			&rule.PrincipalAmount,
			&rule.TotalInterestAmount,
			&rule.InstallmentPrincipal,
			&rule.InstallmentInterest,
			&rule.InterestRate,
			&rule.AutoApply,
			&rule.NextRunDate,
			&rule.LastRunAt,
			&rule.Status,
			&rule.Note,
			&rule.CreatedAt,
			&rule.UpdatedAt,
			&rule.AccountName,
			&rule.AccountColor,
			&rule.AccountIcon,
			&rule.AccountInstitutionName,
			&rule.CategoryName,
			&rule.CategoryIcon,
			&rule.CategoryColor,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning recurring rule: %w", err)
		}
		rules = append(rules, rule)
	}

	if rules == nil {
		rules = []models.RecurringRule{}
	}

	return rules, nil
}

// Update modifies properties of an existing recurring rule.
func (r *Repository) Update(ctx context.Context, id, profileID uuid.UUID, req models.UpdateRecurringRuleRequest, nextRunDate *time.Time) (*models.RecurringRule, error) {
	query := `
		UPDATE finance.recurring_rules
		SET 
			name = COALESCE($3, name),
			account_id = COALESCE($4, account_id),
			category_id = COALESCE($5, category_id),
			amount = COALESCE($6, amount),
			day_of_month = COALESCE($7, day_of_month),
			auto_apply = COALESCE($8, auto_apply),
			next_run_date = COALESCE($9, next_run_date),
			status = COALESCE($10, status),
			current_installment = COALESCE($11, current_installment),
			note = COALESCE($12, note),
			updated_at = now()
		WHERE id = $1 AND profile_id = $2
	`

	cmd, err := r.pool.Exec(ctx, query,
		id,
		profileID,
		req.Name,
		req.AccountID,
		req.CategoryID,
		req.Amount,
		req.DayOfMonth,
		req.AutoApply,
		nextRunDate,
		req.Status,
		req.CurrentInstallment,
		req.Note,
	)
	if err != nil {
		return nil, fmt.Errorf("error updating recurring rule: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return nil, ErrRuleNotFound
	}

	return r.GetByID(ctx, id, profileID)
}

// Delete removes a recurring rule.
func (r *Repository) Delete(ctx context.Context, id, profileID uuid.UUID) error {
	query := `DELETE FROM finance.recurring_rules WHERE id = $1 AND profile_id = $2`
	cmd, err := r.pool.Exec(ctx, query, id, profileID)
	if err != nil {
		return fmt.Errorf("error deleting recurring rule: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return ErrRuleNotFound
	}
	return nil
}

// ExecuteInstallmentTx executes an atomic payment/credit for a recurring rule:
// 1. Locks the rule and verifies it is active.
// 2. Inserts a transaction into finance.transactions with installment number and interest details.
// 3. Updates the account balance.
// 4. Increments current_installment and updates next_run_date.
// 5. If all installments are completed, marks status = 'completed'.
func (r *Repository) ExecuteInstallmentTx(ctx context.Context, ruleID, profileID uuid.UUID) (*models.Transaction, *models.RecurringRule, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("error beginning tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Lock rule
	lockQuery := `
		SELECT 
			id, profile_id, account_id, category_id, name, type, amount, currency,
			frequency, day_of_month, is_installment, total_installments, current_installment,
			installment_principal, installment_interest, status, next_run_date
		FROM finance.recurring_rules
		WHERE id = $1 AND profile_id = $2
		FOR UPDATE
	`

	var rule models.RecurringRule
	err = tx.QueryRow(ctx, lockQuery, ruleID, profileID).Scan(
		&rule.ID,
		&rule.ProfileID,
		&rule.AccountID,
		&rule.CategoryID,
		&rule.Name,
		&rule.Type,
		&rule.Amount,
		&rule.Currency,
		&rule.Frequency,
		&rule.DayOfMonth,
		&rule.IsInstallment,
		&rule.TotalInstallments,
		&rule.CurrentInstallment,
		&rule.InstallmentPrincipal,
		&rule.InstallmentInterest,
		&rule.Status,
		&rule.NextRunDate,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil, ErrRuleNotFound
		}
		return nil, nil, fmt.Errorf("error locking recurring rule: %w", err)
	}

	if rule.Status == "completed" {
		return nil, nil, ErrRuleAlreadyCompleted
	}
	if rule.Status != "active" {
		return nil, nil, ErrRuleNotActive
	}

	// 2. Get Profile base currency for conversion
	var baseCurrency string
	err = tx.QueryRow(ctx, `SELECT base_currency FROM auth.profiles WHERE id = $1`, profileID).Scan(&baseCurrency)
	if err != nil {
		return nil, nil, fmt.Errorf("error getting base currency: %w", err)
	}

	// 3. Resolve exchange rate to base
	var exchangeRate decimal.Decimal = decimal.NewFromInt(1)
	if rule.Currency != baseCurrency {
		pair := fmt.Sprintf("%s/%s", rule.Currency, baseCurrency)
		var rate decimal.Decimal
		err = tx.QueryRow(ctx, `SELECT rate FROM system.exchange_rates WHERE pair = $1`, pair).Scan(&rate)
		if err == nil && !rate.IsZero() {
			exchangeRate = rate
		}
	}
	baseAmount := rule.Amount.Mul(exchangeRate).Round(2)

	// 4. Compute next installment number & contextual note
	nextInstallment := rule.CurrentInstallment + 1
	var noteStr string
	if rule.IsInstallment && rule.TotalInstallments != nil {
		if rule.InstallmentPrincipal != nil && rule.InstallmentInterest != nil && rule.InstallmentInterest.GreaterThan(decimal.Zero) {
			noteStr = fmt.Sprintf("Cuota %d/%d (Capital: $%s | Interés: $%s)",
				nextInstallment, *rule.TotalInstallments,
				rule.InstallmentPrincipal.StringFixed(2),
				rule.InstallmentInterest.StringFixed(2),
			)
		} else {
			noteStr = fmt.Sprintf("Cuota %d/%d", nextInstallment, *rule.TotalInstallments)
		}
	} else {
		noteStr = fmt.Sprintf("%s (Programado)", rule.Name)
	}

	// 5. Insert transaction
	insertTxnQuery := `
		INSERT INTO finance.transactions (
			profile_id,
			account_id,
			category_id,
			type,
			amount,
			currency,
			exchange_rate_to_base,
			base_amount,
			date,
			note,
			tags,
			is_recurring,
			recurring_rule_id,
			installment_number,
			principal_portion,
			interest_portion
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, now(), $9, $10, true, $11, $12, $13, $14
		)
		RETURNING 
			id, profile_id, account_id, to_account_id, category_id, type,
			amount, to_amount, currency, exchange_rate_to_base, base_amount,
			date, note, tags, is_recurring, recurring_rule_id, installment_number,
			principal_portion, interest_portion, created_at, updated_at
	`

	var txn models.Transaction
	var tags []string
	if rule.IsInstallment {
		tags = []string{"deuda", "cuota"}
	} else {
		tags = []string{"fijo", "recurrente"}
	}

	err = tx.QueryRow(ctx, insertTxnQuery,
		profileID,
		rule.AccountID,
		rule.CategoryID,
		rule.Type,
		rule.Amount,
		rule.Currency,
		exchangeRate,
		baseAmount,
		noteStr,
		tags,
		rule.ID,
		nextInstallment,
		rule.InstallmentPrincipal,
		rule.InstallmentInterest,
	).Scan(
		&txn.ID,
		&txn.ProfileID,
		&txn.AccountID,
		&txn.ToAccountID,
		&txn.CategoryID,
		&txn.Type,
		&txn.Amount,
		&txn.ToAmount,
		&txn.Currency,
		&txn.ExchangeRateToBase,
		&txn.BaseAmount,
		&txn.Date,
		&txn.Note,
		&txn.Tags,
		&txn.IsRecurring,
		&txn.RecurringRuleID,
		&txn.InstallmentNumber,
		&txn.PrincipalPortion,
		&txn.InterestPortion,
		&txn.CreatedAt,
		&txn.UpdatedAt,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("error creating installment transaction: %w", err)
	}

	// 6. Update Account Balance
	syncAccQuery := `
		UPDATE finance.accounts a
		SET 
			current_balance = (
				a.initial_balance + COALESCE((
					SELECT SUM(
						CASE 
							WHEN t.type = 'income' THEN t.amount
							WHEN t.type = 'expense' THEN -t.amount
							WHEN t.type = 'transfer' AND t.to_account_id = a.id THEN COALESCE(t.to_amount, t.amount)
							WHEN t.type = 'transfer' AND t.account_id = a.id THEN -t.amount
							ELSE 0
						END
					)
					FROM finance.transactions t
					WHERE t.account_id = a.id OR t.to_account_id = a.id
				), 0)
			),
			updated_at = now()
		WHERE a.id = $1
	`
	_, err = tx.Exec(ctx, syncAccQuery, rule.AccountID)
	if err != nil {
		return nil, nil, fmt.Errorf("error updating account balance: %w", err)
	}

	// 7. Calculate next run date
	nextDate := CalculateNextRunDate(rule.NextRunDate, rule.Frequency, rule.DayOfMonth)

	// Check if completed
	newStatus := "active"
	if rule.IsInstallment && rule.TotalInstallments != nil && nextInstallment >= *rule.TotalInstallments {
		newStatus = "completed"
	}

	updateRuleQuery := `
		UPDATE finance.recurring_rules
		SET 
			current_installment = $2,
			last_run_at = now(),
			next_run_date = $3,
			status = $4,
			updated_at = now()
		WHERE id = $1
	`
	_, err = tx.Exec(ctx, updateRuleQuery, rule.ID, nextInstallment, nextDate, newStatus)
	if err != nil {
		return nil, nil, fmt.Errorf("error updating recurring rule status: %w", err)
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, nil, fmt.Errorf("error committing tx: %w", err)
	}

	updatedRule, err := r.GetByID(ctx, rule.ID, profileID)
	if err != nil {
		return &txn, &rule, nil
	}

	return &txn, updatedRule, nil
}

// CalculateNextRunDate advances a date according to frequency.
func CalculateNextRunDate(current time.Time, frequency string, targetDay int) time.Time {
	switch frequency {
	case "weekly":
		return current.AddDate(0, 0, 7)
	case "biweekly":
		return current.AddDate(0, 0, 14)
	case "yearly":
		return current.AddDate(1, 0, 0)
	case "monthly":
		fallthrough
	default:
		// Advance one month
		year, month, _ := current.Date()
		nextMonth := month + 1
		nextYear := year
		if nextMonth > 12 {
			nextMonth = 1
			nextYear++
		}
		// Clamp day of month to maximum days in next month
		daysInNextMonth := time.Date(nextYear, nextMonth+1, 0, 0, 0, 0, 0, time.UTC).Day()
		d := targetDay
		if d > daysInNextMonth {
			d = daysInNextMonth
		}
		if d < 1 {
			d = 1
		}
		return time.Date(nextYear, nextMonth, d, 0, 0, 0, 0, time.UTC)
	}
}

// ProcessDueRules runs all rules across all profiles that are active, auto_apply = true, and next_run_date <= asOfDate.
func (r *Repository) ProcessDueRules(ctx context.Context, asOfDate time.Time) (int, error) {
	query := `
		SELECT id, profile_id 
		FROM finance.recurring_rules
		WHERE status = 'active'
		  AND auto_apply = true
		  AND next_run_date <= $1
	`
	rows, err := r.pool.Query(ctx, query, asOfDate)
	if err != nil {
		return 0, fmt.Errorf("error querying due recurring rules: %w", err)
	}
	defer rows.Close()

	type dueItem struct {
		id        uuid.UUID
		profileID uuid.UUID
	}
	var dues []dueItem
	for rows.Next() {
		var d dueItem
		if err := rows.Scan(&d.id, &d.profileID); err == nil {
			dues = append(dues, d)
		}
	}
	rows.Close()

	appliedCount := 0
	for _, d := range dues {
		_, _, err := r.ExecuteInstallmentTx(ctx, d.id, d.profileID)
		if err == nil {
			appliedCount++
		}
	}

	return appliedCount, nil
}
