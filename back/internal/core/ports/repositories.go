package ports

import "github.com/gonzzaramirez/lugarcito-back/internal/core/domain"

// CalleRepository maneja la persistencia de calles.
type CalleRepository interface {
	Create(nombre string) (*domain.Calle, error)
	GetAll() ([]domain.Calle, error)
	GetByID(id int) (*domain.Calle, error)
}

// UsuarioRepository maneja la persistencia de usuarios.
type UsuarioRepository interface {
	Create(u *domain.Usuario) (*domain.Usuario, error)
	GetAll(roleID *int) ([]domain.Usuario, error)
	GetByID(id int) (*domain.Usuario, error)
	GetByNombreUsuario(nombre string) (*domain.Usuario, error)
}

// EstacionamientoRepository maneja la persistencia de tramos.
type EstacionamientoRepository interface {
	GetAll() ([]domain.Estacionamiento, error)
	GetByGID(gid int) (*domain.Estacionamiento, error)
	IncrementarOcupacion(gid int) (int, int, error) // retorna ocupada, libre
	DecrementarOcupacion(gid int) (int, int, error) // retorna ocupada, libre
}

// AsignacionRepository maneja la persistencia de asignaciones.
type AsignacionRepository interface {
	Create(a *domain.AsignacionEmpleado) (*domain.AsignacionEmpleado, error)
	GetTurnoActivo(empleadoID int, fecha string) ([]domain.EstacionamientoResumen, error)
	TieneAsignacion(empleadoID, gid int, fecha string) (bool, error)
}

// RegistroRepository maneja la persistencia de registros de entrada/salida.
type RegistroRepository interface {
	Entrada(estacionamientoGID, empleadoID int) (*domain.RegistroEstacionamiento, error)
	Salida(registroID int) (*domain.RegistroEstacionamiento, error)
}
