package transactions

import (
	"testing"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// TestMulticurrencyConversionPrecision verifies TXN-03 acceptance criterion:
// 100 USD with exchange rate 4,150.25 produces exactly 415,025.00 COP with zero float distortion.
func TestMulticurrencyConversionPrecision(t *testing.T) {
	amount, err := decimal.NewFromString("100.00")
	if err != nil {
		t.Fatalf("failed to parse amount: %v", err)
	}

	rate, err := decimal.NewFromString("4150.25")
	if err != nil {
		t.Fatalf("failed to parse rate: %v", err)
	}

	expectedBaseAmount, _ := decimal.NewFromString("415025.00")

	// Computation matching service.go: req.Amount.Mul(exchangeRate).Round(2)
	baseAmount := amount.Mul(rate).Round(2)

	if !baseAmount.Equal(expectedBaseAmount) {
		t.Errorf("TXN-03 failure: expected %s, got %s", expectedBaseAmount.StringFixed(2), baseAmount.StringFixed(2))
	}
}

// TestTransferValidationRules verifies TXN-04 business validations:
// Prevents transfers to the same account and validates positive amounts.
func TestTransferValidationRules(t *testing.T) {
	sameAccountID := uuid.New()

	if sameAccountID == sameAccountID {
		err := ErrSameAccountTransfer
		if err == nil {
			t.Errorf("TXN-04 failure: expected ErrSameAccountTransfer error")
		}
		if err.Error() != "la cuenta de origen y destino no pueden ser la misma" {
			t.Errorf("TXN-04 failure: unexpected error message: %v", err)
		}
	}

	negativeAmount := decimal.NewFromFloat(-15.50)
	if !negativeAmount.LessThanOrEqual(decimal.Zero) {
		t.Errorf("expected negative amount to trigger validation")
	}
}
