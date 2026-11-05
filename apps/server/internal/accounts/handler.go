package accounts

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
	appBaseURL   string
}

func NewHandler(service *Service, pool *pgxpool.Pool, claimsGetter ClaimsGetter, appBaseURL string) *Handler {
	return &Handler{
		service:      service,
		pool:         pool,
		claimsGetter: claimsGetter,
		appBaseURL:   appBaseURL,
	}
}

// resolveProfileID retrieves the active profile from the request (X-Profile-ID header, query param, or user default).
func (h *Handler) resolveProfileID(r *http.Request, userID uuid.UUID) (uuid.UUID, error) {
	// 1. Try X-Profile-ID header
	if hStr := r.Header.Get("X-Profile-ID"); hStr != "" {
		if pID, err := uuid.Parse(strings.TrimSpace(hStr)); err == nil {
			if h.verifyProfileOwnership(r, userID, pID) {
				return pID, nil
			}
		}
	}

	// 2. Try query parameter ?profileId=
	if qStr := r.URL.Query().Get("profileId"); qStr != "" {
		if pID, err := uuid.Parse(strings.TrimSpace(qStr)); err == nil {
			if h.verifyProfileOwnership(r, userID, pID) {
				return pID, nil
			}
		}
	}

	// 3. Fallback to user's first profile
	var firstProfileID uuid.UUID
	query := `SELECT id FROM auth.profiles WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`
	err := h.pool.QueryRow(r.Context(), query, userID).Scan(&firstProfileID)
	if err == nil {
		return firstProfileID, nil
	}

	return uuid.Nil, errors.New("no se pudo determinar el perfil activo")
}

func (h *Handler) verifyProfileOwnership(r *http.Request, userID, profileID uuid.UUID) bool {
	var count int
	query := `SELECT COUNT(*) FROM auth.profiles WHERE id = $1 AND user_id = $2`
	err := h.pool.QueryRow(r.Context(), query, profileID, userID).Scan(&count)
	return err == nil && count > 0
}

// List returns accounts accessible to the authenticated profile with real-time balance calculations.
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

	profileID, err := h.resolveProfileID(r, userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Perfil activo no encontrado o inválido")
		return
	}

	accountsList, err := h.service.List(r.Context(), profileID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Error al consultar las cuentas financieras")
		return
	}

	response.Success(w, http.StatusOK, "Cuentas obtenidas correctamente", accountsList)
}

// GetByID returns an account by ID if the caller has permissions.
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
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

	accountIDStr := chi.URLParam(r, "id")
	accountID, err := uuid.Parse(accountIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de cuenta inválido")
		return
	}

	profileID, err := h.resolveProfileID(r, userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Perfil activo no encontrado")
		return
	}

	acc, err := h.service.GetByID(r.Context(), accountID, profileID)
	if err != nil {
		if errors.Is(err, ErrAccountNotFound) {
			response.Error(w, http.StatusNotFound, "Cuenta no encontrada o sin acceso")
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al obtener la cuenta")
		return
	}

	response.Success(w, http.StatusOK, "Detalle de cuenta obtenido", acc)
}

// Create registers a new private account for the profile.
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

	profileID, err := h.resolveProfileID(r, userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Perfil activo no encontrado")
		return
	}

	var req models.CreateAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud JSON inválido")
		return
	}

	newAccount, err := h.service.Create(r.Context(), profileID, req)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(w, http.StatusCreated, "Cuenta financiera creada correctamente", newAccount)
}

// Update edits account details. Only owners are allowed.
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

	accountIDStr := chi.URLParam(r, "id")
	accountID, err := uuid.Parse(accountIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de cuenta inválido")
		return
	}

	profileID, err := h.resolveProfileID(r, userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Perfil activo no encontrado")
		return
	}

	var req models.UpdateAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud JSON inválido")
		return
	}

	updated, err := h.service.Update(r.Context(), accountID, profileID, req)
	if err != nil {
		if errors.Is(err, ErrForbidden) {
			response.Error(w, http.StatusForbidden, "Solo el propietario puede modificar la cuenta")
			return
		}
		if errors.Is(err, ErrAccountNotFound) {
			response.Error(w, http.StatusNotFound, "Cuenta no encontrada")
			return
		}
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(w, http.StatusOK, "Cuenta actualizada correctamente", updated)
}

// Delete deletes an account. Only owners are allowed.
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

	accountIDStr := chi.URLParam(r, "id")
	accountID, err := uuid.Parse(accountIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de cuenta inválido")
		return
	}

	profileID, err := h.resolveProfileID(r, userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Perfil activo no encontrado")
		return
	}

	err = h.service.Delete(r.Context(), accountID, profileID)
	if err != nil {
		if errors.Is(err, ErrForbidden) {
			response.Error(w, http.StatusForbidden, "Solo el propietario puede eliminar la cuenta")
			return
		}
		if errors.Is(err, ErrAccountNotFound) {
			response.Error(w, http.StatusNotFound, "Cuenta no encontrada")
			return
		}
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(w, http.StatusOK, "Cuenta eliminada correctamente", nil)
}

// CreateInvitation generates a 7-day cryptographic invite link for the account.
func (h *Handler) CreateInvitation(w http.ResponseWriter, r *http.Request) {
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

	accountIDStr := chi.URLParam(r, "id")
	accountID, err := uuid.Parse(accountIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de cuenta inválido")
		return
	}

	profileID, err := h.resolveProfileID(r, userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Perfil activo no encontrado")
		return
	}

	var req models.CreateInvitationRequest
	_ = json.NewDecoder(r.Body).Decode(&req)
	if req.Role == "" {
		req.Role = "editor"
	}

	inv, err := h.service.CreateInvitation(r.Context(), accountID, profileID, req.Role, h.appBaseURL)
	if err != nil {
		if errors.Is(err, ErrForbidden) {
			response.Error(w, http.StatusForbidden, "Solo el propietario puede invitar a miembros a la cuenta")
			return
		}
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(w, http.StatusCreated, "Enlace de invitación generado correctamente", inv)
}

// ValidateInvitation returns public account and invitation details for preview before joining.
func (h *Handler) ValidateInvitation(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		response.Error(w, http.StatusBadRequest, "Token de invitación requerido")
		return
	}

	inv, err := h.service.ValidateInvitation(r.Context(), token, h.appBaseURL)
	if err != nil {
		if errors.Is(err, ErrInvitationExpired) {
			response.Error(w, http.StatusGone, "La invitación ha expirado o ya no existe")
			return
		}
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(w, http.StatusOK, "Invitación validada", inv)
}

// AcceptInvitation joins the authenticated profile to the shared account.
func (h *Handler) AcceptInvitation(w http.ResponseWriter, r *http.Request) {
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

	var req models.AcceptInvitationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud JSON inválido")
		return
	}

	if req.ProfileID == uuid.Nil {
		response.Error(w, http.StatusBadRequest, "Debe especificar el perfil al que desea vincular la cuenta")
		return
	}

	if !h.verifyProfileOwnership(r, userID, req.ProfileID) {
		response.Error(w, http.StatusForbidden, "El perfil seleccionado no pertenece a tu usuario")
		return
	}

	accountWithRole, err := h.service.AcceptInvitation(r.Context(), req.Token, req.ProfileID)
	if err != nil {
		if errors.Is(err, ErrInvitationUsed) {
			response.Error(w, http.StatusConflict, "Esta invitación ya ha sido utilizada")
			return
		}
		if errors.Is(err, ErrInvitationExpired) {
			response.Error(w, http.StatusGone, "La invitación ha expirado o no es válida")
			return
		}
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(w, http.StatusOK, "Te has unido a la cuenta compartida correctamente", accountWithRole)
}

// ListMembers returns all collaborators and the owner of an account.
func (h *Handler) ListMembers(w http.ResponseWriter, r *http.Request) {
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

	accountIDStr := chi.URLParam(r, "id")
	accountID, err := uuid.Parse(accountIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de cuenta inválido")
		return
	}

	profileID, err := h.resolveProfileID(r, userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Perfil activo no encontrado")
		return
	}

	members, err := h.service.ListMembers(r.Context(), accountID, profileID)
	if err != nil {
		if errors.Is(err, ErrAccountNotFound) {
			response.Error(w, http.StatusNotFound, "Cuenta no encontrada o sin acceso")
			return
		}
		response.Error(w, http.StatusInternalServerError, "Error al listar miembros de la cuenta")
		return
	}

	response.Success(w, http.StatusOK, "Miembros obtenidos correctamente", members)
}

// UpdateMemberRole updates a collaborator's role.
func (h *Handler) UpdateMemberRole(w http.ResponseWriter, r *http.Request) {
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

	accountIDStr := chi.URLParam(r, "id")
	accountID, err := uuid.Parse(accountIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de cuenta inválido")
		return
	}

	memberIDStr := chi.URLParam(r, "memberId")
	memberID, err := uuid.Parse(memberIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de miembro inválido")
		return
	}

	profileID, err := h.resolveProfileID(r, userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Perfil activo no encontrado")
		return
	}

	var req models.UpdateMemberRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Cuerpo de solicitud JSON inválido")
		return
	}

	err = h.service.UpdateMemberRole(r.Context(), accountID, profileID, memberID, req.Role)
	if err != nil {
		if errors.Is(err, ErrForbidden) {
			response.Error(w, http.StatusForbidden, "Solo el propietario puede modificar roles")
			return
		}
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(w, http.StatusOK, "Rol de miembro actualizado correctamente", nil)
}

// RemoveMember removes a collaborator from the account.
func (h *Handler) RemoveMember(w http.ResponseWriter, r *http.Request) {
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

	accountIDStr := chi.URLParam(r, "id")
	accountID, err := uuid.Parse(accountIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de cuenta inválido")
		return
	}

	memberIDStr := chi.URLParam(r, "memberId")
	memberID, err := uuid.Parse(memberIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de miembro inválido")
		return
	}

	profileID, err := h.resolveProfileID(r, userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Perfil activo no encontrado")
		return
	}

	err = h.service.RemoveMember(r.Context(), accountID, profileID, memberID)
	if err != nil {
		if errors.Is(err, ErrForbidden) {
			response.Error(w, http.StatusForbidden, "Solo el propietario puede remover miembros")
			return
		}
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(w, http.StatusOK, "Miembro eliminado de la cuenta", nil)
}

// LeaveAccount allows a collaborating profile to leave the account.
func (h *Handler) LeaveAccount(w http.ResponseWriter, r *http.Request) {
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

	accountIDStr := chi.URLParam(r, "id")
	accountID, err := uuid.Parse(accountIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID de cuenta inválido")
		return
	}

	profileID, err := h.resolveProfileID(r, userID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Perfil activo no encontrado")
		return
	}

	err = h.service.LeaveAccount(r.Context(), accountID, profileID)
	if err != nil {
		if errors.Is(err, ErrOwnerCannotLeave) {
			response.Error(w, http.StatusConflict, "El propietario de la cuenta no puede abandonarla")
			return
		}
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(w, http.StatusOK, "Has abandonado la cuenta compartida correctamente", nil)
}
