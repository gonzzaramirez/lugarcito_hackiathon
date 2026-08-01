import type { Empleado, Turno } from "../data/empleados";
import { EMPLEADOS } from "../data/empleados";
import { httpPost } from "./client";

const ASIGNACIONES_ENDPOINT = "/asignaciones";

export interface AsignacionInput {
  estacionamientoIds: number[];
}

/** Shift hours used to build the asignación when the UI has no date/time pickers. */
export const TURNO_HORARIOS: Record<Turno, { hora_inicio: string; hora_fin: string }> = {
  MAÑANA: { hora_inicio: "08:00", hora_fin: "14:00" },
  TARDE: { hora_inicio: "14:00", hora_fin: "20:00" },
  NOCHE: { hora_inicio: "20:00", hora_fin: "02:00" },
};

/** Local date in YYYY-MM-DD (the backend expects the assignment date). */
function hoyLocal(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

interface AsignacionResponse {
  mensaje: string;
  asignaciones: unknown[];
}

/**
 * Assigns estacionamientos to an employee for today's shift.
 * The backend requires fecha/hora_inicio/hora_fin; the UI does not collect
 * them, so they are derived from the employee's turno.
 */
export async function asignarEmpleado(
  empleadoId: number,
  estacionamientoIds: number[],
  turno: Turno = "MAÑANA"
): Promise<Empleado> {
  try {
    const { hora_inicio, hora_fin } = TURNO_HORARIOS[turno];
    await httpPost<AsignacionResponse>(ASIGNACIONES_ENDPOINT, {
      empleado_id: empleadoId,
      estacionamiento_gids: estacionamientoIds,
      fecha: hoyLocal(),
      hora_inicio,
      hora_fin,
    });
    const empleado = EMPLEADOS.find((item) => item.id === empleadoId);
    if (empleado) {
      empleado.estacionamientoIds = estacionamientoIds;
      return { ...empleado };
    }
    return {
      id: empleadoId,
      nombre: "",
      apellido: "",
      dni: "",
      telefono: "",
      turno,
      activo: true,
      estacionamientoIds,
    };
  } catch {
    const empleado = EMPLEADOS.find((item) => item.id === empleadoId);
    if (!empleado) {
      throw new Error(`Empleado ${empleadoId} no encontrado`);
    }
    empleado.estacionamientoIds = estacionamientoIds;
    return { ...empleado };
  }
}
