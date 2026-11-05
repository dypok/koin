package transactions

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"koin/server/internal/models"
)

var (
	ErrInvalidTransactionType = errors.New("el tipo de transacción debe ser 'expense', 'income' o 'transfer'")
	ErrCategoryRequired       = errors.New("debes seleccionar una categoría válida para el movimiento")
	ErrToAccountRequired      = errors.New("una transferencia requiere especificar una cuenta de destino")
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// List returns filtered and paginated transactions.
func (s *Service) List(ctx context.Context, filter models.TransactionFilter) (*models.PaginatedTransactions, error) {
	return s.repo.List(ctx, filter)
}

// GetByID returns a transaction with relational metadata.
func (s *Service) GetByID(ctx context.Context, id, profileID uuid.UUID) (*models.Transaction, error) {
	return s.repo.GetByID(ctx, id, profileID)
}

// Create validates business rules and stores an income or expense with dual multicurrency precision.
func (s *Service) Create(ctx context.Context, profileID uuid.UUID, req models.CreateTransactionRequest) (*models.Transaction, error) {
	req.Type = strings.ToLower(strings.TrimSpace(req.Type))
	if req.Type != "expense" && req.Type != "income" && req.Type != "transfer" {
		return nil, ErrInvalidTransactionType
	}

	if req.Amount.LessThanOrEqual(decimal.Zero) {
		return nil, ErrNegativeAmount
	}

	// Verify permissions on the source account
	accountCurrency, _, err := s.repo.CheckAccountAccess(ctx, req.AccountID, profileID)
	if err != nil {
		return nil, err
	}

	// For transfer routing through Create
	if req.Type == "transfer" {
		if req.ToAccountID == nil {
			return nil, ErrToAccountRequired
		}
		return s.CreateTransfer(ctx, profileID, models.CreateTransferRequest{
			FromAccountID: req.AccountID,
			ToAccountID:   *req.ToAccountID,
			Amount:        req.Amount,
			ToAmount:      req.ToAmount,
			ExchangeRate:  req.ExchangeRateToBase,
			Date:          req.Date,
			Note:          req.Note,
			Tags:          req.Tags,
		})
	}

	if req.CategoryID == nil {
		return nil, ErrCategoryRequired
	}

	// Resolve transaction currency (defaults to account currency)
	txCurrency := accountCurrency
	if req.Currency != nil && strings.TrimSpace(*req.Currency) != "" {
		txCurrency = strings.ToUpper(strings.TrimSpace(*req.Currency))
	}

	// Resolve profile's base currency for dual tracking
	baseCurrency, err := s.repo.GetProfileBaseCurrency(ctx, profileID)
	if err != nil {
		baseCurrency = "USD"
	}

	// Resolve exchange rate to base
	var exchangeRate decimal.Decimal
	if req.ExchangeRateToBase != nil && req.ExchangeRateToBase.GreaterThan(decimal.Zero) {
		exchangeRate = *req.ExchangeRateToBase
	} else if txCurrency == baseCurrency {
		exchangeRate = decimal.NewFromInt(1)
	} else {
		rate, err := s.repo.GetExchangeRate(ctx, txCurrency, baseCurrency)
		if err != nil || rate.IsZero() {
			exchangeRate = decimal.NewFromInt(1)
		} else {
			exchangeRate = rate
		}
	}

	baseAmount := req.Amount.Mul(exchangeRate).Round(2)

	txDate := time.Now().UTC()
	if req.Date != nil && !req.Date.IsZero() {
		txDate = *req.Date
	}

	tags := req.Tags
	if tags == nil {
		tags = []string{}
	}

	tx := &models.Transaction{
		ProfileID:          profileID,
		AccountID:          req.AccountID,
		ToAccountID:        nil,
		CategoryID:         req.CategoryID,
		Type:               req.Type,
		Amount:             req.Amount,
		ToAmount:           nil,
		Currency:           txCurrency,
		ExchangeRateToBase: exchangeRate,
		BaseAmount:         baseAmount,
		Date:               txDate,
		Note:               req.Note,
		Tags:               tags,
		IsRecurring:        req.IsRecurring,
	}

	return s.repo.Create(ctx, tx)
}

// CreateTransfer executes an atomic ACID transfer debiting origin and crediting destination.
func (s *Service) CreateTransfer(ctx context.Context, profileID uuid.UUID, req models.CreateTransferRequest) (*models.Transaction, error) {
	if req.FromAccountID == req.ToAccountID {
		return nil, ErrSameAccountTransfer
	}

	if req.Amount.LessThanOrEqual(decimal.Zero) {
		return nil, ErrNegativeAmount
	}

	// Check permissions on both accounts
	fromCurrency, _, err := s.repo.CheckAccountAccess(ctx, req.FromAccountID, profileID)
	if err != nil {
		return nil, err
	}

	toCurrency, _, err := s.repo.CheckAccountAccess(ctx, req.ToAccountID, profileID)
	if err != nil {
		return nil, err
	}

	// Compute toAmount
	var toAmount decimal.Decimal
	if req.ToAmount != nil && req.ToAmount.GreaterThan(decimal.Zero) {
		toAmount = *req.ToAmount
	} else if fromCurrency == toCurrency {
		toAmount = req.Amount
	} else if req.ExchangeRate != nil && req.ExchangeRate.GreaterThan(decimal.Zero) {
		toAmount = req.Amount.Mul(*req.ExchangeRate).Round(2)
	} else {
		conversionRate, err := s.repo.GetExchangeRate(ctx, fromCurrency, toCurrency)
		if err != nil || conversionRate.IsZero() {
			toAmount = req.Amount
		} else {
			toAmount = req.Amount.Mul(conversionRate).Round(2)
		}
	}

	// Multicurrency base amount for profile
	baseCurrency, err := s.repo.GetProfileBaseCurrency(ctx, profileID)
	if err != nil {
		baseCurrency = "USD"
	}

	rateToBase, err := s.repo.GetExchangeRate(ctx, fromCurrency, baseCurrency)
	if err != nil || rateToBase.IsZero() {
		rateToBase = decimal.NewFromInt(1)
	}
	baseAmount := req.Amount.Mul(rateToBase).Round(2)

	txDate := time.Now().UTC()
	if req.Date != nil && !req.Date.IsZero() {
		txDate = *req.Date
	}

	tags := req.Tags
	if tags == nil {
		tags = []string{}
	}

	t := &models.Transaction{
		ProfileID:          profileID,
		AccountID:          req.FromAccountID,
		ToAccountID:        &req.ToAccountID,
		CategoryID:         nil,
		Type:               "transfer",
		Amount:             req.Amount,
		ToAmount:           &toAmount,
		Currency:           fromCurrency,
		ExchangeRateToBase: rateToBase,
		BaseAmount:         baseAmount,
		Date:               txDate,
		Note:               req.Note,
		Tags:               tags,
	}

	return s.repo.CreateTransfer(ctx, profileID, t)
}

// Update modifies transaction details, adjusting balances if amounts changed.
func (s *Service) Update(ctx context.Context, id, profileID uuid.UUID, req models.UpdateTransactionRequest) (*models.Transaction, error) {
	current, err := s.repo.GetByID(ctx, id, profileID)
	if err != nil {
		return nil, err
	}

	// Verify permissions on current account
	_, _, err = s.repo.CheckAccountAccess(ctx, current.AccountID, profileID)
	if err != nil {
		return nil, err
	}

	if req.Amount != nil && req.Amount.LessThanOrEqual(decimal.Zero) {
		return nil, ErrNegativeAmount
	}

	return s.repo.Update(ctx, id, profileID, req)
}

// Delete removes a transaction and reverses the balances on affected accounts.
func (s *Service) Delete(ctx context.Context, id, profileID uuid.UUID) error {
	current, err := s.repo.GetByID(ctx, id, profileID)
	if err != nil {
		return err
	}

	// Verify permissions
	_, _, err = s.repo.CheckAccountAccess(ctx, current.AccountID, profileID)
	if err != nil {
		return err
	}

	return s.repo.Delete(ctx, id, profileID)
}

// ListRates returns the system exchange rates.
func (s *Service) ListRates(ctx context.Context) ([]models.ExchangeRate, error) {
	return s.repo.ListExchangeRates(ctx)
}
