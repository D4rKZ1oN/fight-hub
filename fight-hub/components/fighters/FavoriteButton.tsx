"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import type { Fighter } from "@/lib/types/mma";
import { FAVORITES_EVENT, isFavoriteFighter, toggleFavoriteFighter } from "@/lib/utils/favorites";

export function FavoriteButton({ fighter, compact = false }: { fighter: Fighter; compact?: boolean }) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const sync = () => setFavorite(isFavoriteFighter(fighter.id));
    sync();
    window.addEventListener(FAVORITES_EVENT, sync);
    return () => window.removeEventListener(FAVORITES_EVENT, sync);
  }, [fighter.id]);

  return <button
    type="button"
    className={`favorite-button ${favorite ? "is-favorite" : ""} ${compact ? "favorite-button-compact" : ""}`}
    aria-label={favorite ? `Quitar ${fighter.name} de favoritos` : `Agregar ${fighter.name} a favoritos`}
    aria-pressed={favorite}
    title={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      const next = toggleFavoriteFighter(fighter);
      setFavorite(next.some((item) => item.id === fighter.id));
    }}
  >
    <Star size={compact ? 17 : 20} fill={favorite ? "currentColor" : "none"} />
    {!compact && <span>{favorite ? "Favorito" : "Agregar a favoritos"}</span>}
  </button>;
}
