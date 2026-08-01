# Lugarcito

**Gestión de estacionamiento medido en tiempo real.**

Plataforma que transforma el estacionamiento medido tradicional en una red de datos vivos. Empleados en la calle registran entradas y salidas desde el celular, y el sistema refleja la disponibilidad al instante en un mapa público.

---

## Qué problema resuelve

El estacionamiento medido tradicional es opaco: el vecino no sabe dónde hay lugar, el empleado anota en papel, y la municipalidad no tiene datos para tomar decisiones. Lugarcito digitaliza las tres puntas:

| Actor | Antes | Con Lugarcito |
|---|---|---|
| **Vecino** | Da vueltas buscando lugar | Abre el mapa y ve dónde hay verde |
| **Empleado** | Planilla de papel | App móvil: toca «Entró» / «Salió» |
| **Admin** | Sin visibilidad | Dashboard con 168 cuadras en tiempo real |

---

## Vistas de la aplicación

### 🗺️ Mapa público (`/`)
Mapa con todas las cuadras de estacionamiento medido coloreadas según disponibilidad en tiempo real:
- 🟢 **Verde** — 6 o más lugares libres
- 🟡 **Amarillo** — 4 o 5 lugares (casi lleno)
- 🟠 **Naranja** — 1 a 3 lugares (crítico)
- 🔴 **Rojo** — sin lugares

Se actualiza solo, sin refrescar. Usa la ubicación del dispositivo para centrar el mapa.

### 📊 Dashboard admin (`/dashboard`)
Tabla con las 168 cuadras, estadísticas de ocupación, y actualizaciones en vivo vía WebSocket. Permite crear empleados, asignarles cuadras y turnos.

### 📱 App del empleado (`/empleado`)
El empleado ve solo las cuadras que tiene asignadas para su turno. Toca «Entró» cuando un auto estaciona y «Salió» cuando se va. La disponibilidad se actualiza al instante para todos.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind, Leaflet |
| Backend | Go 1.24, SQLite (modernc.org/sqlite, sin CGO), JWT |
| Tiempo real | WebSocket nativo (gorilla/websocket) |
| Datos | 210 tramos geo-referenciados de Corrientes (CSV → GeoJSON) |

---

## Cómo levantar

```bash
# 1. Backend (puerto 8080)
cd back
go run ./cmd/api

# 2. Frontend (puerto 3000)
cd front
npm install
npm run dev
```

**Acceso:** `http://localhost:3000`

**Credenciales default:** `admin` / `admin`

---

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/auth/login` | Login (JWT) |
| `GET` | `/api/v1/estacionamientos/mapa` | GeoJSON con todas las cuadras |
| `POST` | `/api/v1/users` | Crear empleado (admin) |
| `POST` | `/api/v1/asignaciones` | Asignar cuadras a empleado |
| `GET` | `/api/v1/asignaciones/mi-turno` | Cuadras del empleado logueado |
| `POST` | `/api/v1/registros/entrada` | Registrar entrada de vehículo |
| `POST` | `/api/v1/registros/salida` | Registrar salida de vehículo |
| `GET` | `/ws` | WebSocket (actualizaciones en vivo) |
