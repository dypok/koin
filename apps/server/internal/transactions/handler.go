package transactions

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"koin/server/internal/auth"
	"koin/server/internal/models"
	"koin/server/internal/response"
)

type ClaimsGetter func(r *http.Request) *auth.JWTClaims

type Handler struct {
	service      *Service
	pool         *pgxpool.Pool
	claimsGetter ClaimsGetter
}

func NewHandler(service *Service, pool *pgxpool.Pool, claimsGetter ClaimsGetter) *Handler {
	return &Handler{
		service:      service,
		pool:         pool,
		claimsGetter: claimsGetter,
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

// List handles GET /api/v1/transactions with query filters and pagination.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	filter := models.TransactionFilter{
		ProfileID: profileID,
		Limit:     50,
		Offset:    0,
	}

	// Parse accountId
	if accStr := r.URL.Query().Get("accountId"); accStr != "" {
		if accID, err := uuid.Parse(accStr); err == nil {
			filter.AccountID = &accID
		}
	}

	// Parse categoryId
	if catStr := r.URL.Query().Get("categoryId"); catStr != "" {
		if catID, err := uuid.Parse(catStr); err == nil {
			filter.CategoryID = &catID
		}
	}

	// Parse type
	if typeStr := r.URL.Query().Get("type"); typeStr != "" {
		filter.Type = &typeStr
	}

	// Parse search
	if searchStr := r.URL.Query().Get("search"); searchStr != "" {
		filter.Search = &searchStr
	}

	// Parse date range
	if startStr := r.URL.Query().Get("startDate"); startStr != "" {
		if t, err := time.Parse(time.RFC3339, startStr); err == nil {
			filter.StartDate = &t
		} else if t, err := time.Parse("2006-01-02", startStr); err == nil {
			filter.StartDate = &t
		}
	}
	if endStr := r.URL.Query().Get("endDate"); endStr != "" {
		if t, err := time.Parse(time.RFC3339, endStr); err == nil {
			filter.EndDate = &t
		} else if t, err := time.Parse("2006-01-02", endStr); err == nil {
			endOfDay := t.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			filter.EndDate = &endOfDay
		}
	}

	// Parse pagination
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			filter.Limit = l
		}
	}
	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			filter.Offset = o
		}
	}

	result, err := h.service.List(r.Context(), filter)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al consultar transacciones")
		return
	}

	response.JSON(w, http.StatusOK, result)
}

// GetByID handles GET /api/v1/transactions/{id}.
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	txID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de transacción inválido")
		return
	}

	tx, err := h.service.GetByID(r.Context(), txID, profileID)
	if err != nil {
		if errors.Is(err, ErrTransactionNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al consultar la transacción")
		return
	}

	response.JSON(w, http.StatusOK, tx)
}

// Create handles POST /api/v1/transactions.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	var req models.CreateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud inválido")
		return
	}

	tx, err := h.service.Create(r.Context(), profileID, req)
	if err != nil {
		if errors.Is(err, ErrForbidden) {
			response.Error(w, http.StatusForbidden, err.Error())
			return
		}
		if errors.Is(err, ErrAccountNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.JSON(w, http.StatusCreated, tx)
}

// CreateTransfer handles POST /api/v1/transfers.
func (h *Handler) CreateTransfer(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	var req models.CreateTransferRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud inválido")
		return
	}

	tx, err := h.service.CreateTransfer(r.Context(), profileID, req)
	if err != nil {
		if errors.Is(err, ErrForbidden) {
			response.Error(w, http.StatusForbidden, err.Error())
			return
		}
		if errors.Is(err, ErrAccountNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.JSON(w, http.StatusCreated, tx)
}

// Update handles PATCH /api/v1/transactions/{id}.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	txID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de transacción inválido")
		return
	}

	var req models.UpdateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud inválido")
		return
	}

	tx, err := h.service.Update(r.Context(), txID, profileID, req)
	if err != nil {
		if errors.Is(err, ErrTransactionNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, ErrForbidden) {
			response.Error(w, http.StatusForbidden, err.Error())
			return
		}
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, tx)
}

// Delete handles DELETE /api/v1/transactions/{id}.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	txID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de transacción inválido")
		return
	}

	err = h.service.Delete(r.Context(), txID, profileID)
	if err != nil {
		if errors.Is(err, ErrTransactionNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, ErrForbidden) {
			response.Error(w, http.StatusForbidden, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al eliminar la transacción")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{
		"message": "Transacción eliminada con éxito",
	})
}

// ListRates handles GET /api/v1/currencies/rates.
func (h *Handler) ListRates(w http.ResponseWriter, r *http.Request) {
	rates, err := h.service.ListRates(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al consultar tasas de cambio")
		return
	}

	response.JSON(w, http.StatusOK, rates)
}
