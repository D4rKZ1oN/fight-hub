import type { MMADataProvider } from "./MMADataProvider";
import type { Event, Fighter, FighterStats, PaginatedFighters, Ranking, SearchResults } from "@/lib/types/mma";

export class MockProvider implements MMADataProvider {
  private disabled(): never { throw new Error("MockProvider contiene solo datos DEMO y está desactivado en producción."); }
  async getUpcomingEvents(): Promise<Event[]> { return this.disabled(); }
  async getEvent(): Promise<Event | null> { return this.disabled(); }
  async getEventFightCard(): Promise<Pick<Event, "mainEvent" | "coMainEvent" | "mainCard" | "prelims" | "earlyPrelims"> | null> { return this.disabled(); }
  async searchFighters(): Promise<Fighter[]> { return this.disabled(); }
  async getFighter(): Promise<Fighter | null> { return this.disabled(); }
  async getFighterStats(): Promise<FighterStats | null> { return this.disabled(); }
  async getFighters(): Promise<PaginatedFighters> { return this.disabled(); }
  async getRankings(): Promise<Ranking[]> { return this.disabled(); }
  async getRankingsByDivision(): Promise<Ranking | null> { return this.disabled(); }
  async search(): Promise<SearchResults> { return this.disabled(); }
}
