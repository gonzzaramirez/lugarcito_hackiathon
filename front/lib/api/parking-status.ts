// API layer for the "parking availability" module.
// TODO(frontend): these helpers already target the real backend contract
// (`GET /parking-status`, `POST /recommend`). Until the backend exists they
// fall back to the hardcoded mock + a local mirror of the recommendation
// algorithm. Only the endpoint URL needs to change when the backend lands.

import { httpGet, httpPost } from "./client";
import {
  PARKING_STATUS_MOCK,
  type ParkingSegment,
  type ParkingStatusResponse,
} from "../data/parking-status";

const PARKING_STATUS_ENDPOINT = "/parking-status";
const RECOMMEND_ENDPOINT = "/recommend";

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

export async function getParkingStatus(): Promise<ParkingStatusResponse> {
  try {
    // Real request first; falls back to the mock until the backend exists.
    return await httpGet<ParkingStatusResponse>(PARKING_STATUS_ENDPOINT);
  } catch {
    return PARKING_STATUS_MOCK;
  }
}

export async function getRecommendations(
  request: RecommendRequest
): Promise<RecommendResponse> {
  try {
    // Real request first; falls back to the local mirror until the backend exists.
    return await httpPost<RecommendResponse>(RECOMMEND_ENDPOINT, request);
  } catch {
    return recommendFromMock(request);
  }
}
