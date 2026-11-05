package recurring

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

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

func (h *Handler) getAuthenticatedProfile(r *http.Request) (uuid.UUID, error) {
	claims := h.claimsGetter(r)
	if claims == nil || claims.UserID == "" {
		return uuid.Nil, errors.New("no autenticado")
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return uuid.Nil, errors.New("token inválido")
	}

	// 1. Try X-Profile-ID header
	if hStr := r.Header.Get("X-Profile-ID"); hStr != "" {
		if pID, err := uuid.Parse(strings.TrimSpace(hStr)); err == nil {
			return pID, nil
		}
	}

	// 2. Try query param ?profileId=
	if qStr := r.URL.Query().Get("profileId"); qStr != "" {
		if pID, err := uuid.Parse(strings.TrimSpace(qStr)); err == nil {
			return pID, nil
		}
	}

	// 3. Fallback to user's first profile
	var firstProfileID uuid.UUID
	err = h.pool.QueryRow(r.Context(), `SELECT id FROM koin_auth.profiles WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`, userID).Scan(&firstProfileID)
	if err == nil {
		return firstProfileID, nil
	}

	return uuid.Nil, errors.New("perfil activo no encontrado")
}

// List returns recurring rules and debts for the active profile.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	var statusPtr *string
	if s := r.URL.Query().Get("status"); s != "" {
		sClean := strings.TrimSpace(s)
		statusPtr = &sClean
	}

	rules, err := h.service.List(r.Context(), profileID, statusPtr)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al consultar compromisos recurrentes")
		return
	}

	response.Success(w, http.StatusOK, "Compromisos recurrentes obtenidos", rules)
}

// Create registers a new recurring rule or installment debt.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	var req models.CreateRecurringRuleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud inválido")
		return
	}

	rule, err := h.service.Create(r.Context(), profileID, req)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(w, http.StatusCreated, "Regla recurrente programada exitosamente", rule)
}

// GetByID returns a single rule.
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de regla inválido")
		return
	}

	rule, err := h.service.GetByID(r.Context(), id, profileID)
	if err != nil {
		if errors.Is(err, ErrRuleNotFound) {
			response.Error(w, http.StatusNotFound, "Regla no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al obtener la regla recurrente")
		return
	}

	response.Success(w, http.StatusOK, "Regla recurrente obtenida", rule)
}

// Update modifies rule details or pauses/activates it.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de regla inválido")
		return
	}

	var req models.UpdateRecurringRuleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud inválido")
		return
	}

	updated, err := h.service.Update(r.Context(), id, profileID, req)
	if err != nil {
		if errors.Is(err, ErrRuleNotFound) {
			response.Error(w, http.StatusNotFound, "Regla no encontrada")
			return
		}
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(w, http.StatusOK, "Regla recurrente actualizada", updated)
}

// Delete removes a recurring rule.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de regla inválido")
		return
	}

	if err := h.service.Delete(r.Context(), id, profileID); err != nil {
		if errors.Is(err, ErrRuleNotFound) {
			response.Error(w, http.StatusNotFound, "Regla no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al eliminar la regla")
		return
	}

	response.Success(w, http.StatusOK, "Regla recurrente eliminada", nil)
}

// ApplyNow manually executes the current pending installment or monthly payment for a rule.
func (h *Handler) ApplyNow(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de regla inválido")
		return
	}

	txn, rule, err := h.service.ApplyNow(r.Context(), id, profileID)
	if err != nil {
		if errors.Is(err, ErrRuleNotFound) {
			response.Error(w, http.StatusNotFound, "Regla no encontrada")
			return
		}
		if errors.Is(err, ErrRuleAlreadyCompleted) || errors.Is(err, ErrRuleNotActive) {
			response.Error(w, http.StatusConflict, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(w, http.StatusCreated, "Cuota / movimiento aplicado correctamente", map[string]interface{}{
		"transaction":   txn,
		"recurringRule": rule,
	})
}

// ProcessDue checks and executes all active rules due across profiles.
func (h *Handler) ProcessDue(w http.ResponseWriter, r *http.Request) {
	count, err := h.service.ProcessDue(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al procesar compromisos vencidos")
		return
	}

	response.Success(w, http.StatusOK, "Procesamiento de reglas periódicas completado", map[string]interface{}{
		"appliedCount": count,
	})
}
