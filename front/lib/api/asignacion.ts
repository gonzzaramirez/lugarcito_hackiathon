import type { Empleado } from "../data/empleados";
import { EMPLEADOS } from "../data/empleados";
import { httpPost } from "./client";

const EMPLEADOS_ENDPOINT = "/empleados";

export interface AsignacionInput {
  estacionamientoIds: number[];
}

/**
 * Assigns (or unassigns) estacionamientos to an employee.
 * Returns the updated employee.
 */
export async function asignarEmpleado(
  empleadoId: number,
  estacionamientoIds: number[]
): Promise<Empleado> {
  try {
    return await httpPost<Empleado>(
      `${EMPLEADOS_ENDPOINT}/${empleadoId}/asignaciones`,
      { estacionamientoIds } satisfies AsignacionInput
    );
  } catch {
    // Mock fallback: simulate the server updating the assignment.
    const empleado = EMPLEADOS.find((item) => item.id === empleadoId);
    if (!empleado) {
      throw new Error(`Empleado ${empleadoId} no encontrado`);
    }
    empleado.estacionamientoIds = estacionamientoIds;
    return { ...empleado };
  }
}
