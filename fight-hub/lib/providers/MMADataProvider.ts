import type { Event, Fighter, FighterStats, PaginatedFighters, Ranking, SearchResults } from "@/lib/types/mma";

export interface MMADataProvider {
  getUpcomingEvents(limit?: number): Promise<Event[]>;
  getEvent(id: string): Promise<Event | null>;
  getEventFightCard(id: string): Promise<Pick<Event, "mainEvent" | "coMainEvent" | "mainCard" | "prelims" | "earlyPrelims"> | null>;
  searchFighters(query: string): Promise<Fighter[]>;
  getFighter(id: string): Promise<Fighter | null>;
  getFighterStats(id: string): Promise<FighterStats | null>;
  getFighters(page?: number, division?: string): Promise<PaginatedFighters>;
  getRankings(): Promise<Ranking[]>;
  getRankingsByDivision(division: string): Promise<Ranking | null>;
  search(query: string): Promise<SearchResults>;
}
