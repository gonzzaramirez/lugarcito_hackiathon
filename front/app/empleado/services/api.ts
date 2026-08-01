import { IEstacionamiento } from '../types';
import { getAuthToken, httpGet, httpPost } from '@/lib/api/client';
import { estacionamientoApi as mockApi } from './mockApi';

// Capa de API real contra el backend Go (ver back/README.md).
// Endpoints:
//   GET /api/v1/asignaciones/mi-turno   -> tramos asignados al empleado logueado
//   POST /api/v1/registros/entrada      -> { estacionamiento_gid }
//   POST /api/v1/registros/salida       -> { registro_id }
// Si el backend no responde (o no hay sesión), cae al mock local.

interface CalleRef {
  id: number;
  nombre: string;
}

interface TramosAsignado {
  gid: number;
  calle_principal?: CalleRef | null;
  calle_paralela_1?: CalleRef | null;
  calle_paralela_2?: CalleRef | null;
  capacidad_total: number;
  capacidad_ocupada: number;
  capacidad_libre: number;
  hora_inicio: string;
  hora_fin: string;
}

interface MiTurnoResponse {
  empleado_id: number;
  tramos_asignados: TramosAsignado[];
}

interface RegistroResponse {
  id: number;
  estacionamiento_gid: number;
  empleado_id: number;
  hora_entrada: string;
  hora_salida?: string | null;
  estado: string;
  capacidad_ocupada: number;
  capacidad_libre: number;
}

/** Pila de registros activos por gid. Cada entrada pushea, cada salida popea. */
const registrosActivos = new Map<number, number[]>();

/** Caché del último estado conocido de cada tramo (para conservar nombre/capacidad). */
const tramosCache = new Map<number, IEstacionamiento>();

function tramoToIEstacionamiento(tramo: TramosAsignado): IEstacionamiento {
  return {
    id: String(tramo.gid),
    nombre: tramo.calle_principal?.nombre ?? `Tramo ${tramo.gid}`,
    capacidadMaxima: tramo.capacidad_total,
    lugaresDisponibles: tramo.capacidad_libre,
  };
}

async function getMiTurno(): Promise<IEstacionamiento[]> {
  const data = await httpGet<MiTurnoResponse>('/asignaciones/mi-turno');
  const tramos = data.tramos_asignados.map(tramoToIEstacionamiento);
  for (const tramo of tramos) {
    tramosCache.set(Number(tramo.id), tramo);
  }
  return tramos;
}

/** Reconstruye el tramo actualizado conservando el nombre del caché. */
function tramoActualizado(
  gid: number,
  lugaresDisponibles: number,
  capacidadTotal: number
): IEstacionamiento {
  const previo = tramosCache.get(gid);
  const nombre = previo?.nombre ?? `Tramo ${gid}`;
  return { id: String(gid), nombre, capacidadMaxima: capacidadTotal, lugaresDisponibles };
}

export const estacionamientoApi = {
  getAllEstacionamientos: async (): Promise<IEstacionamiento[]> => {
    try {
      if (!getAuthToken()) {
        throw new Error('Sin sesión');
      }
      return await getMiTurno();
    } catch {
      return mockApi.getAllEstacionamientos();
    }
  },

  getEstacionamiento: async (id: string): Promise<IEstacionamiento | null> => {
    try {
      const lista = await getMiTurno();
      const encontrado = lista.find((e) => e.id === id);
      if (encontrado) {
        return { ...encontrado };
      }
      return null;
    } catch {
      return mockApi.getEstacionamiento(id);
    }
  },

  registrarEntrada: async (id: string): Promise<IEstacionamiento | null> => {
    try {
      const data = await httpPost<RegistroResponse>('/registros/entrada', {
        estacionamiento_gid: Number(id),
      });
      const gid = data.estacionamiento_gid;
      const pila = registrosActivos.get(gid) ?? [];
      pila.push(data.id);
      registrosActivos.set(gid, pila);
      return tramoActualizado(
        gid,
        data.capacidad_libre,
        data.capacidad_ocupada + data.capacidad_libre
      );
    } catch {
      return mockApi.registrarEntrada(id);
    }
  },

  registrarSalida: async (id: string): Promise<IEstacionamiento | null> => {
    const gid = Number(id);
    const pila = registrosActivos.get(gid);
    const registroId = pila?.pop();
    if (!registroId) {
      return mockApi.registrarSalida(id);
    }
    // Si la pila quedó vacía, limpiamos la entrada del mapa
    if (pila && pila.length === 0) {
      registrosActivos.delete(gid);
    }
    try {
      const data = await httpPost<RegistroResponse>('/registros/salida', {
        registro_id: registroId,
      });
      return tramoActualizado(
        data.estacionamiento_gid,
        data.capacidad_libre,
        data.capacidad_ocupada + data.capacidad_libre
      );
    } catch {
      // Devolver el registro_id a la pila si falló la API
      const restaurada = registrosActivos.get(gid) ?? [];
      restaurada.push(registroId);
      registrosActivos.set(gid, restaurada);
      return mockApi.registrarSalida(id);
    }
  },
};
