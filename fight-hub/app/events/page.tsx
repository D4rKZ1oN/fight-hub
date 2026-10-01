import { getMMAProvider } from "@/lib/providers";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Event } from "@/lib/types/mma";
export const metadata = { title: "Eventos" };
export default async function EventsPage() { let events: Event[]=[]; try{events=await getMMAProvider().getUpcomingEvents(12)}catch{events=[]} return <div className="page"><div className="page-title"><span className="eyebrow">UFC / MMA</span><h1>EVENTOS</h1><p>Próximos eventos disponibles en la fuente. Horas mostradas en tu dispositivo cuando abras el detalle.</p></div>{events.length?<div className="event-grid">{events.map(e=><EventCard event={e} key={e.id}/>)}</div>:<EmptyState/>}</div> }
