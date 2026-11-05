package recurring

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"koin/server/internal/models"
)

var (
	ErrInvalidAmount       = errors.New("el importe debe ser mayor a cero")
	ErrInvalidFrequency    = errors.New("frecuencia inválida (debe ser monthly, biweekly, weekly o yearly)")
	ErrInvalidDayOfMonth   = errors.New("el día del mes debe estar entre 1 y 31")
	ErrInvalidInstallments = errors.New("para deudas y créditos debes especificar el número de cuotas (mayor a cero)")
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// Create validates and creates a recurring rule or debt commitment.
func (s *Service) Create(ctx context.Context, profileID uuid.UUID, req models.CreateRecurringRuleRequest) (*models.RecurringRule, error) {
	if req.Amount.LessThanOrEqual(decimal.Zero) {
		return nil, ErrInvalidAmount
	}

	freq := strings.ToLower(strings.TrimSpace(req.Frequency))
	if freq != "monthly" && freq != "biweekly" && freq != "weekly" && freq != "yearly" {
		return nil, ErrInvalidFrequency
	}
	req.Frequency = freq

	if req.DayOfMonth < 1 || req.DayOfMonth > 31 {
		return nil, ErrInvalidDayOfMonth
	}

	if req.IsInstallment {
		if req.TotalInstallments == nil || *req.TotalInstallments <= 0 {
			return nil, ErrInvalidInstallments
		}

		// Calculate automatic principal & interest breakdown if not explicitly provided
		n := decimal.NewFromInt(int64(*req.TotalInstallments))
		if req.PrincipalAmount != nil && req.PrincipalAmount.GreaterThan(decimal.Zero) {
			if req.InstallmentPrincipal == nil {
				ip := req.PrincipalAmount.DivRound(n, 2)
				req.InstallmentPrincipal = &ip
			}
			totalPaid := req.Amount.Mul(n)
			if totalPaid.GreaterThan(*req.PrincipalAmount) {
				totInterest := totalPaid.Sub(*req.PrincipalAmount).Round(2)
				req.TotalInterestAmount = &totInterest
				if req.InstallmentInterest == nil {
					ii := totInterest.DivRound(n, 2)
					req.InstallmentInterest = &ii
				}
			}
		}
	}

	// Parse nextRunDate
	var nextRunDate time.Time
	if strings.TrimSpace(req.NextRunDate) != "" {
		parsed, err := time.Parse("2006-01-02", strings.TrimSpace(req.NextRunDate))
		if err != nil {
			return nil, fmt.Errorf("fecha de inicio inválida: %w", err)
		}
		nextRunDate = parsed
	} else {
		// Default to today or next target day
		now := time.Now().UTC()
		nextRunDate = time.Date(now.Year(), now.Month(), req.DayOfMonth, 0, 0, 0, 0, time.UTC)
		if nextRunDate.Before(now.Truncate(24 * time.Hour)) {
			nextRunDate = CalculateNextRunDate(nextRunDate, req.Frequency, req.DayOfMonth)
		}
	}

	return s.repo.Create(ctx, profileID, req, nextRunDate)
}

// GetByID returns rule details.
func (s *Service) GetByID(ctx context.Context, id, profileID uuid.UUID) (*models.RecurringRule, error) {
	return s.repo.GetByID(ctx, id, profileID)
}

// List returns all rules for the profile.
func (s *Service) List(ctx context.Context, profileID uuid.UUID, status *string) ([]models.RecurringRule, error) {
	return s.repo.ListByProfile(ctx, profileID, status)
}

// Update modifies rule settings.
func (s *Service) Update(ctx context.Context, id, profileID uuid.UUID, req models.UpdateRecurringRuleRequest) (*models.RecurringRule, error) {
	var nextRunDate *time.Time
	if req.NextRunDate != nil && strings.TrimSpace(*req.NextRunDate) != "" {
		parsed, err := time.Parse("2006-01-02", strings.TrimSpace(*req.NextRunDate))
		if err != nil {
			return nil, fmt.Errorf("fecha de próxima ejecución inválida: %w", err)
		}
		nextRunDate = &parsed
	}

	return s.repo.Update(ctx, id, profileID, req, nextRunDate)
}

// Delete removes a recurring rule.
func (s *Service) Delete(ctx context.Context, id, profileID uuid.UUID) error {
	return s.repo.Delete(ctx, id, profileID)
}

// ApplyNow manually executes the current pending installment or monthly payment for a rule.
func (s *Service) ApplyNow(ctx context.Context, ruleID, profileID uuid.UUID) (*models.Transaction, *models.RecurringRule, error) {
	return s.repo.ExecuteInstallmentTx(ctx, ruleID, profileID)
}

// ProcessDue checks and executes all active rules that have reached or passed their due date.
func (s *Service) ProcessDue(ctx context.Context) (int, error) {
	today := time.Now().UTC().Truncate(24 * time.Hour)
	return s.repo.ProcessDueRules(ctx, today)
}
