import { getMMAProvider } from "@/lib/providers";
import { RankingTable } from "@/components/rankings/RankingTable";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Ranking } from "@/lib/types/mma";
export const metadata={title:"Rankings"};
export default async function RankingsPage(){let rankings: Ranking[]=[];try{rankings=await getMMAProvider().getRankings()}catch{}return <div className="page"><div className="page-title"><span className="eyebrow">OFICIAL UFC</span><h1>RANKINGS</h1><p>Las posiciones se obtienen de la página oficial de rankings UFC. Si cambia el HTML de la fuente, la sección mostrará un estado vacío en lugar de inventar posiciones.</p></div>{rankings.length?rankings.map(r=><section className="section" key={r.division.id}><div className="section-heading"><h2>{r.division.name}</h2></div><RankingTable ranking={r}/></section>):<EmptyState/>}</div>}
