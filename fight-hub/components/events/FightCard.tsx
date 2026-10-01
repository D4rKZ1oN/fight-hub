import Link from "next/link";
import type { Fight } from "@/lib/types/mma";
import { FighterAvatar } from "@/components/fighters/FighterAvatar";
import { Trophy } from "lucide-react";

function FighterSide({ fight, side }: { fight: Fight; side: "red" | "blue" }) {
  const f = side === "red" ? fight.fighterRed : fight.fighterBlue;
  return <Link className="fight-fighter" href={`/fighters/${f.id}`}><FighterAvatar src={f.image} name={f.name} /><div><strong>{f.name}</strong><span>{f.ranking ? `#${f.ranking} · ` : ""}{f.record ?? "Récord no disponible"}</span></div></Link>;
}

export function FightCard({ fight, eventId }: { fight: Fight; eventId?: string }) {
  return <article className="fight-card">
    <div className="fight-labels">{fight.isMainEvent && <span>MAIN EVENT</span>}{fight.isCoMainEvent && <span>CO-MAIN EVENT</span>}{fight.isTitleFight && <span><Trophy size={13}/> TITLE FIGHT</span>}</div>
    <div className="fight-matchup"><FighterSide fight={fight} side="red" /><div className="fight-vs">VS</div><FighterSide fight={fight} side="blue" /></div>
    <div className="fight-meta"><span>{fight.weightClass ?? "División no disponible"}</span><span>{fight.rounds ? `${fight.rounds} ROUNDS` : "Rounds no disponibles"}</span></div>{eventId && <div className="fight-action"><Link className="btn btn-secondary" href={`/events/${eventId}/fight/${fight.fightId}`}>Ver comparación</Link></div>}
  </article>;
}
