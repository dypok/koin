package budgets

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"koin/server/internal/models"
)

var (
	ErrInvalidLimitAmount = errors.New("el límite del presupuesto debe ser mayor a 0")
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// CalculateBudgetHealth populates RemainingAmount, PercentageUsed, and Status.
func CalculateBudgetHealth(b *models.Budget) {
	b.RemainingAmount = b.LimitAmount.Sub(b.SpentAmount)

	if b.LimitAmount.GreaterThan(decimal.Zero) {
		percentage := b.SpentAmount.Div(b.LimitAmount).Mul(decimal.NewFromInt(100)).Round(1)
		b.PercentageUsed = percentage

		thresholdDec := decimal.NewFromInt(int64(b.AlertThresholdPercent))
		if percentage.GreaterThanOrEqual(decimal.NewFromInt(100)) {
			b.Status = "exceeded"
		} else if percentage.GreaterThanOrEqual(thresholdDec) {
			b.Status = "warning"
		} else {
			b.Status = "on_track"
		}
	} else {
		b.PercentageUsed = decimal.Zero
		b.Status = "on_track"
	}
}

func (s *Service) List(ctx context.Context, profileID uuid.UUID, month string) ([]models.Budget, error) {
	budgets, err := s.repo.ListByProfile(ctx, profileID, month)
	if err != nil {
		return nil, err
	}

	for i := range budgets {
		CalculateBudgetHealth(&budgets[i])
	}

	return budgets, nil
}

func (s *Service) GetByID(ctx context.Context, id, profileID uuid.UUID, month string) (*models.Budget, error) {
	b, err := s.repo.GetByID(ctx, id, profileID, month)
	if err != nil {
		return nil, err
	}
	CalculateBudgetHealth(b)
	return b, nil
}

func (s *Service) Upsert(ctx context.Context, profileID uuid.UUID, req models.CreateOrUpdateBudgetRequest) (*models.Budget, error) {
	if req.LimitAmount.LessThanOrEqual(decimal.Zero) {
		return nil, ErrInvalidLimitAmount
	}

	b, err := s.repo.Upsert(ctx, profileID, req)
	if err != nil {
		return nil, err
	}
	CalculateBudgetHealth(b)
	return b, nil
}

func (s *Service) Update(ctx context.Context, id, profileID uuid.UUID, req models.UpdateBudgetRequest) (*models.Budget, error) {
	if req.LimitAmount != nil && req.LimitAmount.LessThanOrEqual(decimal.Zero) {
		return nil, ErrInvalidLimitAmount
	}

	b, err := s.repo.Update(ctx, id, profileID, req)
	if err != nil {
		return nil, err
	}
	CalculateBudgetHealth(b)
	return b, nil
}

func (s *Service) Delete(ctx context.Context, id, profileID uuid.UUID) error {
	return s.repo.Delete(ctx, id, profileID)
}
