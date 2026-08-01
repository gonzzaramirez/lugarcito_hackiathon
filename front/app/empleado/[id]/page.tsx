import { Dashboard } from '../components/Dashboard';

export const metadata = {
  title: 'Dashboard Empleado | Lugarcito',
  description: 'Gestión de espacios de estacionamiento',
};

export default async function EstacionamientoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <Dashboard id={resolvedParams.id} />;
}
