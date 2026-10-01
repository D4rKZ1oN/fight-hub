import Link from "next/link";
import type { Event } from "@/lib/types/mma";
import { CalendarDays, MapPin } from "lucide-react";
import { formatEventDate } from "@/lib/utils/date";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function EventCard({ event }: { event: Event }) {
  const main = event.mainEvent ? `${event.mainEvent.fighterRed.name} vs ${event.mainEvent.fighterBlue.name}` : "Main Event: información no disponible";
  const place = [event.venue.city, event.venue.country].filter(Boolean).join(", ") || "Ubicación no disponible";
  return <Link className="event-card" href={`/events/${event.id}`}>
    <div className="event-card-accent" />
    <div className="event-card-body"><StatusBadge status={event.status} /><h3>{event.shortName ?? event.name}</h3><p className="event-main">{main}</p><div className="mini-meta"><span><CalendarDays size={15} />{formatEventDate(event.date)}</span><span><MapPin size={15} />{place}</span></div></div>
  </Link>;
}
