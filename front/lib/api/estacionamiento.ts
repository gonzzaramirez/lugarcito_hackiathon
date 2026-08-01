import type { Estacionamiento } from "../data/estacionamientos";
import { ESTACIONAMIENTOS } from "../data/estacionamientos";
import { httpGet } from "./client";

const MAPA_ENDPOINT = "/estacionamientos/mapa";

interface CalleRef {
  id: number;
  nombre: string;
}

interface MapaFeature {
  type: "Feature";
  geometry: { type: "LineString"; coordinates: [number, number][] };
  properties: {
    gid: number;
    calle_principal?: CalleRef | null;
    calle_paralela_1?: CalleRef | null;
    calle_paralela_2?: CalleRef | null;
    capacidad_total: number;
    capacidad_ocupada: number;
    capacidad_libre: number;
    ocupacion_texto: string;
    estado_color: string;
  };
}

interface MapaResponse {
  type: "FeatureCollection";
  features: MapaFeature[];
}

/** Maps a backend GeoJSON feature to the app's Estacionamiento row model. */
export function featureToEstacionamiento(feature: MapaFeature): Estacionamiento {
  const { gid, calle_principal, capacidad_total, capacidad_ocupada, capacidad_libre } =
    feature.properties;
  const saturacion =
    capacidad_total > 0
      ? Math.round((capacidad_ocupada / capacidad_total) * 100)
      : 0;
  return {
    id: gid,
    calle: calle_principal?.nombre ?? `Tramo ${gid}`,
    altura: 0,
    lugares: capacidad_total,
    disponibles: capacidad_libre,
    garages: 0,
    saturacion,
  };
}

export async function getEstacionamientos(): Promise<Estacionamiento[]> {
  try {
    const data = await httpGet<MapaResponse>(MAPA_ENDPOINT);
    return data.features.map(featureToEstacionamiento);
  } catch (err) {
    console.error("[estacionamiento] Falló GET /estacionamientos/mapa, usando mock:", err);
    return ESTACIONAMIENTOS;
  }
}
