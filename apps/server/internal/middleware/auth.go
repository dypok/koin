package middleware

import (
	"context"
	"net/http"
	"strings"

	"koin/server/internal/auth"
	"koin/server/internal/response"
)

type contextKey string

const UserClaimsContextKey = contextKey("userClaims")

func AuthenticateToken(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if !strings.HasPrefix(authHeader, "Bearer ") {
				response.JSON(w, http.StatusUnauthorized, map[string]string{
					"error":   "No autenticado",
					"message": "Token de acceso ausente. Proporcione un encabezado Authorization: Bearer <token>",
				})
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := auth.ValidateToken(jwtSecret, tokenString)
			if err != nil {
				response.JSON(w, http.StatusForbidden, map[string]string{
					"error":   "Token inválido o expirado",
					"message": "La sesión no es válida o ha caducado. Inicie sesión nuevamente.",
				})
				return
			}

			ctx := context.WithValue(r.Context(), UserClaimsContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserClaims(ctx context.Context) *auth.JWTClaims {
	claims, ok := ctx.Value(UserClaimsContextKey).(*auth.JWTClaims)
	if !ok {
		return nil
	}
	return claims
}
