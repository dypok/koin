package analytics

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"koin/server/internal/auth"
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

// GetSummary returns net worth, month income/expense, and savings rate.
func (h *Handler) GetSummary(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	month := strings.TrimSpace(r.URL.Query().Get("month"))
	summary, err := h.service.GetSummary(r.Context(), profileID, month)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al calcular el resumen analítico")
		return
	}

	response.JSON(w, http.StatusOK, summary)
}

// GetCategoryExpenses returns distribution of expenses by category for a month.
func (h *Handler) GetCategoryExpenses(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	month := strings.TrimSpace(r.URL.Query().Get("month"))
	items, err := h.service.GetCategoryExpenses(r.Context(), profileID, month)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al obtener analítica de categorías")
		return
	}

	response.JSON(w, http.StatusOK, items)
}

// GetMonthlyCashflow returns historical cashflow.
func (h *Handler) GetMonthlyCashflow(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	months := 6
	if mStr := r.URL.Query().Get("months"); mStr != "" {
		if parsed, err := strconv.Atoi(mStr); err == nil && parsed > 0 && parsed <= 24 {
			months = parsed
		}
	}

	items, err := h.service.GetMonthlyCashflow(r.Context(), profileID, months)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al obtener flujo de caja")
		return
	}

	response.JSON(w, http.StatusOK, items)
}
