package services

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type registroService struct {
	repo        ports.RegistroRepository
	asigRepo    ports.AsignacionRepository
	estacRepo   ports.EstacionamientoRepository
	broadcaster ports.EventBroadcaster
}

func NewRegistroService(
	repo ports.RegistroRepository,
	asigRepo ports.AsignacionRepository,
	estacRepo ports.EstacionamientoRepository,
	broadcaster ports.EventBroadcaster,
) ports.RegistroService {
	return &registroService{
		repo:        repo,
		asigRepo:    asigRepo,
		estacRepo:   estacRepo,
		broadcaster: broadcaster,
	}
}

func (s *registroService) RegistrarEntrada(estacionamientoGID, empleadoID int) (*domain.RegistroEstacionamiento, error) {
	fecha := fechaHoy()
	tiene, err := s.asigRepo.TieneAsignacion(empleadoID, estacionamientoGID, fecha)
	if err != nil {
		return nil, err
	}
	if !tiene {
		return nil, domain.ErrEmpleadoSinTurno
	}

	reg, err := s.repo.Entrada(estacionamientoGID, empleadoID)
	if err != nil {
		return nil, err
	}

	s.emitirWS(estacionamientoGID)
	return reg, nil
}

func (s *registroService) RegistrarSalida(registroID int) (*domain.RegistroEstacionamiento, error) {
	reg, err := s.repo.Salida(registroID)
	if err != nil {
		return nil, err
	}

	s.emitirWS(reg.EstacionamientoGID)
	return reg, nil
}

func (s *registroService) emitirWS(gid int) {
	estac, err := s.estacRepo.GetByGID(gid)
	if err != nil {
		return
	}

	var pct float64
	if estac.CapacidadTotal > 0 {
		pct = float64(estac.CapacidadOcupada) / float64(estac.CapacidadTotal) * 100
	}

	color := "VERDE"
	switch {
	case pct >= 100:
		color = "ROJO"
	case pct >= 75:
		color = "AMARILLO"
	}

	var geom interface{}
	_ = json.Unmarshal([]byte(estac.GeometriaGeoJSON), &geom)

	_ = s.broadcaster.Broadcast("estacionamiento_actualizado", map[string]interface{}{
		"gid":               estac.GID,
		"calle_principal":   estac.CallePrincipal,
		"calle_paralela_1":  estac.CalleParalela1,
		"calle_paralela_2":  estac.CalleParalela2,
		"capacidad_total":   estac.CapacidadTotal,
		"capacidad_ocupada": estac.CapacidadOcupada,
		"capacidad_libre":   estac.CapacidadLibre,
		"ocupacion_texto":   fmt.Sprintf("%d de %d", estac.CapacidadOcupada, estac.CapacidadTotal),
		"estado_color":      color,
		"geometria":         geom,
		"updated_at":        time.Now(),
	})
}

func fechaHoy() string {
	return time.Now().Format("2006-01-02")
}
