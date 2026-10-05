"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Fighter } from "@/lib/types/mma";
import { FighterAvatar } from "./FighterAvatar";
import { FavoriteButton } from "./FavoriteButton";

export function FighterCard({ fighter }: { fighter: Fighter }) {
  const [image, setImage] = useState<string | null>(fighter.image);

  useEffect(() => {
    if (image || !fighter.id) return;
    const controller = new AbortController();
    fetch(`/api/fighters/${encodeURIComponent(fighter.id)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<Fighter> : null)
      .then((profile) => {
        if (profile?.image) setImage(profile.image);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [fighter.id, image]);

  const hydratedFighter = useMemo(() => ({ ...fighter, image }), [fighter, image]);

  return <article className="fighter-card">
    <Link className="fighter-card-link" href={`/fighters/${fighter.id}`}>
      <FighterAvatar src={image} name={fighter.name} large />
      <div className="fighter-card-content">
        {fighter.ranking && <span className="rank-chip">#{fighter.ranking}</span>}
        <h3>{fighter.name}</h3>
        {fighter.nickname && <p>“{fighter.nickname}”</p>}
        <div>
          <span>{fighter.division ?? "División no disponible"}</span>
          <strong>{fighter.record ?? "Récord no disponible"}</strong>
        </div>
      </div>
    </Link>
    <div className="fighter-card-favorite">
      <FavoriteButton fighter={hydratedFighter} compact />
    </div>
  </article>;
}
