"use client";

import { useEffect, useState } from "react";
import type { Fighter } from "@/lib/types/mma";
import { FAVORITES_EVENT, getFavoriteFighters } from "@/lib/utils/favorites";
import { FighterCard } from "./FighterCard";

export function FavoriteFightersSection() {
  const [favorites, setFavorites] = useState<Fighter[]>([]);

  useEffect(() => {
    const sync = () => setFavorites(getFavoriteFighters());
    sync();
    window.addEventListener(FAVORITES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return <section className="fighters-favorites-section">
    <div className="section-heading favorites-heading">
      <div>
        <span className="eyebrow">MI COLECCIÓN</span>
        <h2>PELEADORES FAVORITOS</h2>
      </div>
      <span className="favorites-count">{favorites.length}</span>
    </div>
    {favorites.length ? (
      <div className="fighter-grid favorites-grid">
        {favorites.map((fighter) => <FighterCard fighter={fighter} key={fighter.id} />)}
      </div>
    ) : (
      <div className="favorites-empty">
        <strong>Tu colección está vacía.</strong>
        <span>Usa la estrella de cualquier peleador para agregarlo aquí.</span>
      </div>
    )}
  </section>;
}
