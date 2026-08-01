package handlers

import (
	"net/http"
	"strconv"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type RegistroHandler struct{ svc ports.RegistroService }

func NewRegistroHandler(svc ports.RegistroService) *RegistroHandler {
	return &RegistroHandler{svc: svc}
}

func (h *RegistroHandler) Entrada(w http.ResponseWriter, r *http.Request) {
	empleado := UsuarioFromCtx(r)
	var body struct {
		EstacionamientoGID int `json:"estacionamiento_gid"`
	}
	if err := Decode(r, &body); err != nil || body.EstacionamientoGID == 0 {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "campo 'estacionamiento_gid' requerido"})
		return
	}

	reg, err := h.svc.RegistrarEntrada(body.EstacionamientoGID, empleado.ID)
	if err != nil {
		MapDomainError(w, err)
		return
	}
	JSON(w, http.StatusCreated, reg)
}

func (h *RegistroHandler) Salida(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RegistroID int `json:"registro_id"`
	}
	if err := Decode(r, &body); err != nil || body.RegistroID == 0 {
		// También aceptar como path param
		idStr := r.PathValue("id")
		id, err2 := strconv.Atoi(idStr)
		if err2 != nil || id == 0 {
			JSON(w, http.StatusBadRequest, map[string]string{"error": "campo 'registro_id' requerido"})
			return
		}
		body.RegistroID = id
	}

	reg, err := h.svc.RegistrarSalida(body.RegistroID)
	if err != nil {
		MapDomainError(w, err)
		return
	}
	JSON(w, http.StatusOK, reg)
}
