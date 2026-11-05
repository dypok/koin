package categories

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"koin/server/internal/models"
)

var (
	ErrCategoryNotFound = errors.New("categoría no encontrada")
	ErrCategoryInUse    = errors.New("no es posible eliminar una categoría con movimientos registrados; mantén la categoría para conservar la integridad histórica")
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ListByProfile returns categories for a profile, enriched with usage count and ordered by popularity.
func (r *Repository) ListByProfile(ctx context.Context, profileID uuid.UUID) ([]models.CategoryWithUsage, error) {
	query := `
		SELECT 
			c.id,
			c.profile_id,
			c.name,
			c.type,
			c.icon,
			c.color,
			c.is_default,
			c.sort_order,
			c.created_at,
			COALESCE((
				SELECT COUNT(*)
				FROM finance.transactions t
				WHERE t.category_id = c.id AND t.profile_id = $1
			), 0) AS usage_count
		FROM finance.categories c
		WHERE c.profile_id = $1
		ORDER BY usage_count DESC, c.sort_order ASC, c.name ASC
	`

	rows, err := r.pool.Query(ctx, query, profileID)
	if err != nil {
		return nil, fmt.Errorf("error querying categories: %w", err)
	}
	defer rows.Close()

	var categories []models.CategoryWithUsage
	for rows.Next() {
		var cat models.CategoryWithUsage
		err := rows.Scan(
			&cat.ID,
			&cat.ProfileID,
			&cat.Name,
			&cat.Type,
			&cat.Icon,
			&cat.Color,
			&cat.IsDefault,
			&cat.SortOrder,
			&cat.CreatedAt,
			&cat.UsageCount,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning category: %w", err)
		}
		categories = append(categories, cat)
	}

	return categories, nil
}

// GetByID returns a specific category owned by profileID.
func (r *Repository) GetByID(ctx context.Context, id, profileID uuid.UUID) (*models.Category, error) {
	query := `
		SELECT id, profile_id, name, type, icon, color, is_default, sort_order, created_at
		FROM finance.categories
		WHERE id = $1 AND profile_id = $2
	`
	var cat models.Category
	err := r.pool.QueryRow(ctx, query, id, profileID).Scan(
		&cat.ID,
		&cat.ProfileID,
		&cat.Name,
		&cat.Type,
		&cat.Icon,
		&cat.Color,
		&cat.IsDefault,
		&cat.SortOrder,
		&cat.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrCategoryNotFound
		}
		return nil, fmt.Errorf("error getting category: %w", err)
	}
	return &cat, nil
}

// Create inserts a new custom category.
func (r *Repository) Create(ctx context.Context, profileID uuid.UUID, req models.CreateCategoryRequest) (*models.Category, error) {
	query := `
		INSERT INTO finance.categories (profile_id, name, type, icon, color, is_default, sort_order)
		VALUES ($1, $2, $3, $4, $5, false, $6)
		RETURNING id, profile_id, name, type, icon, color, is_default, sort_order, created_at
	`
	var cat models.Category
	err := r.pool.QueryRow(ctx, query,
		profileID,
		req.Name,
		req.Type,
		req.Icon,
		req.Color,
		req.SortOrder,
	).Scan(
		&cat.ID,
		&cat.ProfileID,
		&cat.Name,
		&cat.Type,
		&cat.Icon,
		&cat.Color,
		&cat.IsDefault,
		&cat.SortOrder,
		&cat.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("error inserting category: %w", err)
	}
	return &cat, nil
}

// Update modifies category fields.
func (r *Repository) Update(ctx context.Context, id, profileID uuid.UUID, req models.UpdateCategoryRequest) (*models.Category, error) {
	setClauses := []string{}
	args := []any{id, profileID}
	argIdx := 3

	if req.Name != nil && strings.TrimSpace(*req.Name) != "" {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, strings.TrimSpace(*req.Name))
		argIdx++
	}
	if req.Icon != nil && strings.TrimSpace(*req.Icon) != "" {
		setClauses = append(setClauses, fmt.Sprintf("icon = $%d", argIdx))
		args = append(args, strings.TrimSpace(*req.Icon))
		argIdx++
	}
	if req.Color != nil && strings.TrimSpace(*req.Color) != "" {
		setClauses = append(setClauses, fmt.Sprintf("color = $%d", argIdx))
		args = append(args, strings.TrimSpace(*req.Color))
		argIdx++
	}
	if req.SortOrder != nil {
		setClauses = append(setClauses, fmt.Sprintf("sort_order = $%d", argIdx))
		args = append(args, *req.SortOrder)
		argIdx++
	}

	if len(setClauses) == 0 {
		return r.GetByID(ctx, id, profileID)
	}

	query := fmt.Sprintf(`
		UPDATE finance.categories
		SET %s
		WHERE id = $1 AND profile_id = $2
		RETURNING id, profile_id, name, type, icon, color, is_default, sort_order, created_at
	`, strings.Join(setClauses, ", "))

	var cat models.Category
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&cat.ID,
		&cat.ProfileID,
		&cat.Name,
		&cat.Type,
		&cat.Icon,
		&cat.Color,
		&cat.IsDefault,
		&cat.SortOrder,
		&cat.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrCategoryNotFound
		}
		return nil, fmt.Errorf("error updating category: %w", err)
	}
	return &cat, nil
}

// Delete checks for associated transactions before removing the category.
func (r *Repository) Delete(ctx context.Context, id, profileID uuid.UUID) error {
	var count int
	checkQuery := `SELECT COUNT(*) FROM finance.transactions WHERE category_id = $1`
	if err := r.pool.QueryRow(ctx, checkQuery, id).Scan(&count); err != nil {
		return fmt.Errorf("error checking transaction references: %w", err)
	}

	if count > 0 {
		return ErrCategoryInUse
	}

	query := `DELETE FROM finance.categories WHERE id = $1 AND profile_id = $2`
	res, err := r.pool.Exec(ctx, query, id, profileID)
	if err != nil {
		return fmt.Errorf("error deleting category: %w", err)
	}
	if res.RowsAffected() == 0 {
		return ErrCategoryNotFound
	}
	return nil
}
