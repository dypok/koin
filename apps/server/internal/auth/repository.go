package auth

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"koin/server/internal/models"
)

type CreateUserData struct {
	Email        string
	PasswordHash string
	FullName     string
	BaseCurrency string
}

type SeedResult struct {
	User       models.User
	Profile    models.Profile
	Accounts   []models.Account
	Categories []models.Category
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) FindUserByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, full_name, created_at, updated_at
		FROM users
		WHERE LOWER(email) = LOWER(TRIM($1))
		LIMIT 1
	`
	var user models.User
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.FullName,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find user by email: %w", err)
	}

	return &user, nil
}

func (r *Repository) FindUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, full_name, created_at, updated_at
		FROM users
		WHERE id = $1
		LIMIT 1
	`
	var user models.User
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.FullName,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find user by id: %w", err)
	}

	return &user, nil
}

func (r *Repository) FindProfilesByUserID(ctx context.Context, userID uuid.UUID) ([]models.Profile, error) {
	query := `
		SELECT id, user_id, name, avatar_icon, theme_config, base_currency, has_pin, pin_hash, use_biometrics, created_at, updated_at
		FROM profiles
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
			&p.PinHash,
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

func (r *Repository) CreateUserWithSeedData(ctx context.Context, data CreateUserData) (*SeedResult, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	currency := data.BaseCurrency
	if currency == "" {
		currency = "USD"
	}

	// 1. Insert User
	var newUser models.User
	userQuery := `
		INSERT INTO users (email, password_hash, full_name)
		VALUES (LOWER(TRIM($1)), $2, TRIM($3))
		RETURNING id, email, password_hash, full_name, created_at, updated_at
	`
	err = tx.QueryRow(ctx, userQuery, data.Email, data.PasswordHash, data.FullName).Scan(
		&newUser.ID,
		&newUser.Email,
		&newUser.PasswordHash,
		&newUser.FullName,
		&newUser.CreatedAt,
		&newUser.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert user: %w", err)
	}

	// 2. Insert Default Profile ("Personal")
	defaultTheme := models.ThemeConfig{
		Preset:     "gold",
		PrimaryHex: "#F59E0B",
		AccentHex:  "#FCD34D",
		BaseMode:   "dark",
	}

	var newProfile models.Profile
	profileQuery := `
		INSERT INTO profiles (user_id, name, avatar_icon, theme_config, base_currency, has_pin, use_biometrics)
		VALUES ($1, 'Personal', 'User', $2, $3, false, false)
		RETURNING id, user_id, name, avatar_icon, theme_config, base_currency, has_pin, pin_hash, use_biometrics, created_at, updated_at
	`
	err = tx.QueryRow(ctx, profileQuery, newUser.ID, defaultTheme, currency).Scan(
		&newProfile.ID,
		&newProfile.UserID,
		&newProfile.Name,
		&newProfile.AvatarIcon,
		&newProfile.ThemeConfig,
		&newProfile.BaseCurrency,
		&newProfile.HasPin,
		&newProfile.PinHash,
		&newProfile.UseBiometrics,
		&newProfile.CreatedAt,
		&newProfile.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert default profile: %w", err)
	}

	// 3. Insert Default Accounts
	defaultAccountsData := []struct {
		name  string
		accType string
		color string
		icon  string
	}{
		{name: "Billetera Efectivo", accType: "cash", color: "#F59E0B", icon: "Wallet"},
		{name: "Cuenta Bancaria", accType: "bank", color: "#3B82F6", icon: "Building2"},
	}

	var insertedAccounts []models.Account
	accountQuery := `
		INSERT INTO accounts (created_by_profile_id, name, type, currency, initial_balance, current_balance, is_shared, color, icon, is_archived)
		VALUES ($1, $2, $3, $4, 0.00, 0.00, false, $5, $6, false)
		RETURNING id, created_by_profile_id, name, type, currency, initial_balance, current_balance, is_shared, color, icon, is_archived, created_at, updated_at
	`
	memberQuery := `
		INSERT INTO account_members (account_id, profile_id, role, status)
		VALUES ($1, $2, 'owner', 'accepted')
	`

	for _, acc := range defaultAccountsData {
		var a models.Account
		err = tx.QueryRow(ctx, accountQuery, newProfile.ID, acc.name, acc.accType, currency, acc.color, acc.icon).Scan(
			&a.ID,
			&a.CreatedByProfileID,
			&a.Name,
			&a.Type,
			&a.Currency,
			&a.InitialBalance,
			&a.CurrentBalance,
			&a.IsShared,
			&a.Color,
			&a.Icon,
			&a.IsArchived,
			&a.CreatedAt,
			&a.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to insert account %s: %w", acc.name, err)
		}
		insertedAccounts = append(insertedAccounts, a)

		// Account Membership
		_, err = tx.Exec(ctx, memberQuery, a.ID, newProfile.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to insert account membership for %s: %w", acc.name, err)
		}
	}

	// 4. Insert Default Categories (12 standard categories)
	defaultCategoriesData := []struct {
		name      string
		catType   string
		icon      string
		color     string
		sortOrder int
	}{
		// Expenses
		{name: "Alimentación", catType: "expense", icon: "Utensils", color: "#F59E0B", sortOrder: 1},
		{name: "Transporte", catType: "expense", icon: "Car", color: "#3B82F6", sortOrder: 2},
		{name: "Vivienda y Servicios", catType: "expense", icon: "Home", color: "#10B981", sortOrder: 3},
		{name: "Suscripciones y Ocio", catType: "expense", icon: "Tv", color: "#8B5CF6", sortOrder: 4},
		{name: "Salud y Cuidado", catType: "expense", icon: "HeartPulse", color: "#EF4444", sortOrder: 5},
		{name: "Educación", catType: "expense", icon: "GraduationCap", color: "#06B6D4", sortOrder: 6},
		{name: "Compras y Ropa", catType: "expense", icon: "ShoppingBag", color: "#EC4899", sortOrder: 7},
		{name: "Otros Gastos", catType: "expense", icon: "Tag", color: "#6B7280", sortOrder: 8},

		// Income
		{name: "Salario / Nómina", catType: "income", icon: "Briefcase", color: "#10B981", sortOrder: 1},
		{name: "Inversiones y Dividendos", catType: "income", icon: "TrendingUp", color: "#3B82F6", sortOrder: 2},
		{name: "Regalos / Bonos", catType: "income", icon: "Gift", color: "#8B5CF6", sortOrder: 3},
		{name: "Otros Ingresos", catType: "income", icon: "DollarSign", color: "#6B7280", sortOrder: 4},
	}

	var insertedCategories []models.Category
	categoryQuery := `
		INSERT INTO categories (profile_id, name, type, icon, color, is_default, sort_order)
		VALUES ($1, $2, $3, $4, $5, true, $6)
		RETURNING id, profile_id, name, type, icon, color, is_default, sort_order, created_at
	`

	for _, cat := range defaultCategoriesData {
		var c models.Category
		err = tx.QueryRow(ctx, categoryQuery, newProfile.ID, cat.name, cat.catType, cat.icon, cat.color, cat.sortOrder).Scan(
			&c.ID,
			&c.ProfileID,
			&c.Name,
			&c.Type,
			&c.Icon,
			&c.Color,
			&c.IsDefault,
			&c.SortOrder,
			&c.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to insert category %s: %w", cat.name, err)
		}
		insertedCategories = append(insertedCategories, c)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &SeedResult{
		User:       newUser,
		Profile:    newProfile,
		Accounts:   insertedAccounts,
		Categories: insertedCategories,
	}, nil
}
