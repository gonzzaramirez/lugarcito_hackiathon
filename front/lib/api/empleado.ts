import type { Empleado, Turno } from "../data/empleados";
import { EMPLEADOS } from "../data/empleados";
import { httpGet, httpPost } from "./client";

const USERS_ENDPOINT = "/users";

export interface EmpleadoInput {
  nombre: string;
  apellido: string;
  dni: string;
  password: string;
  telefono: string;
  email?: string;
  turno: Turno;
  estacionamientoIds: number[];
}

interface UsuarioBackend {
  id: number;
  role_id: number;
  role_nombre: string;
  nombre_usuario: string;
  nombre_completo: string;
  email: string;
  telefono: string | null;
  activo: boolean | number;
  created_at: string;
}

/** Splits "Nombre Apellido" into the app's nombre/apellido fields. */
function splitNombreCompleto(nombreCompleto: string): { nombre: string; apellido: string } {
  const parts = nombreCompleto.trim().split(/\s+/);
  const [nombre = nombreCompleto, ...rest] = parts;
  return { nombre, apellido: rest.join(" ") };
}

/** Maps a backend user to the app's Empleado row model. */
export function usuarioToEmpleado(usuario: UsuarioBackend): Empleado {
  const { nombre, apellido } = splitNombreCompleto(usuario.nombre_completo);
  return {
    id: usuario.id,
    nombre,
    apellido,
    dni: usuario.nombre_usuario,
    telefono: usuario.telefono ?? "",
    email: usuario.email,
    turno: "MAÑANA",
    activo: !!usuario.activo,
    estacionamientoIds: [],
  };
}

export async function getEmpleados(): Promise<Empleado[]> {
  try {
    const usuarios = await httpGet<UsuarioBackend[]>(`${USERS_ENDPOINT}?role_id=2`);
    return usuarios.map(usuarioToEmpleado);
  } catch {
    return EMPLEADOS;
  }
}

export async function createEmpleado(input: EmpleadoInput): Promise<Empleado> {
  try {
    const usuario = await httpPost<UsuarioBackend>(USERS_ENDPOINT, {
      role_id: 2,
      nombre_usuario: input.dni,
      email: input.email || `${input.dni}@empleado.lugarcito.com`,
      password: input.password,
      nombre_completo: `${input.nombre} ${input.apellido}`.trim(),
      telefono: input.telefono,
    });
    return usuarioToEmpleado(usuario);
  } catch {
    const nuevo: Empleado = {
      id: EMPLEADOS.reduce((max, empleado) => Math.max(max, empleado.id), 0) + 1,
      ...input,
      activo: true,
    };
    EMPLEADOS.push(nuevo);
    return { ...nuevo };
  }
}
