import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMMAProvider } from "@/lib/providers";
import { FighterHero } from "@/components/fighters/FighterHero";
import { FighterStats } from "@/components/fighters/FighterStats";
import { CardSection } from "@/components/ui/CardSection";
import { EmptyState } from "@/components/ui/EmptyState";
type Props={params:Promise<{fighterId:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {fighterId}=await params;try{const f=await getMMAProvider().getFighter(fighterId);return f?{title:f.name,description:`${f.name} — récord, división y estadísticas UFC.`}:{title:"Peleador"}}catch{return{title:"Peleador"}}}
export default async function FighterPage({params}:Props){const {fighterId}=await params;let fighter=null,stats=null;try{[fighter,stats]=await Promise.all([getMMAProvider().getFighter(fighterId),getMMAProvider().getFighterStats(fighterId)])}catch{}if(!fighter)notFound();return <div className="page"><FighterHero fighter={fighter}/><CardSection eyebrow="CAREER" title="Career Stats">{stats?<><FighterStats stats={stats}/><div className="stats-grid" style={{marginTop:10}}><div className="stat-box"><span>Edad</span><strong>{stats.age??"—"}</strong></div><div className="stat-box"><span>Altura</span><strong>{stats.height??"—"}</strong></div><div className="stat-box"><span>Alcance</span><strong>{stats.reach??"—"}</strong></div><div className="stat-box"><span>Stance / estilo</span><strong>{stats.stance??"—"}</strong></div></div></>:<EmptyState/>}</CardSection><CardSection eyebrow="HISTORY" title="Fight History"><EmptyState text="El historial detallado solo se mostrará cuando el proveedor lo entregue de forma estructurada y verificable."/></CardSection><p className="source-note">Perfil y estadísticas: página oficial del peleador en UFC.com cuando están disponibles. No se rellenan campos ausentes.</p></div>}
