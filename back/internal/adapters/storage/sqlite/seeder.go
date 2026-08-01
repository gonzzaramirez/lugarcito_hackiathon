package sqlite

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"strings"

	_ "modernc.org/sqlite"
)

// Seed lee el CSV y popula calles + estacionamientos en la DB.
// Se omiten las filas que no tienen lugares_disponibles (garages / tramos sin capacidad).
// Es idempotente: usa INSERT OR IGNORE para no duplicar en reinicios.
func Seed(db *sql.DB, csvPath string) error {
	f, err := os.Open(csvPath)
	if err != nil {
		return fmt.Errorf("abrir CSV: %w", err)
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.LazyQuotes = true

	// Leer cabecera
	headers, err := r.Read()
	if err != nil {
		return fmt.Errorf("leer cabecera CSV: %w", err)
	}
	idx := makeIdx(headers)

	// Mapa de nombre_calle → id en BD (cache para evitar inserts duplicados)
	calleCache := map[string]int64{}

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("iniciar transacción: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	insertado := 0
	omitido := 0

	for {
		row, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("[seeder] advertencia al leer fila: %v", err)
			continue
		}

		gidStr := strings.TrimSpace(get(row, idx, "gid"))
		lugaresStr := strings.TrimSpace(get(row, idx, "lugares_disponibles"))
		geojson := strings.TrimSpace(get(row, idx, "st_asgeojson"))
		altura := strings.TrimSpace(get(row, idx, "altura"))
		garageStr := strings.TrimSpace(get(row, idx, "garage"))

		// Omitir si no tiene lugares_disponibles (son garages / tramos sin capacidad)
		if lugaresStr == "" {
			omitido++
			continue
		}

		gid, err := strconv.Atoi(gidStr)
		if err != nil {
			log.Printf("[seeder] gid inválido '%s', omitiendo", gidStr)
			omitido++
			continue
		}

		lugares, err := strconv.Atoi(lugaresStr)
		if err != nil || lugares <= 0 {
			log.Printf("[seeder] lugares_disponibles inválido '%s' para gid=%d, omitiendo", lugaresStr, gid)
			omitido++
			continue
		}

		// Derivar nombre de calle principal a partir de la altura (número de calle)
		// El CSV no trae nombre de calle, usamos el número de altura + garage como identificador
		// Ejemplo: "Calle 600" para altura 601, "Calle 400", etc.
		callePrincipalNombre := derivarNombreCalle(altura, garageStr)

		calleID, err := upsertCalle(tx, calleCache, callePrincipalNombre)
		if err != nil {
			return fmt.Errorf("upsert calle '%s': %w", callePrincipalNombre, err)
		}

		_, err = tx.Exec(`
			INSERT OR IGNORE INTO estacionamientos
				(gid, calle_principal_id, capacidad_total, capacidad_ocupada, geometria_geojson, estado, created_at, updated_at)
			VALUES (?, ?, ?, 0, ?, 'ACTIVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
			gid, calleID, lugares, geojson,
		)
		if err != nil {
			return fmt.Errorf("insertar estacionamiento gid=%d: %w", gid, err)
		}
		insertado++
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit transacción: %w", err)
	}

	log.Printf("[seeder] ✅ Completado — %d tramos importados, %d omitidos (sin capacidad)", insertado, omitido)
	return nil
}

// seedUsuarios crea el usuario admin por defecto (admin / admin).
// Es idempotente: no duplica en reinicios.
func seedUsuarios(db *sql.DB) error {
	var userCount int
	if err := db.QueryRow(`SELECT COUNT(*) FROM usuarios`).Scan(&userCount); err != nil {
		return err
	}

	if userCount == 0 {
		adminHash, err := HashPassword("admin")
		if err != nil {
			return fmt.Errorf("hash admin: %w", err)
		}

		if _, err := db.Exec(`
			INSERT OR IGNORE INTO usuarios (role_id, nombre_usuario, email, password_hash, nombre_completo, telefono, activo)
			VALUES (1, 'admin', 'admin@lugarcito.com', ?, 'Administrador', '', 1)`,
			adminHash); err != nil {
			return fmt.Errorf("crear admin: %w", err)
		}

		log.Printf("[seeder] ✅ Usuario admin creado: admin / admin")
	}

	return nil
}

// upsertCalle inserta la calle si no existe y retorna su id.
func upsertCalle(tx *sql.Tx, cache map[string]int64, nombre string) (int64, error) {
	if id, ok := cache[nombre]; ok {
		return id, nil
	}
	_, err := tx.Exec(`INSERT OR IGNORE INTO calles (nombre, created_at) VALUES (?, CURRENT_TIMESTAMP)`, nombre)
	if err != nil {
		return 0, err
	}
	var id int64
	err = tx.QueryRow(`SELECT id FROM calles WHERE nombre = ?`, nombre).Scan(&id)
	if err != nil {
		return 0, err
	}
	cache[nombre] = id
	return id, nil
}

// derivarNombreCalle genera un nombre a partir de la altura.
// Ejemplo: altura=601 → "Altura 600" (referencia estándar argentina).
// Si no hay altura, usa el gid como fallback.
func derivarNombreCalle(altura, _ string) string {
	if altura == "" {
		return "Sin altura"
	}
	altNum, err := strconv.Atoi(altura)
	if err != nil {
		return fmt.Sprintf("Altura %s", altura)
	}
	base := (altNum / 100) * 100
	return fmt.Sprintf("Altura %d", base)
}

// makeIdx construye un mapa nombre_columna → índice.
func makeIdx(headers []string) map[string]int {
	idx := map[string]int{}
	for i, h := range headers {
		idx[strings.TrimSpace(h)] = i
	}
	return idx
}

// get extrae el valor de la columna o retorna "".
func get(row []string, idx map[string]int, col string) string {
	i, ok := idx[col]
	if !ok || i >= len(row) {
		return ""
	}
	return row[i]
}
