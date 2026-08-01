package sqlite

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/gonzzaramirez/lugarcito-back/internal/core/domain"
	"github.com/gonzzaramirez/lugarcito-back/internal/core/ports"
	"golang.org/x/crypto/bcrypt"
)

type usuarioRepo struct{ db *sql.DB }

func NewUsuarioRepository(db *sql.DB) ports.UsuarioRepository {
	return &usuarioRepo{db: db}
}

func (r *usuarioRepo) Create(u *domain.Usuario) (*domain.Usuario, error) {
	now := time.Now()
	res, err := r.db.Exec(`
		INSERT INTO usuarios (role_id, nombre_usuario, email, password_hash, nombre_completo, telefono, activo, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
		u.RoleID, u.NombreUsuario, u.Email, u.PasswordHash, u.NombreCompleto, u.Telefono, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("crear usuario: %w", err)
	}
	id, _ := res.LastInsertId()
	return r.GetByID(int(id))
}

func (r *usuarioRepo) GetAll(roleID *int) ([]domain.Usuario, error) {
	query := `SELECT u.id, u.role_id, r.nombre, u.nombre_usuario, u.email, u.nombre_completo, u.telefono, u.activo, u.created_at, u.updated_at
	          FROM usuarios u JOIN roles r ON r.id = u.role_id`
	args := []interface{}{}
	if roleID != nil {
		query += ` WHERE u.role_id = ?`
		args = append(args, *roleID)
	}
	query += ` ORDER BY u.id`

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var usuarios []domain.Usuario
	for rows.Next() {
		var u domain.Usuario
		if err := rows.Scan(&u.ID, &u.RoleID, &u.RoleNombre, &u.NombreUsuario, &u.Email, &u.NombreCompleto, &u.Telefono, &u.Activo, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		usuarios = append(usuarios, u)
	}
	return usuarios, nil
}

func (r *usuarioRepo) GetByID(id int) (*domain.Usuario, error) {
	var u domain.Usuario
	err := r.db.QueryRow(`
		SELECT u.id, u.role_id, r.nombre, u.nombre_usuario, u.email, u.password_hash, u.nombre_completo, u.telefono, u.activo, u.created_at, u.updated_at
		FROM usuarios u JOIN roles r ON r.id = u.role_id
		WHERE u.id = ?`, id).
		Scan(&u.ID, &u.RoleID, &u.RoleNombre, &u.NombreUsuario, &u.Email, &u.PasswordHash, &u.NombreCompleto, &u.Telefono, &u.Activo, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNotFound
	}
	return &u, err
}

func (r *usuarioRepo) GetByNombreUsuario(nombre string) (*domain.Usuario, error) {
	var u domain.Usuario
	err := r.db.QueryRow(`
		SELECT u.id, u.role_id, r.nombre, u.nombre_usuario, u.email, u.password_hash, u.nombre_completo, u.telefono, u.activo, u.created_at, u.updated_at
		FROM usuarios u JOIN roles r ON r.id = u.role_id
		WHERE u.nombre_usuario = ?`, nombre).
		Scan(&u.ID, &u.RoleID, &u.RoleNombre, &u.NombreUsuario, &u.Email, &u.PasswordHash, &u.NombreCompleto, &u.Telefono, &u.Activo, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, domain.ErrNotFound
	}
	return &u, err
}

// HashPassword genera un bcrypt hash de la contraseña.
func HashPassword(password string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(b), err
}

// CheckPassword compara la contraseña con el hash.
func CheckPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
