package budgets

import (
	"testing"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"koin/server/internal/models"
)

func TestCalculateBudgetHealth(t *testing.T) {
	tests := []struct {
		name              string
		limitAmount       string
		spentAmount       string
		alertThreshold    int
		expectedRemaining string
		expectedPercent   string
		expectedStatus    string
	}{
		{
			name:              "Under threshold is on_track",
			limitAmount:       "1000.00",
			spentAmount:       "500.00",
			alertThreshold:    80,
			expectedRemaining: "500",
			expectedPercent:   "50",
			expectedStatus:    "on_track",
		},
		{
			name:              "At 79.9% is on_track for 80% threshold",
			limitAmount:       "1000.00",
			spentAmount:       "799.00",
			alertThreshold:    80,
			expectedRemaining: "201",
			expectedPercent:   "79.9",
			expectedStatus:    "on_track",
		},
		{
			name:              "At exactly alert threshold is warning",
			limitAmount:       "1000.00",
			spentAmount:       "800.00",
			alertThreshold:    80,
			expectedRemaining: "200",
			expectedPercent:   "80",
			expectedStatus:    "warning",
		},
		{
			name:              "Between warning threshold and 100% is warning",
			limitAmount:       "500.00",
			spentAmount:       "450.00",
			alertThreshold:    80,
			expectedRemaining: "50",
			expectedPercent:   "90",
			expectedStatus:    "warning",
		},
		{
			name:              "At exactly 100% is exceeded",
			limitAmount:       "300.00",
			spentAmount:       "300.00",
			alertThreshold:    80,
			expectedRemaining: "0",
			expectedPercent:   "100",
			expectedStatus:    "exceeded",
		},
		{
			name:              "Over 100% is exceeded with negative remaining",
			limitAmount:       "250.00",
			spentAmount:       "325.00",
			alertThreshold:    70,
			expectedRemaining: "-75",
			expectedPercent:   "130",
			expectedStatus:    "exceeded",
		},
		{
			name:              "Zero spent is 0% on_track",
			limitAmount:       "1000.00",
			spentAmount:       "0.00",
			alertThreshold:    80,
			expectedRemaining: "1000",
			expectedPercent:   "0",
			expectedStatus:    "on_track",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			b := models.Budget{
				ID:                    uuid.New(),
				LimitAmount:           decimal.RequireFromString(tc.limitAmount),
				SpentAmount:           decimal.RequireFromString(tc.spentAmount),
				AlertThresholdPercent: tc.alertThreshold,
			}

			CalculateBudgetHealth(&b)

			expectedRemaining := decimal.RequireFromString(tc.expectedRemaining)
			if !b.RemainingAmount.Equal(expectedRemaining) {
				t.Errorf("RemainingAmount mismatch: got %s, want %s", b.RemainingAmount.String(), tc.expectedRemaining)
			}

			expectedPercent := decimal.RequireFromString(tc.expectedPercent)
			if !b.PercentageUsed.Equal(expectedPercent) {
				t.Errorf("PercentageUsed mismatch: got %s, want %s", b.PercentageUsed.String(), tc.expectedPercent)
			}

			if b.Status != tc.expectedStatus {
				t.Errorf("Status mismatch: got %s, want %s", b.Status, tc.expectedStatus)
			}
		})
	}
}
