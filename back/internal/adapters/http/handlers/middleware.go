package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type contextKey string

const userContextKey contextKey = "usuario"

// RequireAuth es un middleware que valida el JWT y agrega el usuario al contexto.
func RequireAuth(authSvc ports.AuthService, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			JSON(w, http.StatusUnauthorized, map[string]string{"error": "token requerido"})
			return
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")
		u, err := authSvc.ValidateToken(tokenStr)
		if err != nil {
			JSON(w, http.StatusUnauthorized, map[string]string{"error": "token inválido"})
			return
		}
		ctx := context.WithValue(r.Context(), userContextKey, u)
		next(w, r.WithContext(ctx))
	}
}

// RequireRole verifica que el usuario tenga el rol especificado.
func RequireRole(authSvc ports.AuthService, role string, next http.HandlerFunc) http.HandlerFunc {
	return RequireAuth(authSvc, func(w http.ResponseWriter, r *http.Request) {
		u := UsuarioFromCtx(r)
		if u == nil || u.RoleNombre != role {
			JSON(w, http.StatusForbidden, map[string]string{"error": "acceso denegado"})
			return
		}
		next(w, r)
	})
}

// UsuarioFromCtx extrae el usuario del contexto.
func UsuarioFromCtx(r *http.Request) *domain.Usuario {
	u, _ := r.Context().Value(userContextKey).(*domain.Usuario)
	return u
}

// JSON serializa y escribe una respuesta JSON.
func JSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// Decode lee el body JSON en v.
func Decode(r *http.Request, v interface{}) error {
	return json.NewDecoder(r.Body).Decode(v)
}

// MapDomainError convierte errores de dominio a HTTP status codes.
func MapDomainError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		JSON(w, http.StatusNotFound, map[string]string{"error": err.Error()})
	case errors.Is(err, domain.ErrConflict):
		JSON(w, http.StatusConflict, map[string]string{"error": err.Error()})
	case errors.Is(err, domain.ErrUnauthorized):
		JSON(w, http.StatusUnauthorized, map[string]string{"error": err.Error()})
	case errors.Is(err, domain.ErrForbidden):
		JSON(w, http.StatusForbidden, map[string]string{"error": err.Error()})
	case errors.Is(err, domain.ErrSinCapacidad),
		errors.Is(err, domain.ErrRegistroNoEnCurso),
		errors.Is(err, domain.ErrEmpleadoSinTurno):
		JSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
	default:
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "error interno del servidor"})
	}
}
