package domain

import "time"

type Role struct {
	ID          int    `json:"id"`
	Nombre      string `json:"nombre"`
	Descripcion string `json:"descripcion,omitempty"`
}

type Usuario struct {
	ID             int       `json:"id"`
	RoleID         int       `json:"role_id"`
	RoleNombre     string    `json:"role_nombre,omitempty"`
	NombreUsuario  string    `json:"nombre_usuario"`
	Email          string    `json:"email"`
	PasswordHash   string    `json:"-"`
	NombreCompleto string    `json:"nombre_completo"`
	Telefono       string    `json:"telefono,omitempty"`
	Activo         int       `json:"activo"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Calle struct {
	ID        int       `json:"id"`
	Nombre    string    `json:"nombre"`
	CreatedAt time.Time `json:"created_at"`
}

type Estacionamiento struct {
	GID               int       `json:"gid"`
	CallePrincipalID  int       `json:"calle_principal_id"`
	CalleParalela1ID  *int      `json:"calle_paralela_1_id,omitempty"`
	CalleParalela2ID  *int      `json:"calle_paralela_2_id,omitempty"`
	CallePrincipal    *Calle    `json:"calle_principal,omitempty"`
	CalleParalela1    *Calle    `json:"calle_paralela_1,omitempty"`
	CalleParalela2    *Calle    `json:"calle_paralela_2,omitempty"`
	CapacidadTotal    int       `json:"capacidad_total"`
	CapacidadOcupada  int       `json:"capacidad_ocupada"`
	CapacidadLibre    int       `json:"capacidad_libre"`
	GeometriaGeoJSON  string    `json:"geometria_geojson"`
	Estado            string    `json:"estado"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type EstacionamientoConDistancia struct {
	Estacionamiento
	DistanciaKm float64 `json:"distancia_km"`
}

type AsignacionEmpleado struct {
	ID                  int       `json:"id"`
	EmpleadoID          int       `json:"empleado_id"`
	EstacionamientoGID  int       `json:"estacionamiento_gid"`
	AsignadoPorID       int       `json:"asignado_por_id"`
	Fecha               string    `json:"fecha"`
	HoraInicio          string    `json:"hora_inicio"`
	HoraFin             string    `json:"hora_fin"`
	Estado              string    `json:"estado"`
	CreatedAt           time.Time `json:"created_at"`
	// Datos expandidos
	Estacionamiento     *EstacionamientoResumen `json:"estacionamiento,omitempty"`
}

type EstacionamientoResumen struct {
	GID              int    `json:"gid"`
	CallePrincipal   *Calle `json:"calle_principal,omitempty"`
	CalleParalela1   *Calle `json:"calle_paralela_1,omitempty"`
	CalleParalela2   *Calle `json:"calle_paralela_2,omitempty"`
	CapacidadTotal   int    `json:"capacidad_total"`
	CapacidadOcupada int    `json:"capacidad_ocupada"`
	CapacidadLibre   int    `json:"capacidad_libre"`
	HoraInicio       string `json:"hora_inicio,omitempty"`
	HoraFin          string `json:"hora_fin,omitempty"`
}

type RegistroEstacionamiento struct {
	ID                 int        `json:"id"`
	EstacionamientoGID int        `json:"estacionamiento_gid"`
	EmpleadoID         int        `json:"empleado_id"`
	HoraEntrada        time.Time  `json:"hora_entrada"`
	HoraSalida         *time.Time `json:"hora_salida,omitempty"`
	Estado             string     `json:"estado"`
	CreatedAt          time.Time  `json:"created_at"`
	// Datos del tramo en el momento del evento
	CapacidadOcupada   int        `json:"capacidad_ocupada"`
	CapacidadLibre     int        `json:"capacidad_libre"`
}
