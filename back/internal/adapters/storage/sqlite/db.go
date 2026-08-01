package sqlite

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

// Open abre (o crea) la base de datos SQLite y ejecuta el schema DDL.
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
