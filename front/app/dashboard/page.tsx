import { EstacionamientoLiveView } from "@/components/dashboard/estacionamiento/estacionamiento-live-view";
import { getEstacionamientos } from "@/lib/api/estacionamiento";

export default async function EstacionamientosPage() {
  // Initial data is fetched on the server (RSC); live updates are applied
  // client-side by EstacionamientoLiveView via the WS feed.
  const estacionamientos = await getEstacionamientos();

  return <EstacionamientoLiveView initialEstacionamientos={estacionamientos} />;
}
