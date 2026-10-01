import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

const display = Barlow_Condensed({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800", "900"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
export const metadata: Metadata = { title: { default: "Fight Hub", template: "%s — Fight Hub" }, description: "Eventos UFC/MMA, carteleras, peleadores, estadísticas y rankings.", manifest: "/manifest.webmanifest", appleWebApp: { capable: true, title: "Fight Hub", statusBarStyle: "black-translucent" }, icons: { apple: "/apple-touch-icon.png", icon: "/icon-192.png" } };
export const viewport: Viewport = { themeColor: "#050505", colorScheme: "dark", width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body className={`${display.variable} ${body.variable}`}><Header/><main>{children}</main><BottomNav/></body></html>; }
