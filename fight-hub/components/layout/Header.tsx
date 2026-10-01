import Link from "next/link";
import { SearchBox } from "@/components/search/SearchBox";
export function Header() {
  const name = process.env.NEXT_PUBLIC_APP_NAME ?? "FIGHT HUB";
  return <header className="header"><div className="header-inner"><Link href="/" className="brand"><span>F</span>{name}</Link><nav className="desktop-nav" aria-label="Navegación principal"><Link href="/">Inicio</Link><Link href="/events">Eventos</Link><Link href="/fighters">Peleadores</Link><Link href="/rankings">Rankings</Link></nav><div className="header-search"><SearchBox /></div></div></header>;
}
