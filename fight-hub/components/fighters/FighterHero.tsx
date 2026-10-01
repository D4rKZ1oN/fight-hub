import type { Fighter } from "@/lib/types/mma";
import { FighterAvatar } from "./FighterAvatar";
export function FighterHero({ fighter }: { fighter: Fighter }) {
  return <section className="fighter-hero"><FighterAvatar src={fighter.image} name={fighter.name} large /><div><span className="eyebrow">{fighter.division ?? "DIVISIÓN NO DISPONIBLE"}</span><h1>{fighter.name}</h1>{fighter.nickname && <p className="fighter-nickname">“{fighter.nickname}”</p>}<div className="fighter-hero-badges">{fighter.championStatus && <span>CHAMPION</span>}{fighter.ranking && <span>#{fighter.ranking}</span>}<span>{fighter.record ?? "Récord no disponible"}</span></div>{fighter.country && <p>{fighter.country}</p>}</div></section>;
}
