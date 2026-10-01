import type { FighterStats as Stats } from "@/lib/types/mma";
const rows: Array<[keyof Stats, string, string]> = [
  ["slpm", "SLpM", ""], ["strikingAccuracy", "Sig. Strike Accuracy", "%"], ["sapm", "SApM", ""], ["strikingDefense", "Sig. Strike Defense", "%"], ["takedownAverage", "Takedown Average", ""], ["takedownAccuracy", "Takedown Accuracy", "%"], ["takedownDefense", "Takedown Defense", "%"], ["submissionAverage", "Submission Average", ""],
];
export function FighterStats({ stats }: { stats: Stats }) {
  return <div className="stats-grid">{rows.map(([key, label, suffix]) => <div className="stat-box" key={key}><span>{label}</span><strong>{stats[key] ?? "—"}{stats[key] !== null ? suffix : ""}</strong></div>)}</div>;
}
