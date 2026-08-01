"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/api/client";
import { getUsuario } from "@/lib/api/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Rol requerido para acceder a esta ruta. */
  requiredRole: "ADMIN" | "EMPLEADO";
}

/**
 * Client-side auth guard. Verifica que el usuario tenga sesión activa
 * y el rol correcto. Si no, redirige a /login.
 */
export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const usuario = getUsuario();

    if (!token || !usuario) {
      router.replace("/login");
      return;
    }

    if (usuario.role !== requiredRole) {
      // Redirigir al dashboard que corresponde según el rol real
      router.replace(usuario.role === "ADMIN" ? "/dashboard" : "/empleado");
      return;
    }

    setAllowed(true);
    setChecking(false);
  }, [router, requiredRole]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-700" />
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
