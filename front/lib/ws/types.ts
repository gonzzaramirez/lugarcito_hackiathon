// WebSocket protocol types for the real-time estacionamiento feed.
// The Go backend emits { type: "estacionamiento_actualizado", payload } with
// gid + capacidad_* fields; the local mock simulator emits
// { type: "estacionamiento.update", payload: { estacionamientoId, disponibles } }.
// Both are normalized here into a single EstacionamientoUpdate shape.

/** Availability update for a single metered parking block. */
export interface EstacionamientoUpdate {
  estacionamientoId: number;
  /** Number of spots available after the change. */
  disponibles: number;
  /** Epoch milliseconds when the change was recorded. */
  timestamp: number;
}

/** Raw payload shape emitted by the Go backend over /ws. */
export interface EstacionamientoActualizadoPayload {
  gid: number;
  calle_principal?: { id: number; nombre: string } | null;
  capacidad_total: number;
  capacidad_ocupada: number;
  capacidad_libre: number;
  ocupacion_texto: string;
  estado_color: string;
  updated_at?: string;
}

export type WsMessage =
  | { type: "estacionamiento.update"; payload: EstacionamientoUpdate }
  | { type: "ping" }
  | { type: "pong" }
  | { type: "error"; message: string };

/**
 * Parses a raw WS frame into a typed message.
 * Returns null on malformed or unknown input (frame is skipped).
 */
export function parseWsMessage(raw: string | ArrayBuffer | Blob): WsMessage | null {
  if (typeof raw !== "string") {
    return null;
  }

  try {
    const data = JSON.parse(raw) as { type?: unknown; payload?: unknown; message?: unknown };

    switch (data.type) {
      case "estacionamiento_actualizado": {
        const payload = data.payload as Partial<EstacionamientoActualizadoPayload>;
        if (typeof payload?.gid !== "number" || typeof payload?.capacidad_libre !== "number") {
          return null;
        }
        return {
          type: "estacionamiento.update",
          payload: {
            estacionamientoId: payload.gid,
            disponibles: payload.capacidad_libre,
            timestamp: payload.updated_at ? Date.parse(payload.updated_at) : Date.now(),
          },
        };
      }
      case "estacionamiento.update": {
        const payload = data.payload as Partial<EstacionamientoUpdate>;
        if (
          typeof payload?.estacionamientoId !== "number" ||
          typeof payload?.disponibles !== "number"
        ) {
          return null;
        }
        return {
          type: "estacionamiento.update",
          payload: {
            estacionamientoId: payload.estacionamientoId,
            disponibles: payload.disponibles,
            timestamp: typeof payload.timestamp === "number" ? payload.timestamp : Date.now(),
          },
        };
      }
      case "ping":
        return { type: "ping" };
      case "pong":
        return { type: "pong" };
      case "error":
        return {
          type: "error",
          message: typeof data.message === "string" ? data.message : "Unknown error",
        };
      default:
        return null;
    }
  } catch {
    return null;
  }
}
