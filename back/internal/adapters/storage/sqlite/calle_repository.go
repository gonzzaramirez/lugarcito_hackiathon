package sqlite

import (
	"database/sql"
	"fmt"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
)

type calleRepo struct{ db *sql.DB }

func NewCalleRepository(db *sql.DB) ports.CalleRepository {
	return &calleRepo{db: db}
}

func (r *calleRepo) Create(nombre string) (*domain.Calle, error) {
	res, err := r.db.Exec(`INSERT INTO calles (nombre) VALUES (?)`, nombre)
	if err != nil {
		return nil, fmt.Errorf("crear calle: %w", err)
	}
	id, _ := res.LastInsertId()
	return r.GetByID(int(id))
}

func (r *calleRepo) GetAll() ([]domain.Calle, error) {
	rows, err := r.db.Query(`SELECT id, nombre, created_at FROM calles ORDER BY nombre`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var calles []domain.Calle
	for rows.Next() {
		var c domain.Calle
		if err := rows.Scan(&c.ID, &c.Nombre, &c.CreatedAt); err != nil {
			return nil, err
		}
		calles = append(calles, c)
	}
	return calles, nil
}

func (r *calleRepo) GetByID(id int) (*domain.Calle, error) {
	var c domain.Calle
	err := r.db.QueryRow(`SELECT id, nombre, created_at FROM calles WHERE id = ?`, id).
		Scan(&c.ID, &c.Nombre, &c.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNotFound
	}
	return &c, err
}
