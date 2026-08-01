package ports

import "github.com/gonzzaramirez/lugarcito-back/internal/core/domain"

// AuthService gestiona autenticación y JWT.
type AuthService interface {
	Login(nombreUsuario, password string) (string, *domain.Usuario, error)
	ValidateToken(token string) (*domain.Usuario, error)
}

// UsuarioService gestiona los casos de uso de usuarios.
type UsuarioService interface {
	Crear(roleID int, nombreUsuario, email, password, nombreCompleto, telefono string) (*domain.Usuario, error)
	Listar(roleID *int) ([]domain.Usuario, error)
}

// CalleService gestiona los casos de uso de calles.
type CalleService interface {
	Crear(nombre string) (*domain.Calle, error)
	Listar() ([]domain.Calle, error)
}

// EstacionamientoService gestiona los casos de uso de tramos.
type EstacionamientoService interface {
	ObtenerMapa() ([]domain.Estacionamiento, error)
}

// AsignacionService gestiona los casos de uso de asignaciones.
type AsignacionService interface {
	Asignar(empleadoID int, gids []int, asignadoPorID int, fecha, horaInicio, horaFin string) ([]domain.AsignacionEmpleado, error)
	MiTurno(empleadoID int) ([]domain.EstacionamientoResumen, error)
}

// RegistroService gestiona los casos de uso de entrada/salida.
type RegistroService interface {
	RegistrarEntrada(estacionamientoGID, empleadoID int) (*domain.RegistroEstacionamiento, error)
	RegistrarSalida(registroID int) (*domain.RegistroEstacionamiento, error)
}
