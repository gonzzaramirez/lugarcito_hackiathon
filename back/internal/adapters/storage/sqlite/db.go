package sqlite

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

const defaultCSVPath = "data/Estacionamiento-medido.csv"

// Open abre (o crea) la base de datos SQLite, ejecuta el schema DDL
// y carga los datos del CSV si todavía no fueron importados.
func Open(dsn string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", dsn+"?_foreign_keys=on")
	if err != nil {
		return nil, fmt.Errorf("sqlite open: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("sqlite ping: %w", err)
	}
	db.SetMaxOpenConns(1) // SQLite es single-writer

	if err := migrate(db); err != nil {
		return nil, fmt.Errorf("sqlite migrate: %w", err)
	}

	if err := seedIfEmpty(db); err != nil {
		return nil, fmt.Errorf("sqlite seed: %w", err)
	}

	return db, nil
}

func migrate(db *sql.DB) error {
	schema, err := os.ReadFile("data/schema.sql")
	if err != nil {
		return fmt.Errorf("leer schema.sql: %w", err)
	}
	if _, err := db.Exec(string(schema)); err != nil {
		return fmt.Errorf("ejecutar schema.sql: %w", err)
	}
	return nil
}

// seedIfEmpty ejecuta el seeder CSV solo si la tabla estacionamientos está vacía.
// Así es idempotente: en reinicios de Docker no reimporta si los datos ya están.
// También crea los usuarios base (admin/empleado) y una asignación de ejemplo.
func seedIfEmpty(db *sql.DB) error {
	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM estacionamientos`).Scan(&count); err != nil {
		return err
	}
	if count == 0 {
		if _, err := os.Stat(defaultCSVPath); os.IsNotExist(err) {
			return fmt.Errorf("CSV no encontrado en %s", defaultCSVPath)
		}

		if err := Seed(db, defaultCSVPath); err != nil {
			return err
		}
	}

	return seedUsuarios(db)
}
