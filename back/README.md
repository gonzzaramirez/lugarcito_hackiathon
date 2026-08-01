# 🚗 Lugarcito - Sistema de Gestión de Estacionamiento Medido

API Backend en **Go (Arquitectura Hexagonal)** con persistencia en **SQLite** y actualización en tiempo real mediante **WebSockets** para mapa de visitantes.

---

## 📌 Tabla de Contenidos
- [🏗️ Arquitectura del Sistema](#️-arquitectura-del-sistema)
- [🗄️ Modelo de Base de Datos (SQLite)](#️-modelo-de-base-de-datos-sqlite)
- [🔄 Flujo Operativo del Sistema](#-flujo-operativo-del-sistema)
- [📡 Especificación de API REST](#-especificación-de-api-rest)
- [🔌 Eventos WebSocket en Tiempo Real](#-eventos-websocket-en-tiempo-real)
- [🚀 Ejecución Local y con Docker](#-ejecución-local-y-con-docker)

---

## 🏗️ Arquitectura del Sistema

```text
.
├── cmd/
│   └── api/
│       └── main.go                 # Punto de entrada e inyección de dependencias
├── config/
│   └── config.go                   # Configuración del entorno
├── data/
│   ├── Estacionamiento-medido.csv  # Dataset base de tramos de calles y geometría
│   └── schema.sql                  # Script DDL de inicialización para SQLite
├── internal/
│   ├── core/
│   │   ├── domain/                 # Entidades del negocio (Usuario, Calle, Estacionamiento, etc.)
│   │   ├── ports/                  # Contratos de interfaces (Repositories, Services, WS)
│   │   └── services/               # Lógica de aplicación y casos de uso
│   └── adapters/
│       ├── http/                   # Handlers REST HTTP y Middlewares
│       ├── storage/sqlite/         # Adaptador de persistencia SQLite y Seeder
│       └── ws/                     # Hub y clientes WebSocket
├── scripts/
│   └── test_endpoints.py          # Script de pruebas de integración para la API y WebSocket
├── Dockerfile
├── docker-compose.yml
└── go.mod
```

---

## 🗄️ Modelo de Base de Datos (SQLite)

### Entidades registradas de los estacionamientos:
1. **Ubicación geográfica** (`geometria_geojson`): GeoJSON LineString desde `data/Estacionamiento-medido.csv`.
2. **Tres calles**: referenciadas por FK a la tabla `calles` → `calle_principal_id`, `calle_paralela_1_id`, `calle_paralela_2_id`.
3. **Capacidad total** (`capacidad_total`): Total de plazas de la calle.
4. **Capacidad ocupada** (`capacidad_ocupada`): Autos estacionados actualmente.
5. **Capacidad libre** (`capacidad_libre`): Columna **generada automáticamente** por SQLite (`capacidad_total - capacidad_ocupada`).

### DDL completo (`data/schema.sql`):

```sql
PRAGMA foreign_keys = ON;

-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE, -- 'ADMIN', 'EMPLEADO'
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

-- 3. Calles (Catálogo normalizado)
CREATE TABLE IF NOT EXISTS calles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,  -- Nombre de la calle (ej: "Pellegrini")
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Estacionamientos (Tramos de Estacionamiento Medido)
CREATE TABLE IF NOT EXISTS estacionamientos (
    gid INTEGER PRIMARY KEY,              -- 'gid' del CSV
    calle_principal_id INTEGER NOT NULL,  -- FK → calles.id
    calle_paralela_1_id INTEGER,          -- FK → calles.id (primera transversal)
    calle_paralela_2_id INTEGER,          -- FK → calles.id (segunda transversal)
    capacidad_total INTEGER NOT NULL CHECK (capacidad_total >= 0),
    capacidad_ocupada INTEGER NOT NULL DEFAULT 0
        CHECK (capacidad_ocupada >= 0 AND capacidad_ocupada <= capacidad_total),
    capacidad_libre INTEGER GENERATED ALWAYS AS (capacidad_total - capacidad_ocupada) STORED,
    geometria_geojson TEXT NOT NULL,      -- GeoJSON LineString del CSV ('st_asgeojson')
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
```

> [!NOTE]
> La tabla `calles` actúa como catálogo maestro. Al registrar un estacionamiento, primero se busca o inserta la calle en `calles`, y luego se referencia su `id` en `estacionamientos`.

---

## 🔄 Flujo Operativo del Sistema

1. **Administrador**:
   - Crea cuentas de empleados base (`POST /api/v1/users`).
   - Asigna tramos (`gid`) a empleados con fecha y horario (`POST /api/v1/asignaciones`).
2. **Empleado Base**:
   - Inicia sesión y consulta su turno (`GET /api/v1/asignaciones/mi-turno`).
   - **Entrada**: el empleado registra el evento → incrementa `capacidad_ocupada` (+1), `capacidad_libre` se recalcula y se emite evento WebSocket.
   - **Salida**: registra la salida → decrementa `capacidad_ocupada` (-1).
3. **Mapa en Vivo (Visitantes)**:
   - `GET /api/v1/estacionamientos/mapa` → FeatureCollection GeoJSON con estado de cada tramo.
   - Se actualiza en tiempo real por WebSocket al registrar entradas/salidas.

---

## 📡 Especificación de API REST

### 1. Autenticación
#### `POST /api/v1/auth/login`
- **Request Body:**
```json
{
  "nombre_usuario": "admin_rodrigo",
  "password": "password123"
}
```
- **Response (`200 OK`):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nombre_usuario": "admin_rodrigo",
    "nombre_completo": "Rodrigo Administrador",
    "email": "admin@lugarcito.com",
    "role": "ADMIN"
  }
}
```

---

### 2. Calles (ADMIN)
#### `GET /api/v1/calles`
- **Response (`200 OK`):**
```json
[
  { "id": 1, "nombre": "Pellegrini" },
  { "id": 2, "nombre": "San Martín" },
  { "id": 3, "nombre": "Bolívar" }
]
```

#### `POST /api/v1/calles`
- **Request Body:**
```json
{ "nombre": "Av. Chaco" }
```
- **Response (`201 Created`):**
```json
{ "id": 4, "nombre": "Av. Chaco", "created_at": "2026-08-01T11:30:00Z" }
```

---

### 3. Gestión de Usuarios (ADMIN)
#### `POST /api/v1/users`
- **Request Body:**
```json
{
  "role_id": 2,
  "nombre_usuario": "empleado_juan",
  "email": "juan@lugarcito.com",
  "password": "empPassword123",
  "nombre_completo": "Juan Pérez",
  "telefono": "+543794000000"
}
```
- **Response (`201 Created`):**
```json
{
  "id": 2,
  "role_nombre": "EMPLEADO",
  "nombre_usuario": "empleado_juan",
  "nombre_completo": "Juan Pérez",
  "activo": 1,
  "created_at": "2026-08-01T11:30:00Z"
}
```

#### `GET /api/v1/users`
- **Header:** `Authorization: Bearer <ADMIN_TOKEN>`
- **Response (`200 OK`):**
```json
[
  {
    "id": 1,
    "role_id": 1,
    "role_nombre": "ADMIN",
    "nombre_usuario": "admin_rodrigo",
    "email": "admin@lugarcito.com",
    "nombre_completo": "Rodrigo Admin",
    "activo": 1,
    "created_at": "2026-08-01T11:00:00Z"
  }
]
```

---

### 4. Asignaciones de Empleados (ADMIN)
#### `POST /api/v1/asignaciones`
- **Request Body:**
```json
{
  "empleado_id": 2,
  "estacionamiento_gids": [24, 154],
  "fecha": "2026-08-01",
  "hora_inicio": "08:00",
  "hora_fin": "14:00"
}
```
- **Response (`201 Created`):**
```json
{
  "mensaje": "Asignación creada exitosamente",
  "asignaciones": [
    { "id": 10, "empleado_id": 2, "estacionamiento_gid": 24, "hora_inicio": "08:00", "hora_fin": "14:00", "estado": "ACTIVO" }
  ]
}
```

#### `GET /api/v1/asignaciones/mi-turno`
- **Response (`200 OK`):**
```json
{
  "empleado_id": 2,
  "fecha": "2026-08-01",
  "tramos_asignados": [
    {
      "gid": 24,
      "calle_principal": { "id": 1, "nombre": "Pellegrini" },
      "calle_paralela_1": { "id": 2, "nombre": "San Martín" },
      "calle_paralela_2": { "id": 3, "nombre": "Bolívar" },
      "capacidad_total": 17,
      "capacidad_ocupada": 5,
      "capacidad_libre": 12,
      "hora_inicio": "08:00",
      "hora_fin": "14:00"
    }
  ]
}
```

---

### 5. Control de Entradas y Salidas (EMPLEADO)
#### `POST /api/v1/registros/entrada`
- **Request Body:**
```json
{ "estacionamiento_gid": 24 }
```
- **Response (`201 Created`):**
```json
{
  "id": 105,
  "estacionamiento_gid": 24,
  "empleado_id": 2,
  "hora_entrada": "2026-08-01T11:35:00Z",
  "estado": "EN_CURSO",
  "capacidad_ocupada": 6,
  "capacidad_libre": 11
}
```

#### `POST /api/v1/registros/salida`
- **Request Body:**
```json
{ "registro_id": 105 }
```
- **Response (`200 OK`):**
```json
{
  "id": 105,
  "estacionamiento_gid": 24,
  "hora_entrada": "2026-08-01T11:35:00Z",
  "hora_salida": "2026-08-01T13:35:00Z",
  "estado": "FINALIZADO",
  "capacidad_ocupada": 5,
  "capacidad_libre": 12
}
```

---

### 6. Mapa en Vivo y Cercanía (VISITANTES)

#### A. Obtener Todo el Mapa GeoJSON
- **HTTP Method:** `GET /api/v1/estacionamientos/mapa`
- **Response (`200 OK`):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-58.8428521442654, -27.4647615146858],
          [-58.841536470083, -27.46485514135]
        ]
      },
      "properties": {
        "gid": 24,
        "calle_principal": { "id": 1, "nombre": "Pellegrini" },
        "calle_paralela_1": { "id": 2, "nombre": "San Martín" },
        "calle_paralela_2": { "id": 3, "nombre": "Bolívar" },
        "capacidad_total": 17,
        "capacidad_ocupada": 6,
        "capacidad_libre": 11,
        "ocupacion_texto": "6 de 17",
        "estado_color": "VERDE"
      }
    }
  ]
}
```

#### B. Filtrar por Ubicación del Usuario y Radio (Km)
- **HTTP Method:** `GET /api/v1/estacionamientos/cercanos?lat=-27.4647&lng=-58.8428&radio=1.5`
- **Parámetros URL:**
  - `lat`: Latitud del usuario (obligatorio)
  - `lng`: Longitud del usuario (obligatorio)
  - `radio`: Radio de búsqueda en kilómetros (opcional, por defecto `1.0` km)
- **Response (`200 OK`):**
```json
{
  "type": "FeatureCollection",
  "usuario_lat": -27.4647,
  "usuario_lng": -58.8428,
  "radio_km": 1.5,
  "total_hallados": 1,
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-58.8428521442654, -27.4647615146858],
          [-58.841536470083, -27.46485514135]
        ]
      },
      "properties": {
        "gid": 24,
        "calle_principal": { "id": 1, "nombre": "Pellegrini" },
        "calle_paralela_1": { "id": 2, "nombre": "San Martín" },
        "calle_paralela_2": { "id": 3, "nombre": "Bolívar" },
        "capacidad_total": 17,
        "capacidad_ocupada": 6,
        "capacidad_libre": 11,
        "ocupacion_texto": "6 de 17",
        "distancia_km": "0.052",
        "estado_color": "VERDE"
      }
    }
  ]
}
```

---

## 🔌 Eventos WebSocket en Tiempo Real

- **URL:** `ws://localhost:8080/ws`

El WebSocket emite la información completa del tramo (incluyendo ubicación y calles) para que el frontend actualice el mapa en vivo sin hacer peticiones adicionales:

```json
{
  "type": "estacionamiento_actualizado",
  "payload": {
    "gid": 24,
    "calle_principal": { "id": 1, "nombre": "Pellegrini" },
    "calle_paralela_1": { "id": 2, "nombre": "San Martín" },
    "calle_paralela_2": { "id": 3, "nombre": "Bolívar" },
    "capacidad_total": 17,
    "capacidad_ocupada": 6,
    "capacidad_libre": 11,
    "ocupacion_texto": "6 de 17",
    "estado_color": "VERDE",
    "geometria": {
      "type": "LineString",
      "coordinates": [
        [-58.8428521442654, -27.4647615146858],
        [-58.841536470083, -27.46485514135]
      ]
    },
    "updated_at": "2026-08-01T12:48:00Z"
  }
}
```

---

## 🚀 Ejecución Local y con Docker

```bash
# 1. Correr la aplicación en local con Go
go run cmd/api/main.go

# 2. Correr con Docker Compose
docker-compose up --build

# 3. Ejecutar pruebas unitarias de servicios
go test -v ./...

# 4. Ejecutar pruebas de integración automatizadas contra la API (requiere servidor corriendo)
python3 scripts/test_endpoints.py
```
