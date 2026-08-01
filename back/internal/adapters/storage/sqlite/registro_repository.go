package sqlite

import (
	"database/sql"
	"time"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type registroRepo struct {
	db          *sql.DB
	estacRepo   ports.EstacionamientoRepository
}

func NewRegistroRepository(db *sql.DB, estacRepo ports.EstacionamientoRepository) ports.RegistroRepository {
	return &registroRepo{db: db, estacRepo: estacRepo}
}

func (r *registroRepo) Entrada(estacionamientoGID, empleadoID int) (*domain.RegistroEstacionamiento, error) {
	// Verificar capacidad
	estac, err := r.estacRepo.GetByGID(estacionamientoGID)
	if err != nil {
		return nil, err
	}
	if estac.CapacidadLibre <= 0 {
		return nil, domain.ErrSinCapacidad
	}

	now := time.Now()
	res, err := r.db.Exec(`
		INSERT INTO registros_estacionamiento (estacionamiento_gid, empleado_id, hora_entrada, estado, created_at)
		VALUES (?, ?, ?, 'EN_CURSO', ?)`,
		estacionamientoGID, empleadoID, now, now,
	)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()

	// Incrementar ocupación
	ocupada, libre, err := r.estacRepo.IncrementarOcupacion(estacionamientoGID)
	if err != nil {
		return nil, err
	}

	return &domain.RegistroEstacionamiento{
		ID:                 int(id),
		EstacionamientoGID: estacionamientoGID,
		EmpleadoID:         empleadoID,
		HoraEntrada:        now,
		Estado:             "EN_CURSO",
		CreatedAt:          now,
		CapacidadOcupada:   ocupada,
		CapacidadLibre:     libre,
	}, nil
}

func (r *registroRepo) Salida(registroID int) (*domain.RegistroEstacionamiento, error) {
	// Verificar que el registro esté EN_CURSO
	var reg domain.RegistroEstacionamiento
	err := r.db.QueryRow(`
		SELECT id, estacionamiento_gid, empleado_id, hora_entrada, estado, created_at
		FROM registros_estacionamiento WHERE id = ?`, registroID).
		Scan(&reg.ID, &reg.EstacionamientoGID, &reg.EmpleadoID, &reg.HoraEntrada, &reg.Estado, &reg.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if reg.Estado != "EN_CURSO" {
		return nil, domain.ErrRegistroNoEnCurso
	}

	now := time.Now()
	_, err = r.db.Exec(`
		UPDATE registros_estacionamiento
		SET hora_salida = ?, estado = 'FINALIZADO'
		WHERE id = ?`, now, registroID)
	if err != nil {
		return nil, err
	}

	ocupada, libre, err := r.estacRepo.DecrementarOcupacion(reg.EstacionamientoGID)
	if err != nil {
		return nil, err
	}

	reg.HoraSalida = &now
	reg.Estado = "FINALIZADO"
	reg.CapacidadOcupada = ocupada
	reg.CapacidadLibre = libre
	return &reg, nil
}
