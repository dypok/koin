package auth

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/google/uuid"
	"koin/server/internal/models"
	"koin/server/internal/response"
)

type ClaimsGetter func(r *http.Request) *JWTClaims

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

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud JSON inválido.")
		return
	}

	result, err := h.service.Register(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrUserAlreadyExists) {
			response.Error(w, http.StatusConflict, err.Error())
			return
		}
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(w, http.StatusCreated, "Cuenta titular registrada con éxito.", result)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud JSON inválido.")
		return
	}

	result, err := h.service.Login(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			response.Error(w, http.StatusUnauthorized, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error interno durante la autenticación.")
		return
	}

	response.Success(w, http.StatusOK, "Sesión iniciada con éxito.", result)
}

func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	claims := h.claimsGetter(r)
	if claims == nil || claims.UserID == "" {
		response.Error(w, http.StatusUnauthorized, "No autenticado")
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "Identificador de usuario inválido en token")
		return
	}

	result, err := h.service.GetMe(r.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			response.Error(w, http.StatusNotFound, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al recuperar datos de sesión.")
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"data": result,
	})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]string{
		"message": "Sesión cerrada exitosamente.",
	})
}
