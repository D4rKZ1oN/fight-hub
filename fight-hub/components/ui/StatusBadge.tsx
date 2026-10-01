import type { EventStatus } from "@/lib/types/mma";

const labels: Record<EventStatus, string> = {
  CONFIRMED: "CONFIRMADO",
  UPCOMING: "PRÓXIMAMENTE",
  LIVE: "EN VIVO",
  FINAL: "FINALIZADO",
  UNKNOWN: "ESTADO NO DISPONIBLE",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{labels[status]}</span>;
}
