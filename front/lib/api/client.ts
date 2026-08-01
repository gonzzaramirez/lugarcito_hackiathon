// Shared HTTP client for the app.
// The backend exposes the REST API under /api/v1 (see back/README.md).
// Endpoints that require authentication read the JWT from the session
// (lib/api/auth.ts) and send it as a Bearer token.

// En desarrollo: http://localhost:8080/api/v1 (desde .env.local)
// En producción con Traefik: ""  — peticiones relativas al mismo dominio
// (Traefik rutea /api/* al backend internamente).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("lugarcito_token");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[API] ${res.status} ${init?.method ?? "GET"} ${url} — ${body}`);
    throw new Error(`HTTP ${res.status} ${init?.method ?? "GET"} ${path}`);
  }
  return (await res.json()) as T;
}

export async function httpGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export async function httpPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

/** Verifica conectividad con el backend. Resuelve true si responde, false si no. */
export async function checkBackend(): Promise<boolean> {
  try {
    const base = API_BASE_URL.replace(/\/api\/v1$/, "");
    const res = await fetch(`${base}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
