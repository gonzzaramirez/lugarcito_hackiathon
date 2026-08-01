-- Schema SQLite para Sistema de Gestión de Estacionamiento Medido (Lugarcito)

PRAGMA foreign_keys = ON;

-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT
);

INSERT OR IGNORE INTO roles (id, nombre, descripcion) VALUES
(1, 'ADMIN', 'Administrador del sistema'),
(2, 'EMPLEADO', 'Empleado base operando en calle');

-- 2. Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    nombre_usuario TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nombre_completo TEXT NOT NULL,
    telefono TEXT,
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- 3. Tabla de Calles
-- Catálogo de calles del sistema. Se referencian desde estacionamientos.
CREATE TABLE IF NOT EXISTS calles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,   -- Nombre normalizado de la calle (ej: "Pellegrini")
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Estacionamientos (Tramos de Estacionamiento Medido)
-- Registra: ubicación geográfica, calle principal y las 2 paralelas (todas FK a calles),
-- capacidad total, capacidad ocupada y capacidad libre (calculada automáticamente).
CREATE TABLE IF NOT EXISTS estacionamientos (
    gid INTEGER PRIMARY KEY,             -- 'gid' del CSV
    calle_principal_id INTEGER NOT NULL, -- FK a calles.id
    calle_paralela_1_id INTEGER,         -- FK a calles.id (primera transversal)
    calle_paralela_2_id INTEGER,         -- FK a calles.id (segunda transversal)
    capacidad_total INTEGER NOT NULL CHECK (capacidad_total >= 0),
    capacidad_ocupada INTEGER NOT NULL DEFAULT 0
        CHECK (capacidad_ocupada >= 0 AND capacidad_ocupada <= capacidad_total),
    capacidad_libre INTEGER GENERATED ALWAYS AS (capacidad_total - capacidad_ocupada) STORED,
    geometria_geojson TEXT NOT NULL,     -- Ubicación geográfica ('st_asgeojson' del CSV)
    estado TEXT NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO', 'MANTENIMIENTO')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (calle_principal_id) REFERENCES calles(id) ON DELETE RESTRICT,
    FOREIGN KEY (calle_paralela_1_id) REFERENCES calles(id) ON DELETE SET NULL,
    FOREIGN KEY (calle_paralela_2_id) REFERENCES calles(id) ON DELETE SET NULL
);

-- 5. Asignaciones de Empleados (Turnos / Rangos Horarios)
CREATE TABLE IF NOT EXISTS asignaciones_empleados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empleado_id INTEGER NOT NULL,
    estacionamiento_gid INTEGER NOT NULL,
    asignado_por_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,       -- YYYY-MM-DD
    hora_inicio TEXT NOT NULL, -- HH:MM
    hora_fin TEXT NOT NULL,    -- HH:MM
    estado TEXT NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'CANCELADO', 'COMPLETADO')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (estacionamiento_gid) REFERENCES estacionamientos(gid) ON DELETE CASCADE,
    FOREIGN KEY (asignado_por_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- 6. Registros de Entrada / Salida de Vehículos
-- Solo se registra el evento: quién lo registró, en qué tramo, cuándo entró y cuándo salió.
CREATE TABLE IF NOT EXISTS registros_estacionamiento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estacionamiento_gid INTEGER NOT NULL,
    empleado_id INTEGER NOT NULL,
    hora_entrada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hora_salida DATETIME,
    estado TEXT NOT NULL DEFAULT 'EN_CURSO'
        CHECK (estado IN ('EN_CURSO', 'FINALIZADO')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estacionamiento_gid) REFERENCES estacionamientos(gid) ON DELETE RESTRICT,
    FOREIGN KEY (empleado_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);



-- Índices de optimización
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role_id);
CREATE INDEX IF NOT EXISTS idx_calles_nombre ON calles(nombre);
CREATE INDEX IF NOT EXISTS idx_estac_calle_principal ON estacionamientos(calle_principal_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_emp_fecha ON asignaciones_empleados(empleado_id, fecha, estado);
CREATE INDEX IF NOT EXISTS idx_registros_patente ON registros_estacionamiento(patente, estado);
CREATE INDEX IF NOT EXISTS idx_registros_gid_estado ON registros_estacionamiento(estacionamiento_gid, estado);

