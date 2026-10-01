import Link from "next/link";
import type { Ranking } from "@/lib/types/mma";
export function RankingTable({ ranking }: { ranking: Ranking }) {
  return <div className="ranking-table">{ranking.champion && <Link href={`/fighters/${ranking.champion.id}`} className="champion-row"><span>CHAMPION</span><strong>{ranking.champion.name}</strong></Link>}{ranking.entries.map((entry) => <Link href={`/fighters/${entry.fighter.id}`} className="ranking-row" key={`${ranking.division.id}-${entry.rank}`}><b>#{entry.rank}</b><span>{entry.fighter.name}</span></Link>)}</div>;
}
