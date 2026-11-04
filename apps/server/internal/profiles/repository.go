package profiles

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
	ErrProfileNotFound = errors.New("perfil no encontrado")
	ErrSingleProfile   = errors.New("no es posible eliminar el único perfil activo de la cuenta")
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) FindProfilesByUserID(ctx context.Context, userID uuid.UUID) ([]models.Profile, error) {
	query := `
		SELECT id, user_id, name, avatar_icon, theme_config, base_currency, has_pin, use_biometrics, created_at, updated_at
		FROM auth.profiles
		WHERE user_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query profiles: %w", err)
	}
	defer rows.Close()

	var profiles []models.Profile
	for rows.Next() {
		var p models.Profile
		err := rows.Scan(
			&p.ID,
			&p.UserID,
			&p.Name,
			&p.AvatarIcon,
			&p.ThemeConfig,
			&p.BaseCurrency,
			&p.HasPin,
			&p.UseBiometrics,
			&p.CreatedAt,
			&p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan profile: %w", err)
		}
		profiles = append(profiles, p)
	}

	return profiles, nil
}

func (r *Repository) FindProfileByID(ctx context.Context, profileID uuid.UUID) (*models.Profile, error) {
	query := `
		SELECT id, user_id, name, avatar_icon, theme_config, base_currency, has_pin, use_biometrics, created_at, updated_at
		FROM auth.profiles
		WHERE id = $1
		LIMIT 1
	`
	var p models.Profile
	err := r.pool.QueryRow(ctx, query, profileID).Scan(
		&p.ID,
		&p.UserID,
		&p.Name,
		&p.AvatarIcon,
		&p.ThemeConfig,
		&p.BaseCurrency,
		&p.HasPin,
		&p.UseBiometrics,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProfileNotFound
		}
		return nil, fmt.Errorf("failed to find profile: %w", err)
	}

	return &p, nil
}

func (r *Repository) CountProfilesByUserID(ctx context.Context, userID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM auth.profiles WHERE user_id = $1`
	var count int
	err := r.pool.QueryRow(ctx, query, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count profiles: %w", err)
	}
	return count, nil
}

func (r *Repository) CreateProfileWithSeed(ctx context.Context, userID uuid.UUID, p models.Profile, pinHash *string) (*models.Profile, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	// 1. Insert Profile
	var newProfile models.Profile
	profileQuery := `
		INSERT INTO auth.profiles (user_id, name, avatar_icon, theme_config, base_currency, has_pin, pin_hash, use_biometrics)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, user_id, name, avatar_icon, theme_config, base_currency, has_pin, use_biometrics, created_at, updated_at
	`
	err = tx.QueryRow(ctx, profileQuery,
		userID,
		p.Name,
		p.AvatarIcon,
		p.ThemeConfig,
		p.BaseCurrency,
		p.HasPin,
		pinHash,
		p.UseBiometrics,
	).Scan(
		&newProfile.ID,
		&newProfile.UserID,
		&newProfile.Name,
		&newProfile.AvatarIcon,
		&newProfile.ThemeConfig,
		&newProfile.BaseCurrency,
		&newProfile.HasPin,
		&newProfile.UseBiometrics,
		&newProfile.CreatedAt,
		&newProfile.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert profile: %w", err)
	}

	// 2. Insert Default Accounts (Billetera Efectivo & Cuenta Bancaria)
	defaultAccountsData := []struct {
		name    string
		accType string
		color   string
		icon    string
	}{
		{name: "Billetera Efectivo", accType: "cash", color: "#F59E0B", icon: "Wallet"},
		{name: "Cuenta Bancaria", accType: "bank", color: "#3B82F6", icon: "Building2"},
	}

	accountQuery := `
		INSERT INTO finance.accounts (created_by_profile_id, name, type, currency, initial_balance, current_balance, is_shared, color, icon, is_archived)
		VALUES ($1, $2, $3, $4, 0.00, 0.00, false, $5, $6, false)
		RETURNING id
	`
	memberQuery := `
		INSERT INTO finance.account_members (account_id, profile_id, role, status)
		VALUES ($1, $2, 'owner', 'accepted')
	`

	for _, acc := range defaultAccountsData {
		var accountID uuid.UUID
		err = tx.QueryRow(ctx, accountQuery, newProfile.ID, acc.name, acc.accType, newProfile.BaseCurrency, acc.color, acc.icon).Scan(&accountID)
		if err != nil {
			return nil, fmt.Errorf("failed to insert default account: %w", err)
		}

		_, err = tx.Exec(ctx, memberQuery, accountID, newProfile.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to insert account member: %w", err)
		}
	}

	// 3. Insert Default Categories (12 standard categories)
	defaultCategoriesData := []struct {
		name      string
		catType   string
		icon      string
		color     string
		sortOrder int
	}{
		{name: "Alimentación", catType: "expense", icon: "Utensils", color: "#F59E0B", sortOrder: 1},
		{name: "Transporte", catType: "expense", icon: "Car", color: "#3B82F6", sortOrder: 2},
		{name: "Vivienda y Servicios", catType: "expense", icon: "Home", color: "#10B981", sortOrder: 3},
		{name: "Suscripciones y Ocio", catType: "expense", icon: "Tv", color: "#8B5CF6", sortOrder: 4},
		{name: "Salud y Cuidado", catType: "expense", icon: "HeartPulse", color: "#EF4444", sortOrder: 5},
		{name: "Educación", catType: "expense", icon: "GraduationCap", color: "#06B6D4", sortOrder: 6},
		{name: "Compras y Ropa", catType: "expense", icon: "ShoppingBag", color: "#EC4899", sortOrder: 7},
		{name: "Otros Gastos", catType: "expense", icon: "Tag", color: "#6B7280", sortOrder: 8},
		{name: "Salario / Nómina", catType: "income", icon: "Briefcase", color: "#10B981", sortOrder: 1},
		{name: "Inversiones y Dividendos", catType: "income", icon: "TrendingUp", color: "#3B82F6", sortOrder: 2},
		{name: "Regalos / Bonos", catType: "income", icon: "Gift", color: "#8B5CF6", sortOrder: 3},
		{name: "Otros Ingresos", catType: "income", icon: "DollarSign", color: "#6B7280", sortOrder: 4},
	}

	catQuery := `
		INSERT INTO finance.categories (profile_id, name, type, icon, color, is_default, sort_order)
		VALUES ($1, $2, $3, $4, $5, true, $6)
	`
	for _, cat := range defaultCategoriesData {
		_, err = tx.Exec(ctx, catQuery, newProfile.ID, cat.name, cat.catType, cat.icon, cat.color, cat.sortOrder)
		if err != nil {
			return nil, fmt.Errorf("failed to insert default category: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &newProfile, nil
}

func (r *Repository) UpdateProfile(ctx context.Context, userID uuid.UUID, profileID uuid.UUID, req models.UpdateProfileRequest, pinHash *string) (*models.Profile, error) {
	setClauses := []string{"updated_at = NOW()"}
	args := []any{profileID, userID}
	argIdx := 3

	if req.Name != nil && strings.TrimSpace(*req.Name) != "" {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, strings.TrimSpace(*req.Name))
		argIdx++
	}

	if req.AvatarIcon != nil && strings.TrimSpace(*req.AvatarIcon) != "" {
		setClauses = append(setClauses, fmt.Sprintf("avatar_icon = $%d", argIdx))
		args = append(args, strings.TrimSpace(*req.AvatarIcon))
		argIdx++
	}

	if req.ThemeConfig != nil {
		setClauses = append(setClauses, fmt.Sprintf("theme_config = $%d", argIdx))
		args = append(args, *req.ThemeConfig)
		argIdx++
	}

	if req.BaseCurrency != nil && strings.TrimSpace(*req.BaseCurrency) != "" {
		setClauses = append(setClauses, fmt.Sprintf("base_currency = $%d", argIdx))
		args = append(args, strings.ToUpper(strings.TrimSpace(*req.BaseCurrency)))
		argIdx++
	}

	if pinHash != nil {
		setClauses = append(setClauses, fmt.Sprintf("has_pin = true, pin_hash = $%d", argIdx))
		args = append(args, *pinHash)
		argIdx++
	} else if req.PIN != nil && *req.PIN == "" {
		// Removing PIN
		setClauses = append(setClauses, "has_pin = false, pin_hash = NULL")
	}

	if req.UseBiometrics != nil {
		setClauses = append(setClauses, fmt.Sprintf("use_biometrics = $%d", argIdx))
		args = append(args, *req.UseBiometrics)
		argIdx++
	}

	query := fmt.Sprintf(`
		UPDATE auth.profiles
		SET %s
		WHERE id = $1 AND user_id = $2
		RETURNING id, user_id, name, avatar_icon, theme_config, base_currency, has_pin, use_biometrics, created_at, updated_at
	`, strings.Join(setClauses, ", "))

	var p models.Profile
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&p.ID,
		&p.UserID,
		&p.Name,
		&p.AvatarIcon,
		&p.ThemeConfig,
		&p.BaseCurrency,
		&p.HasPin,
		&p.UseBiometrics,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProfileNotFound
		}
		return nil, fmt.Errorf("failed to update profile: %w", err)
	}

	return &p, nil
}

func (r *Repository) DeleteProfile(ctx context.Context, userID uuid.UUID, profileID uuid.UUID) error {
	count, err := r.CountProfilesByUserID(ctx, userID)
	if err != nil {
		return err
	}
	if count <= 1 {
		return ErrSingleProfile
	}

	query := `DELETE FROM auth.profiles WHERE id = $1 AND user_id = $2`
	res, err := r.pool.Exec(ctx, query, profileID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete profile: %w", err)
	}

	if res.RowsAffected() == 0 {
		return ErrProfileNotFound
	}

	return nil
}

func (r *Repository) GetProfilePINHash(ctx context.Context, profileID uuid.UUID) (string, error) {
	query := `SELECT COALESCE(pin_hash, '') FROM auth.profiles WHERE id = $1`
	var pinHash string
	err := r.pool.QueryRow(ctx, query, profileID).Scan(&pinHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrProfileNotFound
		}
		return "", fmt.Errorf("failed to get profile pin hash: %w", err)
	}
	return pinHash, nil
}
