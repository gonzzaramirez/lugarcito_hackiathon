// API layer for the "parking availability" module (visitor map).
// The backend exposes the live map as a GeoJSON FeatureCollection
// (`GET /estacionamientos/mapa`) and the radius search as
// `GET /estacionamientos/cercanos?lat&lng&radio`. When the backend is
// unreachable these helpers fall back to the local mock + mirror algorithm.

import { httpGet } from "./client";
import {
  PARKING_STATUS_MOCK,
  type ParkingSegment,
  type ParkingStatus,
  type ParkingStatusResponse,
} from "../data/parking-status";

const MAPA_ENDPOINT = "/estacionamientos/mapa";
const CERCANOS_ENDPOINT = "/estacionamientos/cercanos";

export interface RecommendRequest {
  lat: number;
  lon: number;
  weight_distance: number;
  weight_lugares: number;
  weight_garage: number;
  max_radius: number;
}

export interface RecommendedSegment {
  id: number;
  street: string | null;
  block: string | null;
  status: ParkingSegment["status"];
  available: number | null;
  capacity: number | null;
  distance_m: number;
  score: number;
  /** Block centroid, used to route to the segment. */
  lat: number;
  lon: number;
}

export interface RecommendResponse {
  results: RecommendedSegment[];
  total_candidates: number;
}

export function segmentCentroid(segment: ParkingSegment): [number, number] {
  const lats = segment.coordinates.map(([lat]) => lat);
  const lons = segment.coordinates.map(([, lon]) => lon);
  return [
    lats.reduce((sum, value) => sum + value, 0) / lats.length,
    lons.reduce((sum, value) => sum + value, 0) / lons.length,
  ];
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Maps the backend estado_color to the app's availability status. */
function colorToStatus(color: string): ParkingStatus {
  switch (color) {
    case "ROJO":
      return "FULL";
    case "AMARILLO":
      return "LOW";
    case "VERDE":
      return "AVAILABLE";
    default:
      return "UNKNOWN";
  }
}

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
    distancia_km?: string;
  };
}

interface MapaResponse {
  type: "FeatureCollection";
  features: MapaFeature[];
}

function featureToSegment(feature: MapaFeature): ParkingSegment {
  const { gid, calle_principal, capacidad_total, capacidad_ocupada, capacidad_libre, estado_color } =
    feature.properties;
  // Backend geometry is [lng, lat]; the app model uses [lat, lon].
  const coordinates: [number, number][] = feature.geometry.coordinates.map(
    ([lng, lat]) => [lat, lng]
  );
  return {
    id: gid,
    street: calle_principal?.nombre ?? null,
    block: null,
    status: colorToStatus(estado_color),
    occupied: capacidad_ocupada,
    capacity: capacidad_total,
    available: capacidad_libre,
    garage: 0,
    coordinates,
  };
}

/** Local mirror of the backend utility-function recommender (top 3). */
function recommendFromMock(request: RecommendRequest): RecommendResponse {
  const totalWeight =
    request.weight_distance + request.weight_lugares + request.weight_garage || 1;
  const wDist = request.weight_distance / totalWeight;
  const wLug = request.weight_lugares / totalWeight;
  const wGar = request.weight_garage / totalWeight;

  const maxAvailable = Math.max(
    ...PARKING_STATUS_MOCK.segments.map((segment) => segment.available ?? 0)
  );

  const candidates = PARKING_STATUS_MOCK.segments
    .map((segment) => {
      const [lat, lon] = segmentCentroid(segment);
      return { segment, lat, lon, distance_m: haversineDistance(request.lat, request.lon, lat, lon) };
    })
    .filter((item) => item.distance_m <= request.max_radius)
    .map((item) => {
      const available = item.segment.available ?? 0;
      const fDistance = 1 / (1 + item.distance_m / 100);
      const fLugares = maxAvailable > 0 ? available / maxAvailable : 0;
      const fGarage = item.segment.garage > 0 ? 1 : 0;
      return {
        ...item,
        score: wDist * fDistance + wLug * fLugares + wGar * fGarage,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const results: RecommendedSegment[] = candidates.map((item) => ({
    id: item.segment.id,
    street: item.segment.street,
    block: item.segment.block,
    status: item.segment.status,
    available: item.segment.available,
    capacity: item.segment.capacity,
    distance_m: Math.round(item.distance_m * 10) / 10,
    score: Math.round(item.score * 1000) / 1000,
    lat: item.lat,
    lon: item.lon,
  }));

  return { results, total_candidates: candidates.length };
}

/** Scores backend cercanos results with the same utility function. */
function scoreFeatures(
  features: MapaFeature[],
  request: RecommendRequest,
  lat: number,
  lon: number
): RecommendResponse {
  const totalWeight =
    request.weight_distance + request.weight_lugares + request.weight_garage || 1;
  const wDist = request.weight_distance / totalWeight;
  const wLug = request.weight_lugares / totalWeight;
  const wGar = request.weight_garage / totalWeight;

  const maxAvailable = Math.max(
    ...features.map((feature) => feature.properties.capacidad_libre)
  );

  const candidates = features
    .map((feature) => {
      const segment = featureToSegment(feature);
      const [clat, clon] = segmentCentroid(segment);
      const distanceM = haversineDistance(lat, lon, clat, clon);
      return { segment, distance_m: distanceM };
    })
    .map((item) => {
      const available = item.segment.available ?? 0;
      const fDistance = 1 / (1 + item.distance_m / 100);
      const fLugares = maxAvailable > 0 ? available / maxAvailable : 0;
      const fGarage = item.segment.garage > 0 ? 1 : 0;
      return {
        ...item,
        score: wDist * fDistance + wLug * fLugares + wGar * fGarage,
      };
    })
    .sort((a, b) => b.score - a.score);

  const results: RecommendedSegment[] = candidates.map((item) => ({
    id: item.segment.id,
    street: item.segment.street,
    block: item.segment.block,
    status: item.segment.status,
    available: item.segment.available,
    capacity: item.segment.capacity,
    distance_m: Math.round(item.distance_m * 10) / 10,
    score: Math.round(item.score * 1000) / 1000,
    lat: item.segment.coordinates[0][0],
    lon: item.segment.coordinates[0][1],
  }));

  return { results, total_candidates: candidates.length };
}

export async function getParkingStatus(): Promise<ParkingStatusResponse> {
  try {
    const data = await httpGet<MapaResponse>(MAPA_ENDPOINT);
    return { updatedAt: new Date().toISOString(), segments: data.features.map(featureToSegment) };
  } catch {
    return PARKING_STATUS_MOCK;
  }
}

export async function getRecommendations(
  request: RecommendRequest
): Promise<RecommendResponse> {
  try {
    const radioKm = request.max_radius / 1000;
    const data = await httpGet<MapaResponse>(
      `${CERCANOS_ENDPOINT}?lat=${request.lat}&lng=${request.lon}&radio=${radioKm}`
    );
    return scoreFeatures(data.features, request, request.lat, request.lon);
  } catch {
    return recommendFromMock(request);
  }
}
