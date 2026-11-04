package profiles

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"koin/server/internal/auth"
	"koin/server/internal/models"
	"koin/server/internal/response"
)

type ClaimsGetter func(r *http.Request) *auth.JWTClaims

type Handler struct {
	service      *Service
	claimsGetter ClaimsGetter
}

func NewHandler(service *Service, claimsGetter ClaimsGetter) *Handler {
	return &Handler{
		service:      service,
		claimsGetter: claimsGetter,
	}
}

// List returns all profiles owned by the authenticated user.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	claims := h.claimsGetter(r)
	if claims == nil || claims.UserID == "" {
		response.Error(w, http.StatusUnauthorized, "No autenticado")
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "Token de usuario inválido")
		return
	}

	profilesList, err := h.service.List(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al consultar los perfiles")
		return
	}

	response.Success(w, http.StatusOK, "Perfiles obtenidos correctamente", profilesList)
}

// GetByID returns a single profile by its ID.
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	profileID, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de perfil inválido")
		return
	}

	p, err := h.service.GetByID(r.Context(), profileID)
	if err != nil {
		if errors.Is(err, ErrProfileNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al consultar perfil")
		return
	}

	response.Success(w, http.StatusOK, "Perfil obtenido", p)
}

// Create provisions a new sovereign profile along with default accounts and categories in a single transaction.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	claims := h.claimsGetter(r)
	if claims == nil || claims.UserID == "" {
		response.Error(w, http.StatusUnauthorized, "No autenticado")
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "Token de usuario inválido")
		return
	}

	var req models.CreateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud JSON inválido")
		return
	}

	created, err := h.service.Create(r.Context(), userID, req)
	if err != nil {
		if errors.Is(err, ErrInvalidProfileName) || errors.Is(err, ErrInvalidPIN) {
			response.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error interno al crear el perfil")
		return
	}

	response.Success(w, http.StatusCreated, "Perfil creado exitosamente con sus cuentas y categorías iniciales", created)
}

// Update modifies profile metadata (name, avatar, theme, currency, pin).
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	claims := h.claimsGetter(r)
	if claims == nil || claims.UserID == "" {
		response.Error(w, http.StatusUnauthorized, "No autenticado")
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "Token de usuario inválido")
		return
	}

	idStr := chi.URLParam(r, "id")
	profileID, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de perfil inválido")
		return
	}

	var req models.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud JSON inválido")
		return
	}

	updated, err := h.service.Update(r.Context(), userID, profileID, req)
	if err != nil {
		if errors.Is(err, ErrProfileNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, ErrInvalidProfileName) || errors.Is(err, ErrInvalidPIN) {
			response.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al actualizar perfil")
		return
	}

	response.Success(w, http.StatusOK, "Perfil actualizado exitosamente", updated)
}

// Delete removes a profile and cascades associated private finance data, preserving the last profile.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := h.claimsGetter(r)
	if claims == nil || claims.UserID == "" {
		response.Error(w, http.StatusUnauthorized, "No autenticado")
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "Token de usuario inválido")
		return
	}

	idStr := chi.URLParam(r, "id")
	profileID, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de perfil inválido")
		return
	}

	err = h.service.Delete(r.Context(), userID, profileID)
	if err != nil {
		if errors.Is(err, ErrSingleProfile) {
			response.Error(w, http.StatusConflict, err.Error())
			return
		}
		if errors.Is(err, ErrProfileNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al eliminar perfil")
		return
	}

	response.Success(w, http.StatusOK, "Perfil eliminado exitosamente", nil)
}

// VerifyPIN checks whether the provided PIN matches the profile's Argon2id hash.
func (h *Handler) VerifyPIN(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	profileID, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de perfil inválido")
		return
	}

	var req models.VerifyPINRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud JSON inválido")
		return
	}

	valid, err := h.service.VerifyPIN(r.Context(), profileID, req.PIN)
	if err != nil {
		if errors.Is(err, ErrPINMismatch) {
			response.Error(w, http.StatusUnauthorized, err.Error())
			return
		}
		if errors.Is(err, ErrInvalidPIN) || errors.Is(err, ErrPINNotSet) {
			response.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, ErrProfileNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al verificar PIN")
		return
	}

	response.Success(w, http.StatusOK, "PIN verificado correctamente", map[string]bool{"valid": valid})
}
