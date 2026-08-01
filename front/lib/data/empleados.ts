// Seed data for the "empleado" (parking attendant) module.
// TODO(frontend): remove this file once the backend API is connected.

export const TURNOS = ["MAÑANA", "TARDE", "NOCHE"] as const;
export type Turno = (typeof TURNOS)[number];

export const TURNO_LABELS: Record<Turno, string> = {
  MAÑANA: "Mañana",
  TARDE: "Tarde",
  NOCHE: "Noche",
};

export interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email?: string;
  turno: Turno;
  activo: boolean;
  /** Ids of the estacionamientos assigned to this employee. */
  estacionamientoIds: number[];
}

export const EMPLEADOS: Empleado[] = [
  {
    id: 1,
    nombre: "Lucía",
    apellido: "Fernández",
    dni: "30123456",
    telefono: "1155667788",
    email: "lucia.fernandez@example.com",
    turno: "MAÑANA",
    activo: true,
    estacionamientoIds: [24, 154],
  },
  {
    id: 2,
    nombre: "Martín",
    apellido: "Gómez",
    dni: "28567123",
    telefono: "1133445566",
    email: "martin.gomez@example.com",
    turno: "TARDE",
    activo: true,
    estacionamientoIds: [65, 155, 157],
  },
  {
    id: 3,
    nombre: "Sofía",
    apellido: "Rodríguez",
    dni: "32987654",
    telefono: "1177889900",
    turno: "NOCHE",
    activo: true,
    estacionamientoIds: [],
  },
  {
    id: 4,
    nombre: "Joaquín",
    apellido: "Sosa",
    dni: "27654321",
    telefono: "1122334455",
    email: "joaquin.sosa@example.com",
    turno: "MAÑANA",
    activo: true,
    estacionamientoIds: [12, 31],
  },
  {
    id: 5,
    nombre: "Camila",
    apellido: "Torres",
    dni: "34567890",
    telefono: "1199887766",
    turno: "TARDE",
    activo: true,
    estacionamientoIds: [20],
  },
  {
    id: 6,
    nombre: "Nicolás",
    apellido: "Acosta",
    dni: "25890123",
    telefono: "1155664433",
    email: "nicolas.acosta@example.com",
    turno: "NOCHE",
    activo: false,
    estacionamientoIds: [],
  },
];
