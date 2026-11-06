package export

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"koin/server/internal/accounts"
	"koin/server/internal/auth"
	"koin/server/internal/budgets"
	"koin/server/internal/categories"
	"koin/server/internal/models"
	"koin/server/internal/profiles"
	"koin/server/internal/recurring"
	"koin/server/internal/response"
	"koin/server/internal/transactions"
)

type ClaimsGetter func(r *http.Request) *auth.JWTClaims

type Handler struct {
	pool            *pgxpool.Pool
	claimsGetter    ClaimsGetter
	profileRepo     *profiles.Repository
	accountRepo     *accounts.Repository
	categoryRepo    *categories.Repository
	budgetRepo      *budgets.Repository
	recurringRepo   *recurring.Repository
	transactionRepo *transactions.Repository
}

func NewHandler(
	pool *pgxpool.Pool,
	claimsGetter ClaimsGetter,
	profileRepo *profiles.Repository,
	accountRepo *accounts.Repository,
	categoryRepo *categories.Repository,
	budgetRepo *budgets.Repository,
	recurringRepo *recurring.Repository,
	transactionRepo *transactions.Repository,
) *Handler {
	return &Handler{
		pool:            pool,
		claimsGetter:    claimsGetter,
		profileRepo:     profileRepo,
		accountRepo:     accountRepo,
		categoryRepo:    categoryRepo,
		budgetRepo:      budgetRepo,
		recurringRepo:   recurringRepo,
		transactionRepo: transactionRepo,
	}
}

func (h *Handler) resolveProfileID(r *http.Request, userID uuid.UUID) (uuid.UUID, error) {
	if hStr := r.Header.Get("X-Profile-ID"); hStr != "" {
		if pID, err := uuid.Parse(strings.TrimSpace(hStr)); err == nil {
			if h.verifyProfileOwnership(r, userID, pID) {
				return pID, nil
			}
		}
	}

	if qStr := r.URL.Query().Get("profileId"); qStr != "" {
		if pID, err := uuid.Parse(strings.TrimSpace(qStr)); err == nil {
			if h.verifyProfileOwnership(r, userID, pID) {
				return pID, nil
			}
		}
	}

	var firstProfileID uuid.UUID
	query := `SELECT id FROM koin_auth.profiles WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`
	err := h.pool.QueryRow(r.Context(), query, userID).Scan(&firstProfileID)
	if err == nil {
		return firstProfileID, nil
	}

	return uuid.Nil, errors.New("no se encontró un perfil activo válido")
}

func (h *Handler) verifyProfileOwnership(r *http.Request, userID, profileID uuid.UUID) bool {
	var count int
	query := `SELECT COUNT(*) FROM koin_auth.profiles WHERE id = $1 AND user_id = $2`
	err := h.pool.QueryRow(r.Context(), query, profileID, userID).Scan(&count)
	return err == nil && count > 0
}

func (h *Handler) getAuthenticatedProfile(r *http.Request) (uuid.UUID, error) {
	claims := h.claimsGetter(r)
	if claims == nil || claims.UserID == "" {
		return uuid.Nil, errors.New("no autenticado")
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return uuid.Nil, errors.New("token de usuario inválido")
	}

	return h.resolveProfileID(r, userID)
}

// ExportCSV streams all transactions for the profile as CSV with UTF-8 BOM.
func (h *Handler) ExportCSV(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Fetch all transactions without limit
	res, err := h.transactionRepo.List(r.Context(), models.TransactionFilter{
		ProfileID: profileID,
		Limit:     100000,
		Offset:    0,
	})
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al consultar transacciones para exportar")
		return
	}

	fileName := fmt.Sprintf("koin_transacciones_%s.csv", time.Now().Format("2006-01-02"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, fileName))

	// Write UTF-8 BOM so Microsoft Excel recognizes UTF-8 accents and characters properly
	w.Write([]byte{0xEF, 0xBB, 0xBF})

	csvWriter := csv.NewWriter(w)
	defer csvWriter.Flush()

	// Header row
	header := []string{
		"Fecha",
		"Cuenta",
		"Categoría",
		"Tipo",
		"Monto_Original",
		"Divisa",
		"Tasa_Cambio",
		"Monto_Base",
		"Nota",
	}
	if err := csvWriter.Write(header); err != nil {
		return
	}

	// Rows
	for _, tx := range res.Items {
		accName := ""
		if tx.AccountName != nil {
			accName = *tx.AccountName
		}
		catName := ""
		if tx.CategoryName != nil {
			catName = *tx.CategoryName
		} else if tx.Type == "transfer" {
			toAcc := ""
			if tx.ToAccountName != nil {
				toAcc = *tx.ToAccountName
			}
			catName = fmt.Sprintf("Transferencia -> %s", toAcc)
		}

		note := ""
		if tx.Note != nil {
			note = *tx.Note
		}

		row := []string{
			tx.Date.Format("2006-01-02 15:04:05"),
			accName,
			catName,
			tx.Type,
			tx.Amount.StringFixed(2),
			tx.Currency,
			tx.ExchangeRateToBase.String(),
			tx.BaseAmount.StringFixed(2),
			note,
		}
		if err := csvWriter.Write(row); err != nil {
			return
		}
	}
}

// ExportJSON generates a full relational backup dump of the profile.
func (h *Handler) ExportJSON(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	// 1. Profile
	prof, err := h.profileRepo.FindProfileByID(r.Context(), profileID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al exportar perfil")
		return
	}

	// 2. Accounts
	accs, err := h.accountRepo.ListByProfile(r.Context(), profileID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al exportar cuentas")
		return
	}
	plainAccounts := make([]models.Account, len(accs))
	for i, a := range accs {
		plainAccounts[i] = a.Account
	}

	// 3. Categories
	catsWithUsage, err := h.categoryRepo.ListByProfile(r.Context(), profileID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al exportar categorías")
		return
	}
	plainCategories := make([]models.Category, len(catsWithUsage))
	for i, c := range catsWithUsage {
		plainCategories[i] = c.Category
	}

	// 4. Budgets
	budgetItems, err := h.budgetRepo.ListByProfile(r.Context(), profileID, "")
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al exportar presupuestos")
		return
	}

	// 5. Recurring Rules
	recurringRules, err := h.recurringRepo.ListByProfile(r.Context(), profileID, nil)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al exportar reglas recurrentes")
		return
	}

	// 6. Transactions
	txResult, err := h.transactionRepo.List(r.Context(), models.TransactionFilter{
		ProfileID: profileID,
		Limit:     100000,
		Offset:    0,
	})
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al exportar transacciones")
		return
	}

	backupData := models.ExportBackupData{
		ExportedAt:     time.Now().UTC(),
		Version:        "0.6.0",
		Profile:        *prof,
		Accounts:       plainAccounts,
		Categories:     plainCategories,
		Budgets:        budgetItems,
		RecurringRules: recurringRules,
		Transactions:   txResult.Items,
	}

	fileName := fmt.Sprintf("koin_backup_%s.json", time.Now().Format("2006-01-02"))
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, fileName))

	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	if err := enc.Encode(backupData); err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al serializar copia de seguridad JSON")
		return
	}
}
