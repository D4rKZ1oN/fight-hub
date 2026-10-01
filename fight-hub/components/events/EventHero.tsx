import Link from "next/link";
import type { Event } from "@/lib/types/mma";
import { FighterAvatar } from "@/components/fighters/FighterAvatar";
import { CountdownTimer } from "./CountdownTimer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatEventDate } from "@/lib/utils/date";

export function EventHero({ event }: { event: Event }) {
  const red = event.mainEvent?.fighterRed;
  const blue = event.mainEvent?.fighterBlue;
  const location = [event.venue.city, event.venue.country].filter(Boolean).join(", ") || "Información no disponible";
  return <section className="event-hero">
    <div className="hero-top"><span className="eyebrow">PRÓXIMO EVENTO</span><StatusBadge status={event.status} /></div>
    <div className="hero-event-name">{event.shortName ?? event.name}</div>
    <div className="faceoff">
      <div className="faceoff-fighter"><FighterAvatar src={red?.image ?? null} name={red?.name ?? "Peleador"} large /><strong>{red?.name ?? "Información no disponible"}</strong><span>{red?.record ?? "Récord no disponible"}</span></div>
      <div className="vs">VS</div>
      <div className="faceoff-fighter"><FighterAvatar src={blue?.image ?? null} name={blue?.name ?? "Peleador"} large /><strong>{blue?.name ?? "Información no disponible"}</strong><span>{blue?.record ?? "Récord no disponible"}</span></div>
    </div>
    <div className="hero-meta"><span>{formatEventDate(event.date)}</span><span>{event.venue.name ?? "Arena no disponible"}</span><span>{location}</span></div>
    <CountdownTimer target={event.startTime ?? event.date} />
    <Link className="btn btn-primary" href={`/events/${event.id}`}>VER CARTELERA</Link>
  </section>;
}
