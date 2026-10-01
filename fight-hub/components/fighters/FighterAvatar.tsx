import { UserRound } from "lucide-react";
export function FighterAvatar({ src, name, large = false }: { src: string | null; name: string; large?: boolean }) {
  if (src) return <img className={large ? "fighter-photo fighter-photo-large" : "fighter-photo"} src={src} alt={name} loading="lazy" />;
  return <div className={large ? "fighter-photo fighter-photo-large fighter-placeholder" : "fighter-photo fighter-placeholder"} role="img" aria-label={`Sin fotografía de ${name}`}><UserRound aria-hidden="true" /></div>;
}
