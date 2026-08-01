package sqlite

import (
	"database/sql"
	"time"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type asignacionRepo struct{ db *sql.DB }

func NewAsignacionRepository(db *sql.DB) ports.AsignacionRepository {
	return &asignacionRepo{db: db}
}

func (r *asignacionRepo) Create(a *domain.AsignacionEmpleado) (*domain.AsignacionEmpleado, error) {
	res, err := r.db.Exec(`
		INSERT INTO asignaciones_empleados (empleado_id, estacionamiento_gid, asignado_por_id, fecha, hora_inicio, hora_fin, estado, created_at)
		VALUES (?, ?, ?, ?, ?, ?, 'ACTIVO', ?)`,
		a.EmpleadoID, a.EstacionamientoGID, a.AsignadoPorID, a.Fecha, a.HoraInicio, a.HoraFin, time.Now(),
	)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	a.ID = int(id)
	a.Estado = "ACTIVO"
	return a, nil
}

func (r *asignacionRepo) GetTurnoActivo(empleadoID int, fecha string) ([]domain.EstacionamientoResumen, error) {
	rows, err := r.db.Query(`
		SELECT e.gid,
		       e.capacidad_total, e.capacidad_ocupada, e.capacidad_libre,
		       cp.id, cp.nombre,
		       c1.id, c1.nombre,
		       c2.id, c2.nombre,
		       a.hora_inicio, a.hora_fin
		FROM asignaciones_empleados a
		JOIN estacionamientos e ON e.gid = a.estacionamiento_gid
		JOIN calles cp ON cp.id = e.calle_principal_id
		LEFT JOIN calles c1 ON c1.id = e.calle_paralela_1_id
		LEFT JOIN calles c2 ON c2.id = e.calle_paralela_2_id
		WHERE a.empleado_id = ? AND a.fecha = ? AND a.estado = 'ACTIVO'
		ORDER BY e.gid`, empleadoID, fecha)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []domain.EstacionamientoResumen
	for rows.Next() {
		var res domain.EstacionamientoResumen
		var cp domain.Calle
		var c1ID sql.NullInt64
		var c1Nombre sql.NullString
		var c2ID sql.NullInt64
		var c2Nombre sql.NullString

		if err := rows.Scan(
			&res.GID,
			&res.CapacidadTotal, &res.CapacidadOcupada, &res.CapacidadLibre,
			&cp.ID, &cp.Nombre,
			&c1ID, &c1Nombre,
			&c2ID, &c2Nombre,
			&res.HoraInicio, &res.HoraFin,
		); err != nil {
			return nil, err
		}
		res.CallePrincipal = &cp
		if c1ID.Valid {
			res.CalleParalela1 = &domain.Calle{ID: int(c1ID.Int64), Nombre: c1Nombre.String}
		}
		if c2ID.Valid {
			res.CalleParalela2 = &domain.Calle{ID: int(c2ID.Int64), Nombre: c2Nombre.String}
		}
		lista = append(lista, res)
	}
	return lista, nil
}

func (r *asignacionRepo) TieneAsignacion(empleadoID, gid int, fecha string) (bool, error) {
	var count int
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM asignaciones_empleados
		WHERE empleado_id = ? AND estacionamiento_gid = ? AND fecha = ? AND estado = 'ACTIVO'`,
		empleadoID, gid, fecha).Scan(&count)
	return count > 0, err
}
