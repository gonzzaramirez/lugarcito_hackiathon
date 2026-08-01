// WebSocket protocol types for the real-time estacionamiento feed.
// TODO(frontend): align field names with the backend WS payload once it lands.

/** Availability update for a single metered parking block. */
export interface EstacionamientoUpdate {
  estacionamientoId: number;
  /** Number of spots available after the change. */
  disponibles: number;
  /** Epoch milliseconds when the change was recorded. */
  timestamp: number;
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
