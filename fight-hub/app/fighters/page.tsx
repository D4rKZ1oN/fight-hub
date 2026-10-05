import Link from "next/link";
import { getMMAProvider } from "@/lib/providers";
import { FighterCard } from "@/components/fighters/FighterCard";
import { FavoriteFightersSection } from "@/components/fighters/FavoriteFightersSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBox } from "@/components/search/SearchBox";
import type { PaginatedFighters } from "@/lib/types/mma";

export const metadata = { title: "Peleadores" };

const divisions = [
  "Flyweight",
  "Bantamweight",
  "Featherweight",
  "Lightweight",
  "Welterweight",
  "Middleweight",
  "Light Heavyweight",
  "Heavyweight",
  "Women's Strawweight",
  "Women's Flyweight",
  "Women's Bantamweight",
];

export default async function FightersPage({ searchParams }: { searchParams: Promise<{ page?: string; division?: string }> }) {
  const params = await searchParams;
  const page = Math.max(0, Number(params.page ?? 0) || 0);
  const division = params.division;
  let data: PaginatedFighters = { items: [], page, hasMore: false };

  try {
    data = await getMMAProvider().getFighters(page, division);
  } catch {
    data = { items: [], page, hasMore: false };
  }

  return <div className="page">
    <div className="page-title">
      <span className="eyebrow">DIRECTORIO</span>
      <h1>PELEADORES</h1>
    </div>

    <div className="search-page-box" style={{ margin: "0 0 20px" }}><SearchBox /></div>

    <FavoriteFightersSection />

    <section className="fighters-directory-section">
      <div className="section-heading"><div><span className="eyebrow">ROSTER</span><h2>DIRECTORIO</h2></div></div>
      <div className="filters">
        <Link className={!division ? "active" : ""} href="/fighters">Todos</Link>
        {divisions.map((item) => <Link className={division === item ? "active" : ""} href={`/fighters?division=${encodeURIComponent(item)}`} key={item}>{item}</Link>)}
      </div>
      {data.items.length ? <div className="fighter-grid">{data.items.map((fighter) => <FighterCard fighter={fighter} key={fighter.id} />)}</div> : <EmptyState />}
      <div className="pagination">
        {page > 0 && <Link className="btn btn-secondary" href={`/fighters?page=${page - 1}${division ? `&division=${encodeURIComponent(division)}` : ""}`}>Anterior</Link>}
        {data.hasMore && <Link className="btn btn-primary" href={`/fighters?page=${page + 1}${division ? `&division=${encodeURIComponent(division)}` : ""}`}>Siguiente</Link>}
      </div>
    </section>
  </div>;
}
