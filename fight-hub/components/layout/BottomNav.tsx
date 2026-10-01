"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Search, Trophy, Users } from "lucide-react";
const links = [["/", "Inicio", Home], ["/events", "Eventos", CalendarDays], ["/search", "Buscar", Search], ["/fighters", "Peleadores", Users], ["/rankings", "Rankings", Trophy]] as const;
export function BottomNav() { const path = usePathname(); return <nav className="bottom-nav" aria-label="Navegación móvil">{links.map(([href,label,Icon]) => <Link key={href} href={href} className={path === href || (href !== "/" && path.startsWith(href)) ? "active" : ""}><Icon size={20}/><span>{label}</span></Link>)}</nav>; }
