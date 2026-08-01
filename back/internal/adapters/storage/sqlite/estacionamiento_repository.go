package sqlite

import (
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type estacionamientoRepo struct{ db *sql.DB }

func NewEstacionamientoRepository(db *sql.DB) ports.EstacionamientoRepository {
	return &estacionamientoRepo{db: db}
}

func (r *estacionamientoRepo) GetAll() ([]domain.Estacionamiento, error) {
	rows, err := r.db.Query(`
		SELECT e.gid, e.calle_principal_id, e.calle_paralela_1_id, e.calle_paralela_2_id,
		       e.capacidad_total, e.capacidad_ocupada, e.capacidad_libre,
		       e.geometria_geojson, e.estado,
		       cp.id, cp.nombre,
		       c1.id, c1.nombre,
		       c2.id, c2.nombre
		FROM estacionamientos e
		JOIN calles cp ON cp.id = e.calle_principal_id
		LEFT JOIN calles c1 ON c1.id = e.calle_paralela_1_id
		LEFT JOIN calles c2 ON c2.id = e.calle_paralela_2_id
		WHERE e.estado = 'ACTIVO'
		ORDER BY e.gid`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []domain.Estacionamiento
	for rows.Next() {
		e, err := scanEstacionamiento(rows)
		if err != nil {
			return nil, err
		}
		lista = append(lista, *e)
	}
	return lista, nil
}

func (r *estacionamientoRepo) GetByGID(gid int) (*domain.Estacionamiento, error) {
	row := r.db.QueryRow(`
		SELECT e.gid, e.calle_principal_id, e.calle_paralela_1_id, e.calle_paralela_2_id,
		       e.capacidad_total, e.capacidad_ocupada, e.capacidad_libre,
		       e.geometria_geojson, e.estado,
		       cp.id, cp.nombre,
		       c1.id, c1.nombre,
		       c2.id, c2.nombre
		FROM estacionamientos e
		JOIN calles cp ON cp.id = e.calle_principal_id
		LEFT JOIN calles c1 ON c1.id = e.calle_paralela_1_id
		LEFT JOIN calles c2 ON c2.id = e.calle_paralela_2_id
		WHERE e.gid = ?`, gid)
	return scanEstacionamiento(row)
}

func (r *estacionamientoRepo) IncrementarOcupacion(gid int) (int, int, error) {
	_, err := r.db.Exec(`
		UPDATE estacionamientos
		SET capacidad_ocupada = capacidad_ocupada + 1, updated_at = CURRENT_TIMESTAMP
		WHERE gid = ? AND capacidad_ocupada < capacidad_total`, gid)
	if err != nil {
		return 0, 0, fmt.Errorf("incrementar ocupacion: %w", err)
	}
	return r.getCapacidades(gid)
}

func (r *estacionamientoRepo) DecrementarOcupacion(gid int) (int, int, error) {
	_, err := r.db.Exec(`
		UPDATE estacionamientos
		SET capacidad_ocupada = MAX(0, capacidad_ocupada - 1), updated_at = CURRENT_TIMESTAMP
		WHERE gid = ?`, gid)
	if err != nil {
		return 0, 0, fmt.Errorf("decrementar ocupacion: %w", err)
	}
	return r.getCapacidades(gid)
}

func (r *estacionamientoRepo) getCapacidades(gid int) (int, int, error) {
	var ocupada, libre int
	err := r.db.QueryRow(`SELECT capacidad_ocupada, capacidad_libre FROM estacionamientos WHERE gid = ?`, gid).
		Scan(&ocupada, &libre)
	return ocupada, libre, err
}

// scanner compartido para filas de estacionamiento con JOIN de calles
type rowScanner interface {
	Scan(dest ...any) error
}

func scanEstacionamiento(row rowScanner) (*domain.Estacionamiento, error) {
	var e domain.Estacionamiento
	var par1ID, par2ID sql.NullInt64
	var cp domain.Calle
	var c1ID sql.NullInt64
	var c1Nombre sql.NullString
	var c2ID sql.NullInt64
	var c2Nombre sql.NullString

	err := row.Scan(
		&e.GID, &e.CallePrincipalID, &par1ID, &par2ID,
		&e.CapacidadTotal, &e.CapacidadOcupada, &e.CapacidadLibre,
		&e.GeometriaGeoJSON, &e.Estado,
		&cp.ID, &cp.Nombre,
		&c1ID, &c1Nombre,
		&c2ID, &c2Nombre,
	)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	e.CallePrincipal = &cp
	if par1ID.Valid {
		id := int(par1ID.Int64)
		e.CalleParalela1ID = &id
		e.CalleParalela1 = &domain.Calle{ID: id, Nombre: c1Nombre.String}
	}
	if par2ID.Valid {
		id := int(par2ID.Int64)
		e.CalleParalela2ID = &id
		e.CalleParalela2 = &domain.Calle{ID: id, Nombre: c2Nombre.String}
	}

	// Parsear GeoJSON para validar que existe (se almacena como string)
	var raw json.RawMessage
	_ = json.Unmarshal([]byte(e.GeometriaGeoJSON), &raw)

	return &e, nil
}
