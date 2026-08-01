package handlers

import (
	"net/http"
	"strconv"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type UsuarioHandler struct{ svc ports.UsuarioService }

func NewUsuarioHandler(svc ports.UsuarioService) *UsuarioHandler {
	return &UsuarioHandler{svc: svc}
}

func (h *UsuarioHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RoleID         int    `json:"role_id"`
		NombreUsuario  string `json:"nombre_usuario"`
		Email          string `json:"email"`
		Password       string `json:"password"`
		NombreCompleto string `json:"nombre_completo"`
		Telefono       string `json:"telefono"`
	}
	if err := Decode(r, &body); err != nil {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "body inválido"})
		return
	}
	if body.NombreUsuario == "" || body.Email == "" || body.Password == "" || body.NombreCompleto == "" {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "campos requeridos: nombre_usuario, email, password, nombre_completo"})
		return
	}

	u, err := h.svc.Crear(body.RoleID, body.NombreUsuario, body.Email, body.Password, body.NombreCompleto, body.Telefono)
	if err != nil {
		MapDomainError(w, err)
		return
	}
	JSON(w, http.StatusCreated, u)
}

func (h *UsuarioHandler) List(w http.ResponseWriter, r *http.Request) {
	var roleID *int
	if q := r.URL.Query().Get("role_id"); q != "" {
		id, err := strconv.Atoi(q)
		if err == nil {
			roleID = &id
		}
	}
	usuarios, err := h.svc.Listar(roleID)
	if err != nil {
		MapDomainError(w, err)
		return
	}
	if usuarios == nil {
		JSON(w, http.StatusOK, []domain.Usuario{})
		return
	}
	JSON(w, http.StatusOK, usuarios)
}
