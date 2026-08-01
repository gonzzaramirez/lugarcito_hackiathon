import type { Empleado, Turno } from "../data/empleados";
import { EMPLEADOS } from "../data/empleados";
import { httpGet, httpPost } from "./client";

const EMPLEADOS_ENDPOINT = "/empleados";

export interface EmpleadoInput {
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email?: string;
  turno: Turno;
  estacionamientoIds: number[];
}

export async function getEmpleados(): Promise<Empleado[]> {
  try {
    // Attempt the real request first; falls back to seed data until the backend exists.
    return await httpGet<Empleado[]>(EMPLEADOS_ENDPOINT);
  } catch {
    return EMPLEADOS;
  }
}

export async function createEmpleado(input: EmpleadoInput): Promise<Empleado> {
  try {
    return await httpPost<Empleado>(EMPLEADOS_ENDPOINT, input);
  } catch {
    // Mock fallback: simulate the server creating the record.
    const nuevo: Empleado = {
      id: EMPLEADOS.reduce((max, empleado) => Math.max(max, empleado.id), 0) + 1,
      ...input,
      activo: true,
    };
    EMPLEADOS.push(nuevo);
    return { ...nuevo };
  }
}
