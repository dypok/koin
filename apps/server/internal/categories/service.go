package categories

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"koin/server/internal/models"
)

var (
	ErrEmptyCategoryName = errors.New("el nombre de la categoría es obligatorio")
	ErrInvalidCategoryType = errors.New("el tipo de categoría debe ser 'expense' o 'income'")
	hexColorRegex = regexp.MustCompile(`^#[0-9A-Fa-f]{6}$`)
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, profileID uuid.UUID) ([]models.CategoryWithUsage, error) {
	return s.repo.ListByProfile(ctx, profileID)
}

func (s *Service) GetByID(ctx context.Context, id, profileID uuid.UUID) (*models.Category, error) {
	return s.repo.GetByID(ctx, id, profileID)
}

func (s *Service) Create(ctx context.Context, profileID uuid.UUID, req models.CreateCategoryRequest) (*models.Category, error) {
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		return nil, ErrEmptyCategoryName
	}

	req.Type = strings.ToLower(strings.TrimSpace(req.Type))
	if req.Type != "expense" && req.Type != "income" {
		return nil, ErrInvalidCategoryType
	}

	req.Icon = strings.TrimSpace(req.Icon)
	if req.Icon == "" {
		req.Icon = "Tag"
	}

	req.Color = strings.TrimSpace(req.Color)
	if !hexColorRegex.MatchString(req.Color) {
		req.Color = "#6B7280"
	}

	return s.repo.Create(ctx, profileID, req)
}

func (s *Service) Update(ctx context.Context, id, profileID uuid.UUID, req models.UpdateCategoryRequest) (*models.Category, error) {
	if req.Name != nil {
		trimmed := strings.TrimSpace(*req.Name)
		if trimmed == "" {
			return nil, ErrEmptyCategoryName
		}
		req.Name = &trimmed
	}

	if req.Color != nil {
		trimmed := strings.TrimSpace(*req.Color)
		if !hexColorRegex.MatchString(trimmed) {
			fallback := "#6B7280"
			req.Color = &fallback
		} else {
			req.Color = &trimmed
		}
	}

	return s.repo.Update(ctx, id, profileID, req)
}

func (s *Service) Delete(ctx context.Context, id, profileID uuid.UUID) error {
	return s.repo.Delete(ctx, id, profileID)
}
