package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type EstacionamientoHandler struct{ svc ports.EstacionamientoService }

func NewEstacionamientoHandler(svc ports.EstacionamientoService) *EstacionamientoHandler {
	return &EstacionamientoHandler{svc: svc}
}

// Mapa devuelve el GeoJSON FeatureCollection de todos los tramos activos.
func (h *EstacionamientoHandler) Mapa(w http.ResponseWriter, r *http.Request) {
	estacionamientos, err := h.svc.ObtenerMapa()
	if err != nil {
		MapDomainError(w, err)
		return
	}
	renderGeoJSON(w, estacionamientos)
}

// Cercanos devuelve los estacionamientos dentro del radio dado la ubicación del usuario (lat, lng, radio en km).
func (h *EstacionamientoHandler) Cercanos(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	latStr := q.Get("lat")
	lngStr := q.Get("lng")
	radioStr := q.Get("radio")

	if latStr == "" || lngStr == "" {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "parámetros 'lat' y 'lng' son requeridos"})
		return
	}

	lat, err1 := strconv.ParseFloat(latStr, 64)
	lng, err2 := strconv.ParseFloat(lngStr, 64)
	if err1 != nil || err2 != nil {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "'lat' y 'lng' deben ser números válidos"})
		return
	}

	radioKm := 1.0 // radio por defecto en km
	if radioStr != "" {
		if rKm, err := strconv.ParseFloat(radioStr, 64); err == nil && rKm > 0 {
			radioKm = rKm
		}
	}

	cercanos, err := h.svc.ObtenerCercanos(lat, lng, radioKm)
	if err != nil {
		MapDomainError(w, err)
		return
	}

	features := make([]map[string]interface{}, 0, len(cercanos))
	for _, item := range cercanos {
		geom, err := parseGeojson(item.GeometriaGeoJSON)
		if err != nil {
			continue
		}
		color := colorEstado(item.CapacidadLibre)

		props := map[string]interface{}{
			"gid":               item.GID,
			"capacidad_total":   item.CapacidadTotal,
			"capacidad_ocupada": item.CapacidadOcupada,
			"capacidad_libre":   item.CapacidadLibre,
			"ocupacion_texto":   fmt.Sprintf("%d de %d", item.CapacidadOcupada, item.CapacidadTotal),
			"distancia_km":      fmt.Sprintf("%.3f", item.DistanciaKm),
			"estado_color":      color,
		}
		if item.CallePrincipal != nil {
			props["calle_principal"] = item.CallePrincipal
		}
		if item.CalleParalela1 != nil {
			props["calle_paralela_1"] = item.CalleParalela1
		}
		if item.CalleParalela2 != nil {
			props["calle_paralela_2"] = item.CalleParalela2
		}

		features = append(features, map[string]interface{}{
			"type":       "Feature",
			"geometry":   geom,
			"properties": props,
		})
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"type":           "FeatureCollection",
		"usuario_lat":    lat,
		"usuario_lng":    lng,
		"radio_km":       radioKm,
		"total_hallados": len(features),
		"features":       features,
	})
}

func renderGeoJSON(w http.ResponseWriter, estacionamientos []domain.Estacionamiento) {
	features := make([]map[string]interface{}, 0, len(estacionamientos))
	for _, e := range estacionamientos {
		geom, err := parseGeojson(e.GeometriaGeoJSON)
		if err != nil {
			continue
		}
		color := colorEstado(e.CapacidadLibre)

		props := map[string]interface{}{
			"gid":               e.GID,
			"capacidad_total":   e.CapacidadTotal,
			"capacidad_ocupada": e.CapacidadOcupada,
			"capacidad_libre":   e.CapacidadLibre,
			"ocupacion_texto":   fmt.Sprintf("%d de %d", e.CapacidadOcupada, e.CapacidadTotal),
			"estado_color":      color,
		}
		if e.CallePrincipal != nil {
			props["calle_principal"] = e.CallePrincipal
		}
		if e.CalleParalela1 != nil {
			props["calle_paralela_1"] = e.CalleParalela1
		}
		if e.CalleParalela2 != nil {
			props["calle_paralela_2"] = e.CalleParalela2
		}

		features = append(features, map[string]interface{}{
			"type":       "Feature",
			"geometry":   geom,
			"properties": props,
		})
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"type":     "FeatureCollection",
		"features": features,
	})
}

func parseGeojson(raw string) (interface{}, error) {
	var geom interface{}
	if err := json.Unmarshal([]byte(raw), &geom); err != nil {
		return nil, err
	}
	return geom, nil
}

func colorEstado(libres int) string {
	switch {
	case libres <= 0:
		return "ROJO"
	case libres <= 3:
		return "NARANJA"
	case libres <= 5:
		return "AMARILLO"
	default:
		return "VERDE"
	}
}

// -- Asignaciones --

type AsignacionHandler struct {
	svc    ports.AsignacionService
	authSvc ports.AuthService
}

func NewAsignacionHandler(svc ports.AsignacionService) *AsignacionHandler {
	return &AsignacionHandler{svc: svc}
}

func (h *AsignacionHandler) Asignar(w http.ResponseWriter, r *http.Request) {
	admin := UsuarioFromCtx(r)
	var body struct {
		EmpleadoID             int    `json:"empleado_id"`
		EstacionamientoGIDs    []int  `json:"estacionamiento_gids"`
		Fecha                  string `json:"fecha"`
		HoraInicio             string `json:"hora_inicio"`
		HoraFin                string `json:"hora_fin"`
	}
	if err := Decode(r, &body); err != nil {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "body inválido"})
		return
	}
	if body.EmpleadoID == 0 || len(body.EstacionamientoGIDs) == 0 || body.Fecha == "" || body.HoraInicio == "" || body.HoraFin == "" {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "campos requeridos: empleado_id, estacionamiento_gids, fecha, hora_inicio, hora_fin"})
		return
	}

	asignaciones, err := h.svc.Asignar(body.EmpleadoID, body.EstacionamientoGIDs, admin.ID, body.Fecha, body.HoraInicio, body.HoraFin)
	if err != nil {
		MapDomainError(w, err)
		return
	}
	JSON(w, http.StatusCreated, map[string]interface{}{
		"mensaje":      "Asignación creada exitosamente",
		"asignaciones": asignaciones,
	})
}

func (h *AsignacionHandler) MiTurno(w http.ResponseWriter, r *http.Request) {
	empleado := UsuarioFromCtx(r)
	tramos, err := h.svc.MiTurno(empleado.ID)
	if err != nil {
		MapDomainError(w, err)
		return
	}
	if tramos == nil {
		tramos = []domain.EstacionamientoResumen{}
	}
	JSON(w, http.StatusOK, map[string]interface{}{
		"empleado_id":      empleado.ID,
		"tramos_asignados": tramos,
	})
}
