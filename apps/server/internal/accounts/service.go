package accounts

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"koin/server/internal/models"
)

var (
	ErrInvalidAccountType = errors.New("tipo de cuenta inválido. Tipos permitidos: cash, bank, credit, savings, investment")
	ErrInvalidRole        = errors.New("rol inválido. Roles permitidos: editor, viewer")
	ErrEmptyAccountName   = errors.New("el nombre de la cuenta es obligatorio")
	ErrForbidden          = errors.New("no tienes permisos para realizar esta operación (se requiere rol de propietario)")
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// List returns accounts accessible to the profile with real-time balance calculations.
func (s *Service) List(ctx context.Context, profileID uuid.UUID) ([]models.AccountWithRole, error) {
	return s.repo.ListByProfile(ctx, profileID)
}

// GetByID returns an account ensuring access rights.
func (s *Service) GetByID(ctx context.Context, accountID, profileID uuid.UUID) (*models.AccountWithRole, error) {
	return s.repo.GetByID(ctx, accountID, profileID)
}

// Create validates and creates a new private account for the profile.
func (s *Service) Create(ctx context.Context, profileID uuid.UUID, req models.CreateAccountRequest) (*models.Account, error) {
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		return nil, ErrEmptyAccountName
	}

	validTypes := map[string]bool{
		"cash":       true,
		"bank":       true,
		"credit":     true,
		"savings":    true,
		"investment": true,
	}
	if !validTypes[req.Type] {
		req.Type = "cash"
	}

	if req.Currency == "" {
		req.Currency = "USD"
	} else {
		req.Currency = strings.ToUpper(strings.TrimSpace(req.Currency))
	}

	if req.Color == "" {
		req.Color = "#10B981"
	}

	if req.Icon == "" {
		req.Icon = "Wallet"
	}

	return s.repo.Create(ctx, profileID, req)
}

// Update edits account properties. Only 'owner' can perform updates.
func (s *Service) Update(ctx context.Context, accountID, profileID uuid.UUID, req models.UpdateAccountRequest) (*models.Account, error) {
	role, err := s.repo.GetMemberRole(ctx, accountID, profileID)
	if err != nil {
		return nil, err
	}
	if role != "owner" {
		return nil, ErrForbidden
	}

	if req.Name != nil {
		trimmed := strings.TrimSpace(*req.Name)
		if trimmed == "" {
			return nil, ErrEmptyAccountName
		}
		req.Name = &trimmed
	}

	if req.Type != nil {
		validTypes := map[string]bool{
			"cash":       true,
			"bank":       true,
			"credit":     true,
			"savings":    true,
			"investment": true,
		}
		if !validTypes[*req.Type] {
			return nil, ErrInvalidAccountType
		}
	}

	return s.repo.Update(ctx, accountID, req)
}

// Delete permanently removes an account. Only 'owner' can delete.
func (s *Service) Delete(ctx context.Context, accountID, profileID uuid.UUID) error {
	role, err := s.repo.GetMemberRole(ctx, accountID, profileID)
	if err != nil {
		return err
	}
	if role != "owner" {
		return ErrForbidden
	}

	return s.repo.Delete(ctx, accountID)
}

// CreateInvitation generates a cryptographically random signed token with 7-day expiration.
func (s *Service) CreateInvitation(ctx context.Context, accountID, profileID uuid.UUID, role, appBaseURL string) (*models.AccountInvitation, error) {
	callerRole, err := s.repo.GetMemberRole(ctx, accountID, profileID)
	if err != nil {
		return nil, err
	}
	if callerRole != "owner" {
		return nil, ErrForbidden
	}

	if role != "editor" && role != "viewer" {
		role = "editor"
	}

	// Generate 32 bytes cryptographically secure random token (64 hex characters)
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return nil, fmt.Errorf("error generating random token: %w", err)
	}
	token := hex.EncodeToString(tokenBytes)

	// Set 7 days expiration
	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	invitation, err := s.repo.CreateInvitation(ctx, accountID, profileID, role, token, expiresAt)
	if err != nil {
		return nil, err
	}

	if appBaseURL == "" {
		appBaseURL = "http://localhost:5173"
	}
	appBaseURL = strings.TrimRight(appBaseURL, "/")
	invitation.InviteLink = fmt.Sprintf("%s/invite?token=%s", appBaseURL, token)

	return invitation, nil
}

// ValidateInvitation returns public invitation details for preview before accepting.
func (s *Service) ValidateInvitation(ctx context.Context, token, appBaseURL string) (*models.AccountInvitation, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, ErrInvitationExpired
	}

	invitation, err := s.repo.GetInvitationByToken(ctx, token)
	if err != nil {
		return nil, err
	}

	if appBaseURL == "" {
		appBaseURL = "http://localhost:5173"
	}
	appBaseURL = strings.TrimRight(appBaseURL, "/")
	invitation.InviteLink = fmt.Sprintf("%s/invite?token=%s", appBaseURL, token)

	return invitation, nil
}

// AcceptInvitation links an account to a profile using a valid token.
func (s *Service) AcceptInvitation(ctx context.Context, token string, accepterProfileID uuid.UUID) (*models.AccountWithRole, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, ErrInvitationExpired
	}
	return s.repo.AcceptInvitation(ctx, token, accepterProfileID)
}

// ListMembers returns all members of an account if the calling profile has access.
func (s *Service) ListMembers(ctx context.Context, accountID, profileID uuid.UUID) ([]models.AccountMember, error) {
	role, err := s.repo.GetMemberRole(ctx, accountID, profileID)
	if err != nil {
		return nil, err
	}
	if role == "" {
		return nil, ErrAccountNotFound
	}

	return s.repo.ListMembers(ctx, accountID)
}

// UpdateMemberRole modifies member permissions. Only 'owner' can do this.
func (s *Service) UpdateMemberRole(ctx context.Context, accountID, profileID, memberID uuid.UUID, newRole string) error {
	role, err := s.repo.GetMemberRole(ctx, accountID, profileID)
	if err != nil {
		return err
	}
	if role != "owner" {
		return ErrForbidden
	}

	if newRole != "editor" && newRole != "viewer" {
		return ErrInvalidRole
	}

	return s.repo.UpdateMemberRole(ctx, accountID, memberID, newRole)
}

// RemoveMember revokes a collaborator's access. Only 'owner' can do this.
func (s *Service) RemoveMember(ctx context.Context, accountID, profileID, memberID uuid.UUID) error {
	role, err := s.repo.GetMemberRole(ctx, accountID, profileID)
	if err != nil {
		return err
	}
	if role != "owner" {
		return ErrForbidden
	}

	return s.repo.RemoveMember(ctx, accountID, memberID)
}

// LeaveAccount allows a member to relinquish access.
func (s *Service) LeaveAccount(ctx context.Context, accountID, profileID uuid.UUID) error {
	return s.repo.LeaveAccount(ctx, accountID, profileID)
}
