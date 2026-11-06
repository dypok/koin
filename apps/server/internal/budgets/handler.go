package budgets

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

// List returns budgets for the active profile.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	month := strings.TrimSpace(r.URL.Query().Get("month"))
	budgets, err := h.service.List(r.Context(), profileID, month)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al obtener presupuestos")
		return
	}

	response.JSON(w, http.StatusOK, budgets)
}

// GetByID returns a single budget.
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	bID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de presupuesto inválido")
		return
	}

	month := strings.TrimSpace(r.URL.Query().Get("month"))
	b, err := h.service.GetByID(r.Context(), bID, profileID, month)
	if err != nil {
		if errors.Is(err, ErrBudgetNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al obtener el presupuesto")
		return
	}

	response.JSON(w, http.StatusOK, b)
}

// Upsert creates or updates a budget.
func (h *Handler) Upsert(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	var req models.CreateOrUpdateBudgetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud inválido")
		return
	}

	b, err := h.service.Upsert(r.Context(), profileID, req)
	if err != nil {
		if errors.Is(err, ErrInvalidLimitAmount) || errors.Is(err, ErrCategoryNotFound) {
			response.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al guardar el presupuesto")
		return
	}

	response.JSON(w, http.StatusOK, b)
}

// Update modifies budget limit or alert threshold.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	bID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de presupuesto inválido")
		return
	}

	var req models.UpdateBudgetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud inválido")
		return
	}

	b, err := h.service.Update(r.Context(), bID, profileID, req)
	if err != nil {
		if errors.Is(err, ErrBudgetNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, ErrInvalidLimitAmount) {
			response.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al actualizar el presupuesto")
		return
	}

	response.JSON(w, http.StatusOK, b)
}

// Delete removes a budget.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	bID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de presupuesto inválido")
		return
	}

	if err := h.service.Delete(r.Context(), bID, profileID); err != nil {
		if errors.Is(err, ErrBudgetNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al eliminar el presupuesto")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"message": "Presupuesto eliminado exitosamente"})
}
