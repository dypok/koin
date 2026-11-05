package categories

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

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	categories, err := h.service.List(r.Context(), profileID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al obtener categorías")
		return
	}

	response.JSON(w, http.StatusOK, categories)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	catID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de categoría inválido")
		return
	}

	cat, err := h.service.GetByID(r.Context(), catID, profileID)
	if err != nil {
		if errors.Is(err, ErrCategoryNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al obtener la categoría")
		return
	}

	response.JSON(w, http.StatusOK, cat)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	var req models.CreateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud inválido")
		return
	}

	cat, err := h.service.Create(r.Context(), profileID, req)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.JSON(w, http.StatusCreated, cat)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	catID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de categoría inválido")
		return
	}

	var req models.UpdateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud inválido")
		return
	}

	cat, err := h.service.Update(r.Context(), catID, profileID, req)
	if err != nil {
		if errors.Is(err, ErrCategoryNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, cat)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getAuthenticatedProfile(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	catID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de categoría inválido")
		return
	}

	err = h.service.Delete(r.Context(), catID, profileID)
	if err != nil {
		if errors.Is(err, ErrCategoryNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, ErrCategoryInUse) {
			response.Error(w, http.StatusConflict, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al eliminar la categoría")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{
		"message": "Categoría eliminada con éxito",
	})
}
