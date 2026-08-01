package handlers

import (
	"net/http"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type CalleHandler struct{ svc ports.CalleService }

func NewCalleHandler(svc ports.CalleService) *CalleHandler {
	return &CalleHandler{svc: svc}
}

func (h *CalleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Nombre string `json:"nombre"`
	}
	if err := Decode(r, &body); err != nil || body.Nombre == "" {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "campo 'nombre' requerido"})
		return
	}
	calle, err := h.svc.Crear(body.Nombre)
	if err != nil {
		MapDomainError(w, err)
		return
	}
	JSON(w, http.StatusCreated, calle)
}

func (h *CalleHandler) List(w http.ResponseWriter, r *http.Request) {
	calles, err := h.svc.Listar()
	if err != nil {
		MapDomainError(w, err)
		return
	}
	if calles == nil {
		JSON(w, http.StatusOK, []domain.Calle{})
		return
	}
	JSON(w, http.StatusOK, calles)
}
