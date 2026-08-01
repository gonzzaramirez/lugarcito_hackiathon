package handlers

import (
	"net/http"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type AuthHandler struct{ svc ports.AuthService }

func NewAuthHandler(svc ports.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		NombreUsuario string `json:"nombre_usuario"`
		Password      string `json:"password"`
	}
	if err := Decode(r, &body); err != nil {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "body inválido"})
		return
	}

	token, u, err := h.svc.Login(body.NombreUsuario, body.Password)
	if err != nil {
		MapDomainError(w, err)
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"token": token,
		"usuario": map[string]interface{}{
			"id":              u.ID,
			"nombre_usuario":  u.NombreUsuario,
			"nombre_completo": u.NombreCompleto,
			"email":           u.Email,
			"role":            u.RoleNombre,
		},
	})
}
