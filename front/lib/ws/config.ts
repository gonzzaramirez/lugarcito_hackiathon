// WebSocket endpoint configuration.
//
// En desarrollo: ws://localhost:8080/ws (desde .env.local)
// En producción con Traefik: se deriva automáticamente de window.location
// (mismo host, protocolo wss:// si es HTTPS).
// Para desarrollo sin backend, seteá NEXT_PUBLIC_USE_MOCK_WS=true.

function buildWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  }
  // Fallback SSR / build time
  return "ws://localhost:8080/ws";
}

export const WS_URL = buildWsUrl();

export const USE_MOCK_WS = process.env.NEXT_PUBLIC_USE_MOCK_WS === "true";

/** Base delay for the first reconnect attempt. */
export const RECONNECT_BASE_DELAY_MS = 500;

/** Cap for the exponential backoff delay. */
export const RECONNECT_MAX_DELAY_MS = 10_000;
