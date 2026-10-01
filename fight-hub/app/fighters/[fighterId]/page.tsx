import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMMAProvider } from "@/lib/providers";
import { FighterHero } from "@/components/fighters/FighterHero";
import { FighterStats } from "@/components/fighters/FighterStats";
import { CardSection } from "@/components/ui/CardSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { FightHistory } from "@/components/fighters/FightHistory";
type Props={params:Promise<{fighterId:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {fighterId}=await params;try{const f=await getMMAProvider().getFighter(fighterId);return f?{title:f.name,description:`${f.name} — récord, división y estadísticas UFC.`}:{title:"Peleador"}}catch{return{title:"Peleador"}}}
export default async function FighterPage({params}:Props){const {fighterId}=await params;let fighter=null,stats=null,history=[];try{[fighter,stats,history]=await Promise.all([getMMAProvider().getFighter(fighterId),getMMAProvider().getFighterStats(fighterId),getMMAProvider().getFighterHistory(fighterId)])}catch{}if(!fighter)notFound();return <div className="page"><FighterHero fighter={fighter}/><CardSection eyebrow="CAREER" title="Career Stats">{stats?<><FighterStats stats={stats}/><div className="stats-grid" style={{marginTop:10}}><div className="stat-box"><span>Edad</span><strong>{stats.age??"—"}</strong></div><div className="stat-box"><span>Altura</span><strong>{stats.height??"—"}</strong></div><div className="stat-box"><span>Alcance</span><strong>{stats.reach??"—"}</strong></div><div className="stat-box"><span>Stance / estilo</span><strong>{stats.stance??"—"}</strong></div></div></>:<EmptyState/>}</CardSection><CardSection eyebrow="HISTORY" title="Fight History">{history.length?<FightHistory items={history}/>:<EmptyState text="Información no disponible para este peleador."/>}</CardSection><p className="source-note">Perfil y estadísticas: UFC.com. Historial de peleas: UFCStats. Solo se muestran datos publicados por las fuentes; no se rellenan campos ausentes.</p></div>}
