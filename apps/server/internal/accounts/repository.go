package accounts

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
	ErrAccountNotFound   = errors.New("cuenta no encontrada o sin permisos de acceso")
	ErrInvitationExpired = errors.New("la invitación ha expirado o ya no es válida")
	ErrInvitationUsed    = errors.New("la invitación ya ha sido utilizada")
	ErrAlreadyMember     = errors.New("el perfil ya es miembro de esta cuenta")
	ErrOwnerCannotLeave  = errors.New("el creador de la cuenta no puede abandonarla")
	ErrUnauthorizedRole  = errors.New("no tienes permisos suficientes para realizar esta acción")
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ListByProfile returns all accounts accessible to a given profile (owned or shared member) with real-time balance.
func (r *Repository) ListByProfile(ctx context.Context, profileID uuid.UUID) ([]models.AccountWithRole, error) {
	query := `
		SELECT 
			a.id,
			a.created_by_profile_id,
			a.name,
			a.institution_name,
			a.type,
			a.currency,
			a.initial_balance,
			(
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
					FROM koin_finance.transactions t
					WHERE t.account_id = a.id OR t.to_account_id = a.id
				), 0)
			) AS current_balance,
			a.is_shared,
			a.color,
			a.icon,
			a.is_archived,
			a.created_at,
			a.updated_at,
			CASE 
				WHEN a.created_by_profile_id = $1 THEN 'owner'
				ELSE COALESCE(am.role, 'viewer')
			END AS role
		FROM koin_finance.accounts a
		LEFT JOIN koin_finance.account_members am ON am.account_id = a.id AND am.profile_id = $1 AND am.status = 'accepted'
		WHERE a.created_by_profile_id = $1 OR am.profile_id = $1
		ORDER BY a.is_archived ASC, a.created_at ASC
	`

	rows, err := r.pool.Query(ctx, query, profileID)
	if err != nil {
		return nil, fmt.Errorf("error querying accounts: %w", err)
	}
	defer rows.Close()

	var accounts []models.AccountWithRole
	for rows.Next() {
		var acc models.AccountWithRole
		err := rows.Scan(
			&acc.ID,
			&acc.CreatedByProfileID,
			&acc.Name,
			&acc.InstitutionName,
			&acc.Type,
			&acc.Currency,
			&acc.InitialBalance,
			&acc.CurrentBalance,
			&acc.IsShared,
			&acc.Color,
			&acc.Icon,
			&acc.IsArchived,
			&acc.CreatedAt,
			&acc.UpdatedAt,
			&acc.Role,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning account: %w", err)
		}
		accounts = append(accounts, acc)
	}

	if accounts == nil {
		accounts = []models.AccountWithRole{}
	}

	return accounts, nil
}

// GetByID returns an account by ID if accessible to the profile.
func (r *Repository) GetByID(ctx context.Context, accountID, profileID uuid.UUID) (*models.AccountWithRole, error) {
	query := `
		SELECT 
			a.id,
			a.created_by_profile_id,
			a.name,
			a.institution_name,
			a.type,
			a.currency,
			a.initial_balance,
			(
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
					FROM koin_finance.transactions t
					WHERE t.account_id = a.id OR t.to_account_id = a.id
				), 0)
			) AS current_balance,
			a.is_shared,
			a.color,
			a.icon,
			a.is_archived,
			a.created_at,
			a.updated_at,
			CASE 
				WHEN a.created_by_profile_id = $2 THEN 'owner'
				ELSE COALESCE(am.role, 'viewer')
			END AS role
		FROM koin_finance.accounts a
		LEFT JOIN koin_finance.account_members am ON am.account_id = a.id AND am.profile_id = $2 AND am.status = 'accepted'
		WHERE a.id = $1 AND (a.created_by_profile_id = $2 OR am.profile_id = $2)
	`

	var acc models.AccountWithRole
	err := r.pool.QueryRow(ctx, query, accountID, profileID).Scan(
		&acc.ID,
		&acc.CreatedByProfileID,
		&acc.Name,
		&acc.InstitutionName,
		&acc.Type,
		&acc.Currency,
		&acc.InitialBalance,
		&acc.CurrentBalance,
		&acc.IsShared,
		&acc.Color,
		&acc.Icon,
		&acc.IsArchived,
		&acc.CreatedAt,
		&acc.UpdatedAt,
		&acc.Role,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAccountNotFound
		}
		return nil, fmt.Errorf("error querying account by id: %w", err)
	}

	return &acc, nil
}

// GetMemberRole gets the calling profile's role on an account ('owner', 'editor', 'viewer', or empty if unauthorized).
func (r *Repository) GetMemberRole(ctx context.Context, accountID, profileID uuid.UUID) (string, error) {
	query := `
		SELECT 
			CASE 
				WHEN a.created_by_profile_id = $2 THEN 'owner'
				ELSE COALESCE(am.role, '')
			END AS role
		FROM koin_finance.accounts a
		LEFT JOIN koin_finance.account_members am ON am.account_id = a.id AND am.profile_id = $2 AND am.status = 'accepted'
		WHERE a.id = $1
	`
	var role string
	err := r.pool.QueryRow(ctx, query, accountID, profileID).Scan(&role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrAccountNotFound
		}
		return "", err
	}
	return role, nil
}

// Create inserts a new account and automatically registers the creator as the 'owner' member.
func (r *Repository) Create(ctx context.Context, profileID uuid.UUID, req models.CreateAccountRequest) (*models.Account, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("error beginning tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var acc models.Account
	accountQuery := `
		INSERT INTO koin_finance.accounts (
			created_by_profile_id,
			name,
			institution_name,
			type,
			currency,
			initial_balance,
			current_balance,
			is_shared,
			color,
			icon,
			is_archived
		) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, false)
		RETURNING 
			id, created_by_profile_id, name, institution_name, type, currency, initial_balance,
			current_balance, is_shared, color, icon, is_archived, created_at, updated_at
	`

	err = tx.QueryRow(ctx, accountQuery,
		profileID,
		req.Name,
		req.InstitutionName,
		req.Type,
		req.Currency,
		req.InitialBalance,
		req.IsShared,
		req.Color,
		req.Icon,
	).Scan(
		&acc.ID,
		&acc.CreatedByProfileID,
		&acc.Name,
		&acc.InstitutionName,
		&acc.Type,
		&acc.Currency,
		&acc.InitialBalance,
		&acc.CurrentBalance,
		&acc.IsShared,
		&acc.Color,
		&acc.Icon,
		&acc.IsArchived,
		&acc.CreatedAt,
		&acc.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("error creating account: %w", err)
	}

	// Insert owner member entry
	memberQuery := `
		INSERT INTO koin_finance.account_members (account_id, profile_id, role, status)
		VALUES ($1, $2, 'owner', 'accepted')
		ON CONFLICT (account_id, profile_id) DO NOTHING
	`
	_, err = tx.Exec(ctx, memberQuery, acc.ID, profileID)
	if err != nil {
		return nil, fmt.Errorf("error adding owner member: %w", err)
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("error committing tx: %w", err)
	}

	return &acc, nil
}

// Update updates mutable fields of an account.
func (r *Repository) Update(ctx context.Context, accountID uuid.UUID, req models.UpdateAccountRequest) (*models.Account, error) {
	query := `
		UPDATE koin_finance.accounts
		SET
			name = COALESCE($2, name),
			institution_name = COALESCE($3, institution_name),
			type = COALESCE($4, type),
			color = COALESCE($5, color),
			icon = COALESCE($6, icon),
			is_archived = COALESCE($7, is_archived),
			updated_at = now()
		WHERE id = $1
		RETURNING 
			id, created_by_profile_id, name, institution_name, type, currency, initial_balance,
			current_balance, is_shared, color, icon, is_archived, created_at, updated_at
	`

	var acc models.Account
	err := r.pool.QueryRow(ctx, query,
		accountID,
		req.Name,
		req.InstitutionName,
		req.Type,
		req.Color,
		req.Icon,
		req.IsArchived,
	).Scan(
		&acc.ID,
		&acc.CreatedByProfileID,
		&acc.Name,
		&acc.InstitutionName,
		&acc.Type,
		&acc.Currency,
		&acc.InitialBalance,
		&acc.CurrentBalance,
		&acc.IsShared,
		&acc.Color,
		&acc.Icon,
		&acc.IsArchived,
		&acc.CreatedAt,
		&acc.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAccountNotFound
		}
		return nil, fmt.Errorf("error updating account: %w", err)
	}

	return &acc, nil
}

// Delete removes an account. Returns error if foreign key constraints block deletion (e.g. existing transactions).
func (r *Repository) Delete(ctx context.Context, accountID uuid.UUID) error {
	query := `DELETE FROM koin_finance.accounts WHERE id = $1`
	cmdTag, err := r.pool.Exec(ctx, query, accountID)
	if err != nil {
		return fmt.Errorf("error deleting account: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return ErrAccountNotFound
	}
	return nil
}

// CreateInvitation inserts a new signed invitation token.
func (r *Repository) CreateInvitation(ctx context.Context, accountID, inviterProfileID uuid.UUID, role, token string, expiresAt time.Time) (*models.AccountInvitation, error) {
	query := `
		INSERT INTO koin_finance.account_invitations (
			account_id,
			inviter_profile_id,
			role,
			token,
			expires_at
		) VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`

	var inv models.AccountInvitation
	inv.AccountID = accountID
	inv.InviterProfileID = inviterProfileID
	inv.Role = role
	inv.Token = token
	inv.ExpiresAt = expiresAt

	err := r.pool.QueryRow(ctx, query, accountID, inviterProfileID, role, token, expiresAt).Scan(&inv.ID, &inv.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("error creating invitation: %w", err)
	}

	return &inv, nil
}

// GetInvitationByToken returns the invitation details for public/validated preview.
func (r *Repository) GetInvitationByToken(ctx context.Context, token string) (*models.AccountInvitation, error) {
	query := `
		SELECT 
			i.id,
			i.account_id,
			a.name AS account_name,
			a.type AS account_type,
			a.currency AS account_currency,
			i.inviter_profile_id,
			p.name AS inviter_profile_name,
			i.role,
			i.token,
			i.expires_at,
			i.accepted_by_profile_id,
			i.accepted_at,
			(i.expires_at < now()) AS is_expired,
			(i.accepted_at IS NOT NULL) AS is_accepted,
			i.created_at
		FROM koin_finance.account_invitations i
		JOIN koin_finance.accounts a ON a.id = i.account_id
		JOIN koin_auth.profiles p ON p.id = i.inviter_profile_id
		WHERE i.token = $1
	`

	var inv models.AccountInvitation
	err := r.pool.QueryRow(ctx, query, token).Scan(
		&inv.ID,
		&inv.AccountID,
		&inv.AccountName,
		&inv.AccountType,
		&inv.AccountCurrency,
		&inv.InviterProfileID,
		&inv.InviterProfileName,
		&inv.Role,
		&inv.Token,
		&inv.ExpiresAt,
		&inv.AcceptedByProfileID,
		&inv.AcceptedAt,
		&inv.IsExpired,
		&inv.IsAccepted,
		&inv.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvitationExpired
		}
		return nil, fmt.Errorf("error querying invitation: %w", err)
	}

	return &inv, nil
}

// AcceptInvitation links the profile to the account and marks the invitation as accepted in an atomic transaction.
func (r *Repository) AcceptInvitation(ctx context.Context, token string, accepterProfileID uuid.UUID) (*models.AccountWithRole, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("error beginning tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Select invitation with lock
	lockQuery := `
		SELECT id, account_id, role, expires_at, accepted_at
		FROM koin_finance.account_invitations
		WHERE token = $1
		FOR UPDATE
	`

	var invID, accountID uuid.UUID
	var role string
	var expiresAt time.Time
	var acceptedAt *time.Time

	err = tx.QueryRow(ctx, lockQuery, token).Scan(&invID, &accountID, &role, &expiresAt, &acceptedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvitationExpired
		}
		return nil, fmt.Errorf("error locking invitation: %w", err)
	}

	if acceptedAt != nil {
		return nil, ErrInvitationUsed
	}

	if time.Now().After(expiresAt) {
		return nil, ErrInvitationExpired
	}

	// Update invitation status
	updateInvQuery := `
		UPDATE koin_finance.account_invitations
		SET accepted_by_profile_id = $2, accepted_at = now()
		WHERE id = $1
	`
	_, err = tx.Exec(ctx, updateInvQuery, invID, accepterProfileID)
	if err != nil {
		return nil, fmt.Errorf("error updating invitation record: %w", err)
	}

	// Insert or update account member
	memberQuery := `
		INSERT INTO koin_finance.account_members (account_id, profile_id, role, status)
		VALUES ($1, $2, $3, 'accepted')
		ON CONFLICT (account_id, profile_id) 
		DO UPDATE SET role = EXCLUDED.role, status = 'accepted'
	`
	_, err = tx.Exec(ctx, memberQuery, accountID, accepterProfileID, role)
	if err != nil {
		return nil, fmt.Errorf("error inserting account member: %w", err)
	}

	// Mark account as shared
	updateAccQuery := `UPDATE koin_finance.accounts SET is_shared = true WHERE id = $1`
	_, err = tx.Exec(ctx, updateAccQuery, accountID)
	if err != nil {
		return nil, fmt.Errorf("error marking account as shared: %w", err)
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("error committing acceptance tx: %w", err)
	}

	// Retrieve newly accessible account
	return r.GetByID(ctx, accountID, accepterProfileID)
}

// ListMembers returns all active members and the owner of an account.
func (r *Repository) ListMembers(ctx context.Context, accountID uuid.UUID) ([]models.AccountMember, error) {
	query := `
		SELECT 
			am.id,
			am.account_id,
			am.profile_id,
			am.role,
			am.invited_email,
			am.status,
			p.name AS profile_name,
			p.avatar_icon AS profile_avatar_icon,
			am.created_at
		FROM koin_finance.account_members am
		LEFT JOIN koin_auth.profiles p ON p.id = am.profile_id
		WHERE am.account_id = $1
		ORDER BY 
			CASE WHEN am.role = 'owner' THEN 1 WHEN am.role = 'editor' THEN 2 ELSE 3 END,
			am.created_at ASC
	`

	rows, err := r.pool.Query(ctx, query, accountID)
	if err != nil {
		return nil, fmt.Errorf("error querying members: %w", err)
	}
	defer rows.Close()

	var members []models.AccountMember
	for rows.Next() {
		var m models.AccountMember
		err := rows.Scan(
			&m.ID,
			&m.AccountID,
			&m.ProfileID,
			&m.Role,
			&m.InvitedEmail,
			&m.Status,
			&m.ProfileName,
			&m.ProfileAvatarIcon,
			&m.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning member: %w", err)
		}
		members = append(members, m)
	}

	if members == nil {
		members = []models.AccountMember{}
	}

	return members, nil
}

// UpdateMemberRole modifies a member's role ('editor' or 'viewer').
func (r *Repository) UpdateMemberRole(ctx context.Context, accountID, memberID uuid.UUID, newRole string) error {
	query := `
		UPDATE koin_finance.account_members
		SET role = $3
		WHERE account_id = $1 AND id = $2 AND role != 'owner'
	`
	cmdTag, err := r.pool.Exec(ctx, query, accountID, memberID, newRole)
	if err != nil {
		return fmt.Errorf("error updating member role: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return errors.New("miembro no encontrado o no es posible modificar el rol del propietario")
	}
	return nil
}

// RemoveMember removes an invited member from an account.
func (r *Repository) RemoveMember(ctx context.Context, accountID, memberID uuid.UUID) error {
	query := `
		DELETE FROM koin_finance.account_members
		WHERE account_id = $1 AND id = $2 AND role != 'owner'
	`
	cmdTag, err := r.pool.Exec(ctx, query, accountID, memberID)
	if err != nil {
		return fmt.Errorf("error deleting member: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return errors.New("miembro no encontrado o no es posible eliminar al propietario")
	}
	return nil
}

// LeaveAccount allows a collaborating profile to leave a shared account.
func (r *Repository) LeaveAccount(ctx context.Context, accountID, profileID uuid.UUID) error {
	// Verify not creator
	var creatorID uuid.UUID
	err := r.pool.QueryRow(ctx, "SELECT created_by_profile_id FROM koin_finance.accounts WHERE id = $1", accountID).Scan(&creatorID)
	if err != nil {
		return ErrAccountNotFound
	}
	if creatorID == profileID {
		return ErrOwnerCannotLeave
	}

	query := `
		DELETE FROM koin_finance.account_members
		WHERE account_id = $1 AND profile_id = $2
	`
	cmdTag, err := r.pool.Exec(ctx, query, accountID, profileID)
	if err != nil {
		return fmt.Errorf("error leaving account: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return errors.New("no eres miembro activo de esta cuenta")
	}
	return nil
}
