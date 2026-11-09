package analytics

import (
	"context"

	"github.com/google/uuid"
	"koin/server/internal/models"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetSummary(ctx context.Context, profileID uuid.UUID, month string) (*models.AnalyticsSummary, error) {
	return s.repo.GetSummary(ctx, profileID, month)
}

func (s *Service) GetCategoryExpenses(ctx context.Context, profileID uuid.UUID, monthPeriod string) ([]models.CategoryExpenseItem, error) {
	return s.repo.GetCategoryExpenses(ctx, profileID, monthPeriod)
}

func (s *Service) GetMonthlyCashflow(ctx context.Context, profileID uuid.UUID, months int) ([]models.MonthlyCashflowItem, error) {
	return s.repo.GetMonthlyCashflow(ctx, profileID, months)
}
