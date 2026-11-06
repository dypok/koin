package budgets

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"koin/server/internal/models"
)

var (
	ErrBudgetNotFound   = errors.New("presupuesto no encontrado")
	ErrCategoryNotFound = errors.New("categoría no encontrada o no pertenece al perfil")
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ListByProfile returns all budgets for a profile enriched with category info and month spending.
func (r *Repository) ListByProfile(ctx context.Context, profileID uuid.UUID, month string) ([]models.Budget, error) {
	if month == "" {
		month = time.Now().Format("2006-01")
	}

	query := `
		SELECT 
			b.id,
			b.profile_id,
			b.category_id,
			b.period,
			b.limit_amount,
			b.alert_threshold_percent,
			b.created_at,
			b.updated_at,
			c.name AS category_name,
			c.icon AS category_icon,
			c.color AS category_color,
			COALESCE(SUM(t.base_amount), 0) AS spent_amount
		FROM koin_finance.budgets b
		JOIN koin_finance.categories c ON b.category_id = c.id
		LEFT JOIN koin_finance.transactions t ON t.category_id = b.category_id 
			AND t.profile_id = b.profile_id 
			AND t.type = 'expense'
			AND to_char(t.date, 'YYYY-MM') = $2
		WHERE b.profile_id = $1
		GROUP BY b.id, b.profile_id, b.category_id, b.period, b.limit_amount, b.alert_threshold_percent, b.created_at, b.updated_at, c.name, c.icon, c.color
		ORDER BY b.limit_amount DESC, c.name ASC
	`

	rows, err := r.pool.Query(ctx, query, profileID, month)
	if err != nil {
		return nil, fmt.Errorf("error querying budgets: %w", err)
	}
	defer rows.Close()

	var budgets []models.Budget
	for rows.Next() {
		var b models.Budget
		err := rows.Scan(
			&b.ID,
			&b.ProfileID,
			&b.CategoryID,
			&b.Period,
			&b.LimitAmount,
			&b.AlertThresholdPercent,
			&b.CreatedAt,
			&b.UpdatedAt,
			&b.CategoryName,
			&b.CategoryIcon,
			&b.CategoryColor,
			&b.SpentAmount,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning budget: %w", err)
		}
		budgets = append(budgets, b)
	}

	return budgets, nil
}

// GetByID returns a single budget by ID.
func (r *Repository) GetByID(ctx context.Context, id, profileID uuid.UUID, month string) (*models.Budget, error) {
	if month == "" {
		month = time.Now().Format("2006-01")
	}

	query := `
		SELECT 
			b.id,
			b.profile_id,
			b.category_id,
			b.period,
			b.limit_amount,
			b.alert_threshold_percent,
			b.created_at,
			b.updated_at,
			c.name AS category_name,
			c.icon AS category_icon,
			c.color AS category_color,
			COALESCE(SUM(t.base_amount), 0) AS spent_amount
		FROM koin_finance.budgets b
		JOIN koin_finance.categories c ON b.category_id = c.id
		LEFT JOIN koin_finance.transactions t ON t.category_id = b.category_id 
			AND t.profile_id = b.profile_id 
			AND t.type = 'expense'
			AND to_char(t.date, 'YYYY-MM') = $3
		WHERE b.id = $1 AND b.profile_id = $2
		GROUP BY b.id, b.profile_id, b.category_id, b.period, b.limit_amount, b.alert_threshold_percent, b.created_at, b.updated_at, c.name, c.icon, c.color
	`

	var b models.Budget
	err := r.pool.QueryRow(ctx, query, id, profileID, month).Scan(
		&b.ID,
		&b.ProfileID,
		&b.CategoryID,
		&b.Period,
		&b.LimitAmount,
		&b.AlertThresholdPercent,
		&b.CreatedAt,
		&b.UpdatedAt,
		&b.CategoryName,
		&b.CategoryIcon,
		&b.CategoryColor,
		&b.SpentAmount,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrBudgetNotFound
		}
		return nil, fmt.Errorf("error getting budget: %w", err)
	}

	return &b, nil
}

// Upsert creates or updates a budget for a given profile and category.
func (r *Repository) Upsert(ctx context.Context, profileID uuid.UUID, req models.CreateOrUpdateBudgetRequest) (*models.Budget, error) {
	// Verify category belongs to profile
	var catExists bool
	catCheckQuery := `SELECT EXISTS(SELECT 1 FROM koin_finance.categories WHERE id = $1 AND profile_id = $2)`
	if err := r.pool.QueryRow(ctx, catCheckQuery, req.CategoryID, profileID).Scan(&catExists); err != nil {
		return nil, fmt.Errorf("error validating category: %w", err)
	}
	if !catExists {
		return nil, ErrCategoryNotFound
	}

	period := "monthly"
	if req.Period != nil && *req.Period != "" {
		period = *req.Period
	}

	alertThreshold := 80
	if req.AlertThresholdPercent != nil && *req.AlertThresholdPercent > 0 && *req.AlertThresholdPercent <= 100 {
		alertThreshold = *req.AlertThresholdPercent
	}

	query := `
		INSERT INTO koin_finance.budgets (
			profile_id, category_id, period, limit_amount, alert_threshold_percent, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		ON CONFLICT (profile_id, category_id, period)
		DO UPDATE SET 
			limit_amount = EXCLUDED.limit_amount,
			alert_threshold_percent = EXCLUDED.alert_threshold_percent,
			updated_at = NOW()
		RETURNING id
	`

	var id uuid.UUID
	err := r.pool.QueryRow(ctx, query, profileID, req.CategoryID, period, req.LimitAmount, alertThreshold).Scan(&id)
	if err != nil {
		return nil, fmt.Errorf("error upserting budget: %w", err)
	}

	return r.GetByID(ctx, id, profileID, "")
}

// Update modifies budget limit or alert threshold.
func (r *Repository) Update(ctx context.Context, id, profileID uuid.UUID, req models.UpdateBudgetRequest) (*models.Budget, error) {
	current, err := r.GetByID(ctx, id, profileID, "")
	if err != nil {
		return nil, err
	}

	newLimit := current.LimitAmount
	if req.LimitAmount != nil {
		newLimit = *req.LimitAmount
	}

	newThreshold := current.AlertThresholdPercent
	if req.AlertThresholdPercent != nil && *req.AlertThresholdPercent > 0 && *req.AlertThresholdPercent <= 100 {
		newThreshold = *req.AlertThresholdPercent
	}

	query := `
		UPDATE koin_finance.budgets
		SET limit_amount = $1, alert_threshold_percent = $2, updated_at = $3
		WHERE id = $4 AND profile_id = $5
	`
	_, err = r.pool.Exec(ctx, query, newLimit, newThreshold, time.Now(), id, profileID)
	if err != nil {
		return nil, fmt.Errorf("error updating budget: %w", err)
	}

	return r.GetByID(ctx, id, profileID, "")
}

// Delete removes a budget.
func (r *Repository) Delete(ctx context.Context, id, profileID uuid.UUID) error {
	query := `DELETE FROM koin_finance.budgets WHERE id = $1 AND profile_id = $2`
	res, err := r.pool.Exec(ctx, query, id, profileID)
	if err != nil {
		return fmt.Errorf("error deleting budget: %w", err)
	}
	if res.RowsAffected() == 0 {
		return ErrBudgetNotFound
	}
	return nil
}
