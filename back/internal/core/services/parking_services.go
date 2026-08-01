package services

import (
	"encoding/json"
	"math"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type calleService struct{ repo ports.CalleRepository }

func NewCalleService(repo ports.CalleRepository) ports.CalleService {
	return &calleService{repo: repo}
}

func (s *calleService) Crear(nombre string) (*domain.Calle, error) {
	return s.repo.Create(nombre)
}

func (s *calleService) Listar() ([]domain.Calle, error) {
	return s.repo.GetAll()
}

// -------------------------------------------------------

type estacionamientoService struct{ repo ports.EstacionamientoRepository }

func NewEstacionamientoService(repo ports.EstacionamientoRepository) ports.EstacionamientoService {
	return &estacionamientoService{repo: repo}
}

func (s *estacionamientoService) ObtenerMapa() ([]domain.Estacionamiento, error) {
	return s.repo.GetAll()
}

func (s *estacionamientoService) ObtenerCercanos(userLat, userLng, radioKm float64) ([]domain.EstacionamientoConDistancia, error) {
	todos, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}

	var cercanos []domain.EstacionamientoConDistancia
	for _, e := range todos {
		lat, lng, ok := extraerCentroideGeoJSON(e.GeometriaGeoJSON)
		if !ok {
			continue
		}
		dist := haversineKm(userLat, userLng, lat, lng)
		if dist <= radioKm {
			cercanos = append(cercanos, domain.EstacionamientoConDistancia{
				Estacionamiento: e,
				DistanciaKm:     dist,
			})
		}
	}
	return cercanos, nil
}

// extraerCentroideGeoJSON extrae el centroide (promedio de coordenadas) de una geometría GeoJSON (LineString o Point)
func extraerCentroideGeoJSON(raw string) (float64, float64, bool) {
	var geoStruct struct {
		Type        string      `json:"type"`
		Coordinates []interface{} `json:"coordinates"`
	}
	if err := json.Unmarshal([]byte(raw), &geoStruct); err != nil {
		return 0, 0, false
	}

	if geoStruct.Type == "LineString" {
		var sumLat, sumLng float64
		var count float64
		for _, item := range geoStruct.Coordinates {
			coordSlice, ok := item.([]interface{})
			if !ok || len(coordSlice) < 2 {
				continue
			}
			lng, ok1 := coordSlice[0].(float64)
			lat, ok2 := coordSlice[1].(float64)
			if ok1 && ok2 {
				sumLng += lng
				sumLat += lat
				count++
			}
		}
		if count > 0 {
			return sumLat / count, sumLng / count, true
		}
	}
	return 0, 0, false
}

func haversineKm(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371.0
	dLat := (lat2 - lat1) * math.Pi / 180.0
	dLon := (lon2 - lon1) * math.Pi / 180.0
	l1Rad := lat1 * math.Pi / 180.0
	l2Rad := lat2 * math.Pi / 180.0

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(l1Rad)*math.Cos(l2Rad)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

// -------------------------------------------------------

type asignacionService struct {
	repo       ports.AsignacionRepository
	estacRepo  ports.EstacionamientoRepository
}

func NewAsignacionService(repo ports.AsignacionRepository, estacRepo ports.EstacionamientoRepository) ports.AsignacionService {
	return &asignacionService{repo: repo, estacRepo: estacRepo}
}

func (s *asignacionService) Asignar(empleadoID int, gids []int, asignadoPorID int, fecha, horaInicio, horaFin string) ([]domain.AsignacionEmpleado, error) {
	var resultado []domain.AsignacionEmpleado
	for _, gid := range gids {
		// Verificar que el tramo existe
		if _, err := s.estacRepo.GetByGID(gid); err != nil {
			return nil, err
		}
		a := &domain.AsignacionEmpleado{
			EmpleadoID:         empleadoID,
			EstacionamientoGID: gid,
			AsignadoPorID:      asignadoPorID,
			Fecha:              fecha,
			HoraInicio:         horaInicio,
			HoraFin:            horaFin,
		}
		creada, err := s.repo.Create(a)
		if err != nil {
			return nil, err
		}
		resultado = append(resultado, *creada)
	}
	return resultado, nil
}

func (s *asignacionService) MiTurno(empleadoID int) ([]domain.EstacionamientoResumen, error) {
	// Usar fecha actual (UTC)
	fecha := fechaHoy()
	return s.repo.GetTurnoActivo(empleadoID, fecha)
}
