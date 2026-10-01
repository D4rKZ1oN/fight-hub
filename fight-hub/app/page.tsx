import Link from "next/link";
import { getMMAProvider } from "@/lib/providers";
import { EventHero } from "@/components/events/EventHero";
import { EventCard } from "@/components/events/EventCard";
import { CardSection } from "@/components/ui/CardSection";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Event } from "@/lib/types/mma";

export default async function Home() {
  let events: Event[] = [];
  try { events = await getMMAProvider().getUpcomingEvents(8); } catch { events = []; }
  const [next, ...rest] = events;
  return <div className="page">{next ? <EventHero event={next}/> : <EmptyState title="Próximo evento no disponible" text="No pudimos obtener un próximo evento confirmado del proveedor."/>}<CardSection eyebrow="CALENDARIO" title="Próximos eventos" action={<Link className="btn btn-secondary" href="/events">Ver todos</Link>}>{rest.length ? <div className="event-grid">{rest.map((event) => <EventCard key={event.id} event={event}/>)}</div> : <EmptyState/>}</CardSection><CardSection eyebrow="ROSTER" title="Explora peleadores" action={<Link className="btn btn-primary" href="/fighters">Explorar peleadores</Link>}><p style={{color:"#a1a1aa",maxWidth:700}}>Busca perfiles, récords y estadísticas. Los campos que la fuente no proporcione se muestran como no disponibles.</p></CardSection><p className="source-note">Datos obtenidos desde fuentes públicas de ESPN y páginas oficiales de UFC. Los endpoints de ESPN utilizados no son una API pública documentada con garantía de permanencia.</p></div>;
}
