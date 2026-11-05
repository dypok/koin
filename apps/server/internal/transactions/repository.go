package transactions

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
	"koin/server/internal/models"
)

var (
	ErrTransactionNotFound = errors.New("transacción no encontrada o sin permisos de acceso")
	ErrAccountNotFound     = errors.New("cuenta no encontrada o sin permisos de acceso")
	ErrForbidden           = errors.New("no tienes permisos para realizar operaciones en esta cuenta")
	ErrSameAccountTransfer = errors.New("la cuenta de origen y destino no pueden ser la misma")
	ErrNegativeAmount      = errors.New("el importe de la transacción debe ser mayor a cero")
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// GetExchangeRate looks up the currency exchange rate between from and to.
func (r *Repository) GetExchangeRate(ctx context.Context, from, to string) (decimal.Decimal, error) {
	from = strings.ToUpper(strings.TrimSpace(from))
	to = strings.ToUpper(strings.TrimSpace(to))

	if from == "" || to == "" || from == to {
		return decimal.NewFromInt(1), nil
	}

	// 1. Direct pair: e.g. USD_COP
	var rate decimal.Decimal
	query := `SELECT rate FROM system.exchange_rates WHERE from_currency = $1 AND to_currency = $2`
	err := r.pool.QueryRow(ctx, query, from, to).Scan(&rate)
	if err == nil && !rate.IsZero() {
		return rate, nil
	}

	// 2. Inverse pair: e.g. COP_USD -> 1 / rate
	var invRate decimal.Decimal
	err = r.pool.QueryRow(ctx, query, to, from).Scan(&invRate)
	if err == nil && !invRate.IsZero() {
		return decimal.NewFromInt(1).DivRound(invRate, 6), nil
	}

	// 3. Triangulation through USD
	if from != "USD" && to != "USD" {
		rateFromUSD, errFrom := r.GetExchangeRate(ctx, from, "USD")
		rateUSDTo, errTo := r.GetExchangeRate(ctx, "USD", to)
		if errFrom == nil && errTo == nil && !rateFromUSD.IsZero() && !rateUSDTo.IsZero() {
			return rateFromUSD.Mul(rateUSDTo).Round(6), nil
		}
	}

	// Fallback to 1.0 if not available
	return decimal.NewFromInt(1), nil
}

// ListExchangeRates returns all stored currency rates.
func (r *Repository) ListExchangeRates(ctx context.Context) ([]models.ExchangeRate, error) {
	query := `
		SELECT pair, from_currency, to_currency, rate, updated_at
		FROM system.exchange_rates
		ORDER BY pair ASC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("error querying exchange rates: %w", err)
	}
	defer rows.Close()

	var rates []models.ExchangeRate
	for rows.Next() {
		var rate models.ExchangeRate
		if err := rows.Scan(&rate.Pair, &rate.FromCurrency, &rate.ToCurrency, &rate.Rate, &rate.UpdatedAt); err != nil {
			return nil, fmt.Errorf("error scanning exchange rate: %w", err)
		}
		rates = append(rates, rate)
	}
	return rates, nil
}

// CheckAccountAccess checks if the given profile has owner or editor permissions on the account.
func (r *Repository) CheckAccountAccess(ctx context.Context, accountID, profileID uuid.UUID) (string, string, error) {
	query := `
		SELECT 
			a.currency,
			CASE 
				WHEN a.created_by_profile_id = $2 THEN 'owner'
				ELSE COALESCE(am.role, '')
			END AS role
		FROM finance.accounts a
		LEFT JOIN finance.account_members am 
			ON am.account_id = a.id AND am.profile_id = $2 AND am.status = 'accepted'
		WHERE a.id = $1 AND (a.created_by_profile_id = $2 OR am.profile_id = $2)
	`
	var currency, role string
	err := r.pool.QueryRow(ctx, query, accountID, profileID).Scan(&currency, &role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", "", ErrAccountNotFound
		}
		return "", "", fmt.Errorf("error checking account permissions: %w", err)
	}

	if role != "owner" && role != "editor" {
		return currency, role, ErrForbidden
	}

	return currency, role, nil
}

// GetProfileBaseCurrency returns the base currency configured for the profile.
func (r *Repository) GetProfileBaseCurrency(ctx context.Context, profileID uuid.UUID) (string, error) {
	var baseCurrency string
	query := `SELECT base_currency FROM auth.profiles WHERE id = $1`
	err := r.pool.QueryRow(ctx, query, profileID).Scan(&baseCurrency)
	if err != nil {
		return "USD", err
	}
	if baseCurrency == "" {
		baseCurrency = "USD"
	}
	return baseCurrency, nil
}

// syncAccountBalance updates current_balance on finance.accounts for an account.
func syncAccountBalance(ctx context.Context, tx pgx.Tx, accountID uuid.UUID) error {
	query := `
		UPDATE finance.accounts a
		SET current_balance = a.initial_balance + COALESCE((
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
		), 0),
		updated_at = NOW()
		WHERE a.id = $1
	`
	_, err := tx.Exec(ctx, query, accountID)
	return err
}

// Create records an income or expense atomically and updates account balance.
func (r *Repository) Create(ctx context.Context, t *models.Transaction) (*models.Transaction, error) {
	dbTx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("error beginning transaction: %w", err)
	}
	defer func() {
		_ = dbTx.Rollback(ctx)
	}()

	query := `
		INSERT INTO finance.transactions (
			profile_id, account_id, to_account_id, category_id,
			type, amount, to_amount, currency, exchange_rate_to_base, base_amount,
			date, note, tags, is_recurring
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id, created_at, updated_at
	`

	err = dbTx.QueryRow(ctx, query,
		t.ProfileID,
		t.AccountID,
		t.ToAccountID,
		t.CategoryID,
		t.Type,
		t.Amount,
		t.ToAmount,
		t.Currency,
		t.ExchangeRateToBase,
		t.BaseAmount,
		t.Date,
		t.Note,
		t.Tags,
		t.IsRecurring,
	).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("error inserting transaction: %w", err)
	}

	// Update balance of the account
	if err := syncAccountBalance(ctx, dbTx, t.AccountID); err != nil {
		return nil, fmt.Errorf("error updating account balance: %w", err)
	}

	// If it's a transfer, also sync destination account
	if t.Type == "transfer" && t.ToAccountID != nil {
		if err := syncAccountBalance(ctx, dbTx, *t.ToAccountID); err != nil {
			return nil, fmt.Errorf("error updating destination account balance: %w", err)
		}
	}

	if err := dbTx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("error committing transaction: %w", err)
	}

	return r.GetByID(ctx, t.ID, t.ProfileID)
}

// CreateTransfer performs an atomic ACID transfer between two accounts.
func (r *Repository) CreateTransfer(ctx context.Context, profileID uuid.UUID, t *models.Transaction) (*models.Transaction, error) {
	dbTx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("error beginning ACID transfer: %w", err)
	}
	defer func() {
		_ = dbTx.Rollback(ctx)
	}()

	query := `
		INSERT INTO finance.transactions (
			profile_id, account_id, to_account_id, category_id,
			type, amount, to_amount, currency, exchange_rate_to_base, base_amount,
			date, note, tags, is_recurring
		)
		VALUES ($1, $2, $3, $4, 'transfer', $5, $6, $7, $8, $9, $10, $11, $12, false)
		RETURNING id, created_at, updated_at
	`

	err = dbTx.QueryRow(ctx, query,
		t.ProfileID,
		t.AccountID,
		t.ToAccountID,
		t.CategoryID,
		t.Amount,
		t.ToAmount,
		t.Currency,
		t.ExchangeRateToBase,
		t.BaseAmount,
		t.Date,
		t.Note,
		t.Tags,
	).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("error inserting transfer record: %w", err)
	}

	// Atomically sync source account balance
	if err := syncAccountBalance(ctx, dbTx, t.AccountID); err != nil {
		return nil, fmt.Errorf("error updating source account balance: %w", err)
	}

	// Atomically sync destination account balance
	if t.ToAccountID != nil {
		if err := syncAccountBalance(ctx, dbTx, *t.ToAccountID); err != nil {
			return nil, fmt.Errorf("error updating destination account balance: %w", err)
		}
	}

	if err := dbTx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("error committing transfer: %w", err)
	}

	return r.GetByID(ctx, t.ID, t.ProfileID)
}

// List returns filtered and paginated transactions with relational metadata.
func (r *Repository) List(ctx context.Context, filter models.TransactionFilter) (*models.PaginatedTransactions, error) {
	var conditions []string
	var args []any
	argIdx := 1

	// Access control: transactions must belong to profile, or accounts the profile has access to
	conditions = append(conditions, fmt.Sprintf(`(
		t.profile_id = $%d 
		OR t.account_id IN (
			SELECT a.id FROM finance.accounts a 
			LEFT JOIN finance.account_members am ON am.account_id = a.id AND am.profile_id = $%d AND am.status = 'accepted'
			WHERE a.created_by_profile_id = $%d OR am.profile_id = $%d
		)
	)`, argIdx, argIdx, argIdx, argIdx))
	args = append(args, filter.ProfileID)
	argIdx++

	if filter.AccountID != nil {
		conditions = append(conditions, fmt.Sprintf(`(t.account_id = $%d OR t.to_account_id = $%d)`, argIdx, argIdx))
		args = append(args, *filter.AccountID)
		argIdx++
	}

	if filter.CategoryID != nil {
		conditions = append(conditions, fmt.Sprintf(`t.category_id = $%d`, argIdx))
		args = append(args, *filter.CategoryID)
		argIdx++
	}

	if filter.Type != nil && strings.TrimSpace(*filter.Type) != "" {
		conditions = append(conditions, fmt.Sprintf(`t.type = $%d`, argIdx))
		args = append(args, strings.TrimSpace(*filter.Type))
		argIdx++
	}

	if filter.StartDate != nil {
		conditions = append(conditions, fmt.Sprintf(`t.date >= $%d`, argIdx))
		args = append(args, *filter.StartDate)
		argIdx++
	}

	if filter.EndDate != nil {
		conditions = append(conditions, fmt.Sprintf(`t.date <= $%d`, argIdx))
		args = append(args, *filter.EndDate)
		argIdx++
	}

	if filter.Search != nil && strings.TrimSpace(*filter.Search) != "" {
		searchPattern := "%" + strings.TrimSpace(*filter.Search) + "%"
		conditions = append(conditions, fmt.Sprintf(`(t.note ILIKE $%d OR $%d = ANY(t.tags))`, argIdx, argIdx+1))
		args = append(args, searchPattern, strings.TrimSpace(*filter.Search))
		argIdx += 2
	}

	whereClause := "WHERE " + strings.Join(conditions, " AND ")

	// Total count
	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM finance.transactions t %s`, whereClause)
	var totalCount int
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&totalCount); err != nil {
		return nil, fmt.Errorf("error counting transactions: %w", err)
	}

	// Pagination limits
	limit := filter.Limit
	if limit <= 0 {
		limit = 50
	} else if limit > 200 {
		limit = 200
	}

	offset := filter.Offset
	if offset < 0 {
		offset = 0
	}

	selectQuery := fmt.Sprintf(`
		SELECT 
			t.id,
			t.profile_id,
			t.account_id,
			t.to_account_id,
			t.category_id,
			t.type,
			t.amount,
			t.to_amount,
			t.currency,
			t.exchange_rate_to_base,
			t.base_amount,
			t.date,
			t.note,
			COALESCE(t.tags, ARRAY[]::text[]),
			t.is_recurring,
			t.created_at,
			t.updated_at,
			a.name AS account_name,
			a.color AS account_color,
			a.icon AS account_icon,
			a.currency AS account_currency,
			to_a.name AS to_account_name,
			to_a.color AS to_account_color,
			to_a.icon AS to_account_icon,
			to_a.currency AS to_account_currency,
			c.name AS category_name,
			c.icon AS category_icon,
			c.color AS category_color
		FROM finance.transactions t
		JOIN finance.accounts a ON t.account_id = a.id
		LEFT JOIN finance.accounts to_a ON t.to_account_id = to_a.id
		LEFT JOIN finance.categories c ON t.category_id = c.id
		%s
		ORDER BY t.date DESC, t.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("error querying transactions: %w", err)
	}
	defer rows.Close()

	var items []models.Transaction
	for rows.Next() {
		var item models.Transaction
		err := rows.Scan(
			&item.ID,
			&item.ProfileID,
			&item.AccountID,
			&item.ToAccountID,
			&item.CategoryID,
			&item.Type,
			&item.Amount,
			&item.ToAmount,
			&item.Currency,
			&item.ExchangeRateToBase,
			&item.BaseAmount,
			&item.Date,
			&item.Note,
			&item.Tags,
			&item.IsRecurring,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.AccountName,
			&item.AccountColor,
			&item.AccountIcon,
			&item.AccountCurrency,
			&item.ToAccountName,
			&item.ToAccountColor,
			&item.ToAccountIcon,
			&item.ToAccountCurrency,
			&item.CategoryName,
			&item.CategoryIcon,
			&item.CategoryColor,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning transaction: %w", err)
		}
		items = append(items, item)
	}

	hasMore := (offset + len(items)) < totalCount

	return &models.PaginatedTransactions{
		Items:      items,
		TotalCount: totalCount,
		Limit:      limit,
		Offset:     offset,
		HasMore:    hasMore,
	}, nil
}

// GetByID returns a single transaction with joined details and access check.
func (r *Repository) GetByID(ctx context.Context, id, profileID uuid.UUID) (*models.Transaction, error) {
	query := `
		SELECT 
			t.id,
			t.profile_id,
			t.account_id,
			t.to_account_id,
			t.category_id,
			t.type,
			t.amount,
			t.to_amount,
			t.currency,
			t.exchange_rate_to_base,
			t.base_amount,
			t.date,
			t.note,
			COALESCE(t.tags, ARRAY[]::text[]),
			t.is_recurring,
			t.created_at,
			t.updated_at,
			a.name AS account_name,
			a.color AS account_color,
			a.icon AS account_icon,
			a.currency AS account_currency,
			to_a.name AS to_account_name,
			to_a.color AS to_account_color,
			to_a.icon AS to_account_icon,
			to_a.currency AS to_account_currency,
			c.name AS category_name,
			c.icon AS category_icon,
			c.color AS category_color
		FROM finance.transactions t
		JOIN finance.accounts a ON t.account_id = a.id
		LEFT JOIN finance.accounts to_a ON t.to_account_id = to_a.id
		LEFT JOIN finance.categories c ON t.category_id = c.id
		WHERE t.id = $1 AND (
			t.profile_id = $2 
			OR t.account_id IN (
				SELECT a2.id FROM finance.accounts a2 
				LEFT JOIN finance.account_members am ON am.account_id = a2.id AND am.profile_id = $2 AND am.status = 'accepted'
				WHERE a2.created_by_profile_id = $2 OR am.profile_id = $2
			)
		)
	`
	var item models.Transaction
	err := r.pool.QueryRow(ctx, query, id, profileID).Scan(
		&item.ID,
		&item.ProfileID,
		&item.AccountID,
		&item.ToAccountID,
		&item.CategoryID,
		&item.Type,
		&item.Amount,
		&item.ToAmount,
		&item.Currency,
		&item.ExchangeRateToBase,
		&item.BaseAmount,
		&item.Date,
		&item.Note,
		&item.Tags,
		&item.IsRecurring,
		&item.CreatedAt,
		&item.UpdatedAt,
		&item.AccountName,
		&item.AccountColor,
		&item.AccountIcon,
		&item.AccountCurrency,
		&item.ToAccountName,
		&item.ToAccountColor,
		&item.ToAccountIcon,
		&item.ToAccountCurrency,
		&item.CategoryName,
		&item.CategoryIcon,
		&item.CategoryColor,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrTransactionNotFound
		}
		return nil, fmt.Errorf("error getting transaction: %w", err)
	}
	return &item, nil
}

// Update modifies transaction details, adjusting balances atomically if amounts change.
func (r *Repository) Update(ctx context.Context, id, profileID uuid.UUID, req models.UpdateTransactionRequest) (*models.Transaction, error) {
	current, err := r.GetByID(ctx, id, profileID)
	if err != nil {
		return nil, err
	}

	dbTx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("error beginning update transaction: %w", err)
	}
	defer func() {
		_ = dbTx.Rollback(ctx)
	}()

	setClauses := []string{"updated_at = NOW()"}
	args := []any{id}
	argIdx := 2

	if req.Note != nil {
		setClauses = append(setClauses, fmt.Sprintf("note = $%d", argIdx))
		args = append(args, strings.TrimSpace(*req.Note))
		argIdx++
	}

	if req.Tags != nil {
		setClauses = append(setClauses, fmt.Sprintf("tags = $%d", argIdx))
		args = append(args, *req.Tags)
		argIdx++
	}

	if req.CategoryID != nil {
		setClauses = append(setClauses, fmt.Sprintf("category_id = $%d", argIdx))
		args = append(args, *req.CategoryID)
		argIdx++
	}

	if req.Date != nil && !req.Date.IsZero() {
		setClauses = append(setClauses, fmt.Sprintf("date = $%d", argIdx))
		args = append(args, *req.Date)
		argIdx++
	}

	amountChanged := false
	if req.Amount != nil && !req.Amount.IsZero() && !req.Amount.Equal(current.Amount) {
		amountChanged = true
		setClauses = append(setClauses, fmt.Sprintf("amount = $%d", argIdx))
		args = append(args, *req.Amount)
		argIdx++

		// Recompute base amount
		exchangeRate := current.ExchangeRateToBase
		if req.ExchangeRateToBase != nil && !req.ExchangeRateToBase.IsZero() {
			exchangeRate = *req.ExchangeRateToBase
			setClauses = append(setClauses, fmt.Sprintf("exchange_rate_to_base = $%d", argIdx))
			args = append(args, exchangeRate)
			argIdx++
		}
		newBaseAmount := req.Amount.Mul(exchangeRate).Round(2)
		setClauses = append(setClauses, fmt.Sprintf("base_amount = $%d", argIdx))
		args = append(args, newBaseAmount)
		argIdx++
	}

	if req.ToAmount != nil {
		amountChanged = true
		setClauses = append(setClauses, fmt.Sprintf("to_amount = $%d", argIdx))
		args = append(args, *req.ToAmount)
		argIdx++
	}

	query := fmt.Sprintf(`
		UPDATE finance.transactions
		SET %s
		WHERE id = $1
	`, strings.Join(setClauses, ", "))

	if _, err := dbTx.Exec(ctx, query, args...); err != nil {
		return nil, fmt.Errorf("error updating transaction record: %w", err)
	}

	if amountChanged {
		if err := syncAccountBalance(ctx, dbTx, current.AccountID); err != nil {
			return nil, fmt.Errorf("error recalculating account balance: %w", err)
		}
		if current.Type == "transfer" && current.ToAccountID != nil {
			if err := syncAccountBalance(ctx, dbTx, *current.ToAccountID); err != nil {
				return nil, fmt.Errorf("error recalculating destination account balance: %w", err)
			}
		}
	}

	if err := dbTx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("error committing update: %w", err)
	}

	return r.GetByID(ctx, id, profileID)
}

// Delete removes a transaction and reverses the balance on the affected accounts.
func (r *Repository) Delete(ctx context.Context, id, profileID uuid.UUID) error {
	current, err := r.GetByID(ctx, id, profileID)
	if err != nil {
		return err
	}

	dbTx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("error beginning delete transaction: %w", err)
	}
	defer func() {
		_ = dbTx.Rollback(ctx)
	}()

	delQuery := `DELETE FROM finance.transactions WHERE id = $1`
	if _, err := dbTx.Exec(ctx, delQuery, id); err != nil {
		return fmt.Errorf("error deleting transaction: %w", err)
	}

	// Re-sync balance of account
	if err := syncAccountBalance(ctx, dbTx, current.AccountID); err != nil {
		return fmt.Errorf("error recalculating balance after delete: %w", err)
	}

	// If it was a transfer, also re-sync destination account
	if current.Type == "transfer" && current.ToAccountID != nil {
		if err := syncAccountBalance(ctx, dbTx, *current.ToAccountID); err != nil {
			return fmt.Errorf("error recalculating destination balance after delete: %w", err)
		}
	}

	return dbTx.Commit(ctx)
}
