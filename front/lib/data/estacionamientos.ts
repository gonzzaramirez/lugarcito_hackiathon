// Seed data for the "estacionamiento" (metered parking) module.
// TODO(frontend): remove this file once the backend API is connected.
// Values mirror the real CSV export at back/data/Estacionamiento-medido.csv.

export interface Estacionamiento {
  id: number;
  /** Street name (invented display name for the mock). */
  calle: string;
  /** Street number where the metered block starts. */
  altura: number;
  /** Total metered spots in the block. */
  lugares: number;
  /** Spots available right now. */
  disponibles: number;
  /** Parking garages registered on the block. */
  garages: number;
  /** Percentage of occupied spots (0-100). */
  saturacion: number;
}

export const ESTACIONAMIENTOS: Estacionamiento[] = [
  { id: 24, calle: "Av. Corrientes", altura: 601, lugares: 24, disponibles: 9, garages: 5, saturacion: 63 },
  { id: 154, calle: "Av. Corrientes", altura: 1100, lugares: 20, disponibles: 16, garages: 1, saturacion: 20 },
  { id: 148, calle: "Av. Corrientes", altura: 1601, lugares: 22, disponibles: 15, garages: 6, saturacion: 32 },
  { id: 155, calle: "Av. Santa Fe", altura: 1600, lugares: 18, disponibles: 13, garages: 4, saturacion: 28 },
  { id: 25, calle: "Av. Santa Fe", altura: 801, lugares: 20, disponibles: 13, garages: 7, saturacion: 35 },
  { id: 20, calle: "Av. Córdoba", altura: 701, lugares: 24, disponibles: 18, garages: 2, saturacion: 25 },
  { id: 30, calle: "Av. Córdoba", altura: 800, lugares: 16, disponibles: 13, garages: 3, saturacion: 19 },
  { id: 31, calle: "Av. Rivadavia", altura: 1300, lugares: 20, disponibles: 15, garages: 5, saturacion: 25 },
  { id: 12, calle: "Av. Callao", altura: 1000, lugares: 16, disponibles: 7, garages: 2, saturacion: 56 },
  { id: 65, calle: "Av. Pueyrredón", altura: 1501, lugares: 14, disponibles: 3, garages: 4, saturacion: 79 },
  { id: 157, calle: "Av. Juan B. Justo", altura: 701, lugares: 20, disponibles: 6, garages: 5, saturacion: 70 },
  { id: 80, calle: "Av. Scalabrini Ortiz", altura: 1500, lugares: 22, disponibles: 15, garages: 5, saturacion: 32 },
  { id: 46, calle: "Av. Boedo", altura: 1201, lugares: 20, disponibles: 16, garages: 2, saturacion: 20 },
  { id: 130, calle: "Av. Caseros", altura: 1200, lugares: 18, disponibles: 14, garages: 2, saturacion: 22 },
];
