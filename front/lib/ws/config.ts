// WebSocket endpoint configuration.
//
// Conecta al backend Go en ws://localhost:8080/ws por defecto.
// Para desarrollo sin backend, seteá NEXT_PUBLIC_USE_MOCK_WS=true
// y el simulador local (lib/ws/mock.ts) alimenta la UI.

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws";

export const USE_MOCK_WS = process.env.NEXT_PUBLIC_USE_MOCK_WS === "true";

/** Base delay for the first reconnect attempt. */
export const RECONNECT_BASE_DELAY_MS = 500;

/** Cap for the exponential backoff delay. */
export const RECONNECT_MAX_DELAY_MS = 10_000;
