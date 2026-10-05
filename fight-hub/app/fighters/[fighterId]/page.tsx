import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMMAProvider } from "@/lib/providers";
import type {
  Fighter,
  FighterFightHistoryItem,
  FighterStats as FighterStatsData,
} from "@/lib/types/mma";
import { FighterHero } from "@/components/fighters/FighterHero";
import { FighterStats } from "@/components/fighters/FighterStats";
import { FightHistory } from "@/components/fighters/FightHistory";
import { CardSection } from "@/components/ui/CardSection";
import { EmptyState } from "@/components/ui/EmptyState";

type Props = {
  params: Promise<{ fighterId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { fighterId } = await params;

  try {
    const fighter = await getMMAProvider().getFighter(fighterId);
    return fighter
      ? {
          title: fighter.name,
          description: `${fighter.name} — récord, división y estadísticas UFC.`,
        }
      : { title: "Peleador" };
  } catch {
    return { title: "Peleador" };
  }
}

export default async function FighterPage({ params }: Props) {
  const { fighterId } = await params;
  const provider = getMMAProvider();

  let fighter: Fighter | null = null;
  let stats: FighterStatsData | null = null;
  let history: FighterFightHistoryItem[] = [];

  const [fighterResult, statsResult, historyResult] = await Promise.allSettled([
    provider.getFighter(fighterId),
    provider.getFighterStats(fighterId),
    provider.getFighterHistory(fighterId),
  ]);

  if (fighterResult.status === "fulfilled") fighter = fighterResult.value;
  if (statsResult.status === "fulfilled") stats = statsResult.value;
  if (historyResult.status === "fulfilled") history = historyResult.value;

  if (!fighter) notFound();

  return (
    <div className="page">
      <FighterHero fighter={fighter} />

      <CardSection eyebrow="CAREER" title="Career Stats">
        {stats ? (
          <>
            <FighterStats stats={stats} />
            <div className="stats-grid" style={{ marginTop: 10 }}>
              <div className="stat-box">
                <span>Edad</span>
                <strong>{stats.age ?? "—"}</strong>
              </div>
              <div className="stat-box">
                <span>Altura</span>
                <strong>{stats.height ?? "—"}</strong>
              </div>
              <div className="stat-box">
                <span>Alcance</span>
                <strong>{stats.reach ?? "—"}</strong>
              </div>
              <div className="stat-box">
                <span>Stance / estilo</span>
                <strong>{stats.stance ?? "—"}</strong>
              </div>
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </CardSection>

      <CardSection eyebrow="HISTORY" title="Fight History">
        {history.length ? (
          <FightHistory items={history} />
        ) : (
          <EmptyState text="Información no disponible para este peleador." />
        )}
      </CardSection>

      <p className="source-note">
        Perfil, estadísticas e historial: UFC.com cuando están disponibles, con UFCStats
        únicamente como respaldo para el historial. No se rellenan campos ausentes.
      </p>
    </div>
  );
}
