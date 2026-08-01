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
	"time"

	_ "github.com/mattn/go-sqlite3"
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

// seedUsuarios crea los usuarios base del sistema (admin + empleado demo,
// con las credenciales documentadas en back/README.md) y una asignación de
// ejemplo para hoy (gids 24 y 154). Es idempotente: no duplica en reinicios.
func seedUsuarios(db *sql.DB) error {
	var userCount int
	if err := db.QueryRow(`SELECT COUNT(*) FROM usuarios`).Scan(&userCount); err != nil {
		return err
	}

	var adminID, empleadoID int64

	if userCount == 0 {
		adminHash, err := HashPassword("password123")
		if err != nil {
			return fmt.Errorf("hash admin: %w", err)
		}
		empleadoHash, err := HashPassword("empPassword123")
		if err != nil {
			return fmt.Errorf("hash empleado: %w", err)
		}

		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("iniciar tx usuarios: %w", err)
		}
		defer func() {
			if err != nil {
				_ = tx.Rollback()
			}
		}()

		if _, err := tx.Exec(`
			INSERT OR IGNORE INTO usuarios (role_id, nombre_usuario, email, password_hash, nombre_completo, telefono, activo)
			VALUES (1, 'admin_rodrigo', 'admin@lugarcito.com', ?, 'Rodrigo Administrador', '+543794000001', 1)`,
			adminHash); err != nil {
			return fmt.Errorf("crear admin: %w", err)
		}

		if _, err := tx.Exec(`
			INSERT OR IGNORE INTO usuarios (role_id, nombre_usuario, email, password_hash, nombre_completo, telefono, activo)
			VALUES (2, 'empleado_juan', 'juan@lugarcito.com', ?, 'Juan Pérez', '+543794000000', 1)`,
			empleadoHash); err != nil {
			return fmt.Errorf("crear empleado: %w", err)
		}

		if err := tx.QueryRow(`SELECT id FROM usuarios WHERE nombre_usuario = 'admin_rodrigo'`).Scan(&adminID); err != nil {
			return fmt.Errorf("leer admin: %w", err)
		}
		if err := tx.QueryRow(`SELECT id FROM usuarios WHERE nombre_usuario = 'empleado_juan'`).Scan(&empleadoID); err != nil {
			return fmt.Errorf("leer empleado: %w", err)
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("commit usuarios: %w", err)
		}
		log.Printf("[seeder] ✅ Usuarios base creados: admin_rodrigo / empleado_juan")
	} else {
		if err := db.QueryRow(`SELECT id FROM usuarios WHERE nombre_usuario = 'empleado_juan'`).Scan(&empleadoID); err != nil {
			return nil // el equipo manejó los usuarios a mano, no inventar nada
		}
	}

	// Asignación demo: solo si todavía no existe ninguna en el sistema.
	var asigCount int
	if err := db.QueryRow(`SELECT COUNT(*) FROM asignaciones_empleados`).Scan(&asigCount); err != nil {
		return err
	}
	if asigCount > 0 {
		return nil
	}

	var adminIDFinal int64
	if err := db.QueryRow(`SELECT id FROM usuarios WHERE role_id = 1 ORDER BY id LIMIT 1`).Scan(&adminIDFinal); err != nil {
		return fmt.Errorf("leer admin para asignación: %w", err)
	}

	fecha := time.Now().Format("2006-01-02")
	for _, gid := range []int{24, 154} {
		_, err := db.Exec(`
			INSERT INTO asignaciones_empleados (empleado_id, estacionamiento_gid, asignado_por_id, fecha, hora_inicio, hora_fin, estado)
			SELECT ?, ?, ?, ?, '08:00', '14:00', 'ACTIVO'
			WHERE NOT EXISTS (
				SELECT 1 FROM asignaciones_empleados WHERE empleado_id = ? AND estacionamiento_gid = ? AND fecha = ?)`,
			empleadoID, gid, adminIDFinal, fecha, empleadoID, gid, fecha)
		if err != nil {
			return fmt.Errorf("crear asignación gid=%d: %w", gid, err)
		}
	}
	log.Printf("[seeder] ✅ Asignación demo creada: empleado_juan → gids 24,154 (hoy %s)", fecha)
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

// derivarNombreCalle genera un nombre legible a partir de la altura y el número de garage.
// Ejemplo: altura=601, garage=5 → "Calle 600 (bloque 5)"
func derivarNombreCalle(altura, garage string) string {
	if altura == "" {
		if garage != "" {
			return fmt.Sprintf("Calle sin número (bloque %s)", garage)
		}
		return "Calle sin número"
	}
	altNum, err := strconv.Atoi(altura)
	if err != nil {
		return fmt.Sprintf("Calle %s", altura)
	}
	// Redondear a la centena inferior para agrupar cuadras
	base := (altNum / 100) * 100
	if garage != "" {
		return fmt.Sprintf("Calle %d (bloque %s)", base, garage)
	}
	return fmt.Sprintf("Calle %d", base)
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
