import type { Estacionamiento } from "../data/estacionamientos";
import { ESTACIONAMIENTOS } from "../data/estacionamientos";
import { httpGet } from "./client";

const ESTACIONAMIENTOS_ENDPOINT = "/estacionamientos";

export async function getEstacionamientos(): Promise<Estacionamiento[]> {
  try {
    // Attempt the real request first; falls back to seed data until the backend exists.
    return await httpGet<Estacionamiento[]>(ESTACIONAMIENTOS_ENDPOINT);
  } catch {
    return ESTACIONAMIENTOS;
  }
}
