import { CalendarDays, Clock3 } from "lucide-react";
import type { FighterFightHistoryItem } from "@/lib/types/mma";

function resultLabel(result: FighterFightHistoryItem["result"]): string {
  if (result === "WIN") return "WIN";
  if (result === "LOSS") return "LOST";
  if (result === "DRAW") return "DRAW";
  if (result === "NC") return "NC";
  return "N/A";
}

function displayDate(value: string | null): string {
  if (!value) return "Fecha no disponible";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function FightHistory({ items }: { items: FighterFightHistoryItem[] }) {
  return (
    <div className="history-list">
      {items.map((fight) => (
        <article className="history-card" key={fight.id}>
          <div
            className={`history-result history-result-${fight.result.toLowerCase()}`}
          >
            {resultLabel(fight.result)}
          </div>

          <div className="history-main">
            <span className="history-kicker">VS</span>
            <h3>{fight.opponentName}</h3>
            <div className="history-event">
              {fight.eventName ?? "Evento no disponible"}
            </div>
            <div className="history-date">
              <CalendarDays size={14} />
              {displayDate(fight.date)}
            </div>
          </div>

          <div className="history-finish">
            <span>MÉTODO</span>
            <strong>{fight.method ?? "Información no disponible"}</strong>
            {fight.methodDetail && <small>{fight.methodDetail}</small>}
            <div className="history-round">
              <Clock3 size={13} />
              {fight.round ? `Round ${fight.round}` : "Round N/D"}
              {fight.time ? ` · ${fight.time}` : ""}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
