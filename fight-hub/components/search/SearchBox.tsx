"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { SearchResults } from "@/lib/types/mma";

export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [data, setData] = useState<SearchResults>({ fighters: [], events: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (q.trim().length < 2) { setData({ fighters: [], events: [] }); setLoading(false); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError(false);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("search");
        setData(await res.json() as SearchResults);
      } catch (e) { if (!(e instanceof DOMException && e.name === "AbortError")) setError(true); }
      finally { setLoading(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q]);
  return <div className="search-wrap"><div className="search-input"><Search size={19}/><input autoFocus={autoFocus} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar peleador o evento…" aria-label="Buscar peleador o evento" />{q && <button aria-label="Limpiar búsqueda" onClick={() => setQ("")}><X size={18}/></button>}</div>
    {q.trim().length >= 2 && <div className="search-results">{loading && <p>Buscando…</p>}{error && <p>No pudimos cargar esta información.</p>}{!loading && !error && <>{data.fighters.length > 0 && <div><span className="search-group-title">PELEADORES</span>{data.fighters.map((f) => <Link key={f.id} href={`/fighters/${f.id}`}><strong>{f.name}</strong><small>{[f.division, f.record].filter(Boolean).join(" · ") || "Información no disponible"}</small></Link>)}</div>}{data.events.length > 0 && <div><span className="search-group-title">EVENTOS</span>{data.events.map((e) => <Link key={e.id} href={`/events/${e.id}`}><strong>{e.name}</strong><small>{new Date(e.date).toLocaleDateString("es")}</small></Link>)}</div>}{!data.fighters.length && !data.events.length && <p>Sin resultados.</p>}</>}</div>}
  </div>;
}
