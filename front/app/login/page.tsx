"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { login } from "@/lib/api/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { usuario } = await login(username, password);
      toast.success(`Bienvenido, ${usuario.nombre_completo}`);
      router.push(usuario.role === "ADMIN" ? "/dashboard" : "/empleado");
    } catch {
      toast.warning("Backend no disponible, entrando en modo demo");
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      
      {/* Título de la app afuera de la tarjeta para un diseño más armónico */}
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Lugarcito
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Gestión de estacionamientos
        </p>
      </div>

      <Card className="w-full max-w-sm shadow-sm border-zinc-200/60 dark:border-zinc-800">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-xl font-semibold">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresá tu usuario y contraseña
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2 text-left">
              <Label htmlFor="username" className="text-zinc-700 dark:text-zinc-300">Usuario</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="admin" 
                required 
                className="h-11"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            
            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">Contraseña</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required 
                  className="h-11 pr-10"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 mt-2 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
