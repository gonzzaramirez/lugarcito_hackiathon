import { AuthGuard } from "@/components/auth-guard";

export default function EmpleadoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthGuard requiredRole="EMPLEADO">{children}</AuthGuard>;
}
