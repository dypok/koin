package auth

import (
	"context"
	"errors"
	"net/mail"
	"strings"

	"github.com/google/uuid"
	"koin/server/internal/models"
)

var (
	ErrUserAlreadyExists  = errors.New("el correo electrónico ya se encuentra registrado en Koin")
	ErrInvalidCredentials = errors.New("credenciales de acceso inválidas")
	ErrUserNotFound       = errors.New("usuario no encontrado")
	ErrInvalidInput       = errors.New("datos de entrada inválidos")
)

type Service struct {
	repo      *Repository
	jwtSecret string
}

func NewService(repo *Repository, jwtSecret string) *Service {
	return &Service{
		repo:      repo,
		jwtSecret: jwtSecret,
	}
}

func (s *Service) Register(ctx context.Context, req models.RegisterRequest) (*models.RegisterResponseData, error) {
	// Validation
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" {
		return nil, errors.New("el correo electrónico es obligatorio")
	}
	if _, err := mail.ParseAddress(email); err != nil {
		return nil, errors.New("formato de correo electrónico inválido")
	}

	fullName := strings.TrimSpace(req.FullName)
	if len(fullName) < 2 {
		return nil, errors.New("el nombre completo debe tener al menos 2 caracteres")
	}

	if len(req.Password) < 8 {
		return nil, errors.New("la contraseña debe tener al menos 8 caracteres")
	}

	// Check if already exists
	existing, err := s.repo.FindUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, ErrUserAlreadyExists
	}

	// Hash password
	passwordHash, err := HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	currency := strings.ToUpper(strings.TrimSpace(req.BaseCurrency))
	if currency == "" {
		currency = "USD"
	}

	seedResult, err := s.repo.CreateUserWithSeedData(ctx, CreateUserData{
		Email:        email,
		PasswordHash: passwordHash,
		FullName:     fullName,
		BaseCurrency: currency,
	})
	if err != nil {
		return nil, err
	}

	token, err := GenerateToken(s.jwtSecret, seedResult.User.ID.String(), seedResult.User.Email, seedResult.Profile.ID.String())
	if err != nil {
		return nil, err
	}

	return &models.RegisterResponseData{
		User:            seedResult.User,
		Profile:         seedResult.Profile,
		AccountsCount:   len(seedResult.Accounts),
		CategoriesCount: len(seedResult.Categories),
		Token:           token,
	}, nil
}

func (s *Service) Login(ctx context.Context, req models.LoginRequest) (*models.LoginResponseData, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" || req.Password == "" {
		return nil, ErrInvalidCredentials
	}

	user, err := s.repo.FindUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrInvalidCredentials
	}

	valid, err := VerifyPassword(req.Password, user.PasswordHash)
	if err != nil || !valid {
		return nil, ErrInvalidCredentials
	}

	profiles, err := s.repo.FindProfilesByUserID(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	var activeProfile *models.Profile
	var profileID string
	if len(profiles) > 0 {
		activeProfile = &profiles[0]
		profileID = activeProfile.ID.String()
	}

	token, err := GenerateToken(s.jwtSecret, user.ID.String(), user.Email, profileID)
	if err != nil {
		return nil, err
	}

	return &models.LoginResponseData{
		User:          *user,
		Profiles:      profiles,
		ActiveProfile: activeProfile,
		Token:         token,
	}, nil
}

func (s *Service) GetMe(ctx context.Context, userID uuid.UUID) (*models.MeResponseData, error) {
	user, err := s.repo.FindUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrUserNotFound
	}

	profiles, err := s.repo.FindProfilesByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &models.MeResponseData{
		User:     *user,
		Profiles: profiles,
	}, nil
}
