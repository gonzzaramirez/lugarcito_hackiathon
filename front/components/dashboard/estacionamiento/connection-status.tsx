import { cn } from "@/lib/utils";
import type { WsStatus } from "@/lib/ws/client";

const STATUS_META: Record<WsStatus, { label: string; dot: string; text: string }> = {
  connecting: {
    label: "Conectando",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  connected: {
    label: "Conectado",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  reconnecting: {
    label: "Reconectando",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  offline: {
    label: "Offline",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
  },
};

interface ConnectionStatusProps {
  status: WsStatus;
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const meta = STATUS_META[status];
  const isPending = status === "connecting" || status === "reconnecting";

  return (
    <div
      className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm"
      title="Estado de la conexión de datos en tiempo real"
    >
      <span
        className={cn("size-2 rounded-full", meta.dot, isPending && "animate-pulse")}
        aria-hidden
      />
      <span className={cn("font-medium", meta.text)}>{meta.label}</span>
    </div>
  );
}
