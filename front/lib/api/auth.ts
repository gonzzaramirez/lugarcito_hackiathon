// Authentication against the backend API.
// Session (JWT + usuario) is persisted in localStorage; the shared HTTP
// client (lib/api/client.ts) attaches the token as a Bearer header.

import { httpPost } from "./client";

export interface LoginUsuario {
  id: number;
  nombre_usuario: string;
  nombre_completo: string;
  email: string;
  role: "ADMIN" | "EMPLEADO";
}

export interface LoginResponse {
  token: string;
  usuario: LoginUsuario;
}

const TOKEN_KEY = "lugarcito_token";
const USUARIO_KEY = "lugarcito_usuario";

export async function login(
  nombreUsuario: string,
  password: string
): Promise<LoginResponse> {
  const response = await httpPost<LoginResponse>("/auth/login", {
    nombre_usuario: nombreUsuario,
    password,
  });
  setSession(response);
  return response;
}

export function setSession(response: LoginResponse): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, response.token);
  window.localStorage.setItem(USUARIO_KEY, JSON.stringify(response.usuario));
}

export function getUsuario(): LoginUsuario | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(USUARIO_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as LoginUsuario;
  } catch {
    return null;
  }
}

export function logout(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USUARIO_KEY);
}
