import Link from "next/link";
import type { Fighter } from "@/lib/types/mma";
import { FighterAvatar } from "./FighterAvatar";
export function FighterCard({ fighter }: { fighter: Fighter }) {
  return <Link className="fighter-card" href={`/fighters/${fighter.id}`}><FighterAvatar src={fighter.image} name={fighter.name} large /><div className="fighter-card-content">{fighter.ranking && <span className="rank-chip">#{fighter.ranking}</span>}<h3>{fighter.name}</h3>{fighter.nickname && <p>“{fighter.nickname}”</p>}<div><span>{fighter.division ?? "División no disponible"}</span><strong>{fighter.record ?? "Récord no disponible"}</strong></div></div></Link>;
}
