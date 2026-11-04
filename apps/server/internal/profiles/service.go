package profiles

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/google/uuid"

	"koin/server/internal/auth"
	"koin/server/internal/models"
)

var (
	ErrInvalidProfileName = errors.New("el nombre del perfil es requerido (máximo 100 caracteres)")
	ErrInvalidPIN         = errors.New("el PIN debe tener entre 4 y 6 dígitos numéricos")
	ErrPINMismatch        = errors.New("PIN de seguridad incorrecto")
	ErrPINNotSet          = errors.New("el perfil no tiene PIN configurado")
)

var pinRegex = regexp.MustCompile(`^\d{4,6}$`)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, userID uuid.UUID) ([]models.Profile, error) {
	return s.repo.FindProfilesByUserID(ctx, userID)
}

func (s *Service) GetByID(ctx context.Context, profileID uuid.UUID) (*models.Profile, error) {
	return s.repo.FindProfileByID(ctx, profileID)
}

func (s *Service) Create(ctx context.Context, userID uuid.UUID, req models.CreateProfileRequest) (*models.Profile, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" || len(name) > 100 {
		return nil, ErrInvalidProfileName
	}

	avatarIcon := strings.TrimSpace(req.AvatarIcon)
	if avatarIcon == "" {
		avatarIcon = "User"
	}

	currency := strings.ToUpper(strings.TrimSpace(req.BaseCurrency))
	if len(currency) != 3 {
		currency = "USD"
	}

	theme := models.ThemeConfig{
		Preset:     "gold",
		PrimaryHex: "#F59E0B",
		AccentHex:  "#FCD34D",
		BaseMode:   "dark",
	}
	if req.ThemeConfig != nil {
		theme = *req.ThemeConfig
	}

	var pinHash *string
	hasPin := false
	if req.PIN != nil && strings.TrimSpace(*req.PIN) != "" {
		trimmedPIN := strings.TrimSpace(*req.PIN)
		if !pinRegex.MatchString(trimmedPIN) {
			return nil, ErrInvalidPIN
		}
		hash, err := auth.HashPassword(trimmedPIN)
		if err != nil {
			return nil, err
		}
		pinHash = &hash
		hasPin = true
	}

	profileData := models.Profile{
		Name:          name,
		AvatarIcon:    avatarIcon,
		ThemeConfig:   theme,
		BaseCurrency:  currency,
		HasPin:        hasPin,
		UseBiometrics: req.UseBiometrics,
	}

	return s.repo.CreateProfileWithSeed(ctx, userID, profileData, pinHash)
}

func (s *Service) Update(ctx context.Context, userID uuid.UUID, profileID uuid.UUID, req models.UpdateProfileRequest) (*models.Profile, error) {
	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" || len(name) > 100 {
			return nil, ErrInvalidProfileName
		}
	}

	var pinHash *string
	if req.PIN != nil && strings.TrimSpace(*req.PIN) != "" {
		trimmedPIN := strings.TrimSpace(*req.PIN)
		if !pinRegex.MatchString(trimmedPIN) {
			return nil, ErrInvalidPIN
		}
		hash, err := auth.HashPassword(trimmedPIN)
		if err != nil {
			return nil, err
		}
		pinHash = &hash
	}

	return s.repo.UpdateProfile(ctx, userID, profileID, req, pinHash)
}

func (s *Service) Delete(ctx context.Context, userID uuid.UUID, profileID uuid.UUID) error {
	return s.repo.DeleteProfile(ctx, userID, profileID)
}

func (s *Service) VerifyPIN(ctx context.Context, profileID uuid.UUID, pin string) (bool, error) {
	trimmedPIN := strings.TrimSpace(pin)
	if !pinRegex.MatchString(trimmedPIN) {
		return false, ErrInvalidPIN
	}

	hash, err := s.repo.GetProfilePINHash(ctx, profileID)
	if err != nil {
		return false, err
	}
	if hash == "" {
		return false, ErrPINNotSet
	}

	valid, err := auth.VerifyPassword(trimmedPIN, hash)
	if err != nil || !valid {
		return false, ErrPINMismatch
	}

	return true, nil
}
