import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { getMMAProvider } from "@/lib/providers";
import { FightCard } from "@/components/events/FightCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatEventDate } from "@/lib/utils/date";

type Props={params:Promise<{eventId:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {eventId}=await params;try{const e=await getMMAProvider().getEvent(eventId);return e?{title:e.name,description:`${e.name} — cartelera, fecha, lugar y peleadores.`}:{title:"Evento"}}catch{return{title:"Evento"}}}
export default async function EventPage({params}:Props){const {eventId}=await params;let event=null;try{event=await getMMAProvider().getEvent(eventId)}catch{}if(!event)notFound();const location=[event.venue.city,event.venue.state,event.venue.country].filter(Boolean).join(", ")||"Información no disponible";const sections=[["MAIN CARD",event.mainCard],["PRELIMS",event.prelims],["EARLY PRELIMS",event.earlyPrelims]] as const;return <div className="page"><section className="event-detail-top"><StatusBadge status={event.status}/><h1>{event.name}</h1><div className="event-detail-meta"><span><CalendarDays size={17}/>{formatEventDate(event.date)}</span><span><MapPin size={17}/>{event.venue.name??"Arena no disponible"} · {location}</span></div></section>{sections.map(([title,fights])=><section key={title}><h2 className="fight-section-title">{title}</h2>{fights.length?<div className="fight-list">{fights.map(f=><FightCard key={f.fightId} fight={f} eventId={event.id}/>)}</div>:<EmptyState text={`La fuente no proporcionó peleas para ${title}.`}/>}</section>)}<p className="source-note">Actualizado: {new Date(event.lastUpdated).toLocaleString("es")}. La cartelera puede cambiar; la app vuelve a consultar la fuente periódicamente.</p></div>}
