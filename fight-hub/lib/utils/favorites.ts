import type { Fighter } from "@/lib/types/mma";

export const FAVORITES_STORAGE_KEY = "fight-hub:favorite-fighters:v1";
export const FAVORITES_EVENT = "fight-hub:favorites-changed";

function browserAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getFavoriteFighters(): Fighter[] {
  if (!browserAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Fighter => Boolean(item && typeof item.id === "string" && typeof item.name === "string"));
  } catch {
    return [];
  }
}

export function isFavoriteFighter(id: string): boolean {
  return getFavoriteFighters().some((fighter) => fighter.id === id);
}

export function toggleFavoriteFighter(fighter: Fighter): Fighter[] {
  if (!browserAvailable()) return [];
  const current = getFavoriteFighters();
  const exists = current.some((item) => item.id === fighter.id);
  const next = exists ? current.filter((item) => item.id !== fighter.id) : [fighter, ...current];
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
  return next;
}
