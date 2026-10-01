import { z } from "zod";
import { fetchJson } from "@/lib/api/fetch";
import type { MMADataProvider } from "./MMADataProvider";
import type { CardType, Event, EventStatus, Fight, Fighter, FighterStats, PaginatedFighters, Ranking, SearchResults } from "@/lib/types/mma";
import { slugify } from "@/lib/utils/text";
import { UfcProvider } from "./ufcProvider";

const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard";
const ESPN_FIGHTCENTER = "https://site.web.api.espn.com/apis/common/v3/sports/mma/ufc/fightcenter";

const athleteSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  displayName: z.string().optional(),
  fullName: z.string().optional(),
  shortName: z.string().optional(),
  headshot: z.object({ href: z.string().optional() }).optional(),
  flag: z.object({ href: z.string().optional(), alt: z.string().optional() }).optional(),
  displayHeight: z.string().optional(),
  displayWeight: z.string().optional(),
  displayReach: z.string().optional(),
  age: z.number().optional(),
  stance: z.object({ text: z.string().optional() }).optional(),
  weightClass: z.object({ text: z.string().optional(), shortName: z.string().optional() }).optional(),
  link: z.object({ href: z.string().optional() }).optional(),
}).passthrough();

const competitorSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  order: z.number().optional(),
  winner: z.boolean().optional(),
  displayRecord: z.string().optional(),
  records: z.array(z.object({ summary: z.string().optional() }).passthrough()).optional(),
  athlete: athleteSchema,
}).passthrough();

const competitionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  date: z.string().optional(),
  startDate: z.string().optional(),
  type: z.object({ abbreviation: z.string().optional(), text: z.string().optional() }).passthrough().optional(),
  competitors: z.array(competitorSchema).default([]),
  status: z.object({
    type: z.object({ state: z.string().optional(), completed: z.boolean().optional(), description: z.string().optional() }).passthrough().optional(),
  }).passthrough().optional(),
  format: z.object({ regulation: z.object({ periods: z.number().optional() }).passthrough().optional() }).passthrough().optional(),
  notes: z.array(z.object({ headline: z.string().optional(), type: z.string().optional() }).passthrough()).optional(),
  broadcasts: z.array(z.object({ names: z.array(z.string()).optional() }).passthrough()).optional(),
  broadcast: z.string().optional(),
}).passthrough();

const eventSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  shortName: z.string().optional(),
  date: z.string(),
  competitions: z.array(competitionSchema).optional(),
  status: z.object({ type: z.object({ state: z.string().optional(), completed: z.boolean().optional() }).passthrough().optional() }).passthrough().optional(),
  venue: z.object({
    fullName: z.string().optional(),
    address: z.object({ city: z.string().optional(), state: z.string().optional(), country: z.string().optional() }).passthrough().optional(),
  }).passthrough().optional(),
}).passthrough();

const scoreboardSchema = z.object({
  leagues: z.array(z.object({
    calendar: z.array(z.object({
      label: z.string(),
      startDate: z.string(),
      event: z.object({ $ref: z.string() }).optional(),
    }).passthrough()).optional(),
  }).passthrough()).optional(),
  events: z.array(eventSchema).optional(),
}).passthrough();

const cardSchema = z.object({ competitions: z.array(competitionSchema).optional() }).passthrough();
const fightcenterSchema = z.object({
  event: eventSchema,
  cards: z.object({
    main: cardSchema.optional(),
    prelims1: cardSchema.optional(),
    prelims2: cardSchema.optional(),
  }).passthrough().optional(),
}).passthrough();

type CompetitionInput = z.infer<typeof competitionSchema>;
type EventInput = z.infer<typeof eventSchema>;

function eventIdFromRef(ref?: string): string | null {
  if (!ref) return null;
  const match = ref.match(/events\/(\d+)/);
  return match?.[1] ?? null;
}

function mapEventStatus(state?: string, completed?: boolean): EventStatus {
  if (completed || state === "post") return "FINAL";
  if (state === "in") return "LIVE";
  if (state === "pre") return "UPCOMING";
  return "UNKNOWN";
}

function normalizeFighter(input: z.infer<typeof competitorSchema>): Fighter {
  const name = input.athlete.displayName ?? input.athlete.fullName ?? "Información no disponible";
  const providerId = String(input.athlete.id ?? input.id ?? "");
  return {
    id: slugify(name) || providerId || "fighter",
    providerId: providerId || null,
    name,
    nickname: null,
    country: input.athlete.flag?.alt ?? null,
    flag: input.athlete.flag?.href ?? null,
    image: input.athlete.headshot?.href ?? null,
    division: input.athlete.weightClass?.text ?? null,
    record: input.displayRecord ?? input.records?.[0]?.summary ?? null,
    ranking: null,
    championStatus: null,
    active: null,
  };
}

function normalizeFight(input: CompetitionInput, cardType: CardType, order: number): Fight {
  const competitors = [...input.competitors].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const red = competitors[0] ?? { athlete: {} };
  const blue = competitors[1] ?? { athlete: {} };
  const notes = input.notes?.map((n) => `${n.headline ?? ""} ${n.type ?? ""}`).join(" ").toLowerCase() ?? "";
  const title = notes.includes("title") || notes.includes("championship");
  return {
    fightId: String(input.id),
    fighterRed: normalizeFighter(red as z.infer<typeof competitorSchema>),
    fighterBlue: normalizeFighter(blue as z.infer<typeof competitorSchema>),
    weightClass: input.type?.text ?? input.type?.abbreviation ?? null,
    isTitleFight: title,
    isInterimTitleFight: notes.includes("interim"),
    rounds: input.format?.regulation?.periods ?? null,
    status: input.status?.type?.description ?? "Información no disponible",
    order,
    cardType,
    isMainEvent: false,
    isCoMainEvent: false,
    result: null,
  };
}

function emptyEvent(input: EventInput): Event {
  const comp = input.competitions?.[0];
  const venue = comp && "venue" in comp ? (comp as Record<string, unknown>).venue : undefined;
  const venueObj = venue && typeof venue === "object" ? venue as Record<string, unknown> : null;
  const address = venueObj?.address && typeof venueObj.address === "object" ? venueObj.address as Record<string, unknown> : null;
  const broadcastNames = input.competitions?.flatMap((c) => c.broadcasts?.flatMap((b) => b.names ?? []) ?? []) ?? [];
  const eventNumber = input.name.match(/UFC\s+(\d+)/i)?.[1] ?? null;
  return {
    id: String(input.id),
    name: input.name,
    shortName: input.shortName ?? null,
    eventNumber,
    promotion: "UFC",
    status: mapEventStatus(input.status?.type?.state, input.status?.type?.completed),
    date: input.date,
    startTime: input.date,
    timezone: "UTC",
    venue: {
      name: typeof venueObj?.fullName === "string" ? venueObj.fullName : input.venue?.fullName ?? null,
      city: typeof address?.city === "string" ? address.city : input.venue?.address?.city ?? null,
      state: typeof address?.state === "string" ? address.state : input.venue?.address?.state ?? null,
      country: typeof address?.country === "string" ? address.country : input.venue?.address?.country ?? null,
      latitude: null,
      longitude: null,
    },
    bannerImage: null,
    posterImage: null,
    broadcast: [...new Set(broadcastNames)],
    isOfficial: false,
    lastUpdated: new Date().toISOString(),
    mainEvent: null,
    coMainEvent: null,
    mainCard: [],
    prelims: [],
    earlyPrelims: [],
  };
}

export class EspnProvider implements MMADataProvider {
  private ufc = new UfcProvider();

  private async fightcenter(id: string) {
    const raw = await fetchJson<unknown>(`${ESPN_FIGHTCENTER}/${encodeURIComponent(id)}?region=us&lang=en&contentorigin=espn&showAirings=buy%2Clive%2Creplay&buyWindow=1m`, 900);
    return fightcenterSchema.parse(raw);
  }

  private normalizeFightcenter(data: z.infer<typeof fightcenterSchema>): Event {
    const event = emptyEvent(data.event);
    const main = (data.cards?.main?.competitions ?? []).map((f, i) => normalizeFight(f, "MAIN_CARD", i + 1));
    const prelims = (data.cards?.prelims1?.competitions ?? []).map((f, i) => normalizeFight(f, "PRELIMS", main.length + i + 1));
    const early = (data.cards?.prelims2?.competitions ?? []).map((f, i) => normalizeFight(f, "EARLY_PRELIMS", main.length + prelims.length + i + 1));

    if (main[0]) main[0] = { ...main[0], isMainEvent: true };
    if (main[1]) main[1] = { ...main[1], isCoMainEvent: true };

    const all = [...main, ...prelims, ...early];
    const firstWithVenue = data.event.competitions?.[0];
    if (firstWithVenue && "venue" in firstWithVenue) {
      const venue = (firstWithVenue as Record<string, unknown>).venue as Record<string, unknown> | undefined;
      const address = venue?.address as Record<string, unknown> | undefined;
      event.venue = {
        name: typeof venue?.fullName === "string" ? venue.fullName : event.venue.name,
        city: typeof address?.city === "string" ? address.city : event.venue.city,
        state: typeof address?.state === "string" ? address.state : event.venue.state,
        country: typeof address?.country === "string" ? address.country : event.venue.country,
        latitude: null,
        longitude: null,
      };
    }
    const firstFightDate = all.map((f) => data.cards?.main?.competitions?.find((c) => String(c.id) === f.fightId)?.date).find(Boolean);
    event.startTime = firstFightDate ?? event.date;
    event.mainCard = main;
    event.prelims = prelims;
    event.earlyPrelims = early;
    event.mainEvent = main[0] ?? null;
    event.coMainEvent = main[1] ?? null;
    return event;
  }

  async getUpcomingEvents(limit = 8): Promise<Event[]> {
    const raw = await fetchJson<unknown>(ESPN_SCOREBOARD, 1800);
    const board = scoreboardSchema.parse(raw);
    const now = Date.now();
    const calendar = board.leagues?.[0]?.calendar ?? [];
    const candidates = calendar
      .map((item) => ({ ...item, id: eventIdFromRef(item.event?.$ref) }))
      .filter((item) => item.id && new Date(item.startDate).getTime() >= now - 6 * 60 * 60 * 1000)
      .filter((item) => /^(UFC|Noche UFC)/i.test(item.label))
      .slice(0, limit);

    const settled = await Promise.allSettled(candidates.map((item) => this.getEvent(item.id!)));
    const events = settled.flatMap((result, index) => {
      if (result.status === "fulfilled" && result.value) return [result.value];
      const item = candidates[index];
      return [{
        id: item.id!, name: item.label, shortName: item.label.split(":")[0] ?? item.label,
        eventNumber: item.label.match(/UFC\s+(\d+)/i)?.[1] ?? null, promotion: "UFC", status: "UPCOMING" as EventStatus,
        date: item.startDate, startTime: item.startDate, timezone: "UTC",
        venue: { name: null, city: null, state: null, country: null, latitude: null, longitude: null },
        bannerImage: null, posterImage: null, broadcast: [], isOfficial: false, lastUpdated: new Date().toISOString(),
        mainEvent: null, coMainEvent: null, mainCard: [], prelims: [], earlyPrelims: [],
      } satisfies Event];
    });
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getEvent(id: string): Promise<Event | null> {
    if (!/^\d+$/.test(id)) return null;
    try {
      return this.normalizeFightcenter(await this.fightcenter(id));
    } catch {
      const core = await fetchJson<unknown>(`https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/${id}`, 900);
      const parsed = eventSchema.safeParse(core);
      return parsed.success ? emptyEvent(parsed.data) : null;
    }
  }

  async getEventFightCard(id: string) {
    const event = await this.getEvent(id);
    if (!event) return null;
    return { mainEvent: event.mainEvent, coMainEvent: event.coMainEvent, mainCard: event.mainCard, prelims: event.prelims, earlyPrelims: event.earlyPrelims };
  }

  async searchFighters(query: string): Promise<Fighter[]> { return this.ufc.searchFighters(query); }
  async getFighter(id: string): Promise<Fighter | null> { return this.ufc.getFighter(id); }
  async getFighterStats(id: string): Promise<FighterStats | null> { return this.ufc.getFighterStats(id); }
  async getFighters(page = 0, division?: string): Promise<PaginatedFighters> { return this.ufc.getFighters(page, division); }
  async getRankings(): Promise<Ranking[]> { return this.ufc.getRankings(); }
  async getRankingsByDivision(division: string): Promise<Ranking | null> { return this.ufc.getRankingsByDivision(division); }

  async search(query: string): Promise<SearchResults> {
    const [fighters, events] = await Promise.all([this.searchFighters(query), this.getUpcomingEvents(10)]);
    const q = query.toLocaleLowerCase();
    return { fighters, events: events.filter((event) => event.name.toLocaleLowerCase().includes(q)) };
  }
}
