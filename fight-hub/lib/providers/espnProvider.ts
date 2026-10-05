import { z } from "zod";
import { fetchJson } from "@/lib/api/fetch";
import type { MMADataProvider } from "./MMADataProvider";
import type {
  CardType,
  Event,
  EventStatus,
  Fight,
  Fighter,
  FighterFightHistoryItem,
  FighterStats,
  PaginatedFighters,
  Ranking,
  SearchResults,
  Venue,
} from "@/lib/types/mma";
import { slugify } from "@/lib/utils/text";
import { UfcProvider } from "./ufcProvider";

const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard";
const ESPN_FIGHTCENTER = "https://site.web.api.espn.com/apis/common/v3/sports/mma/ufc/fightcenter";

const venueSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  fullName: z.string().optional(),
  address: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  }).passthrough().optional(),
}).passthrough();

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

const statusSchema = z.object({
  type: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    state: z.string().optional(),
    completed: z.boolean().optional(),
    description: z.string().optional(),
    detail: z.string().optional(),
    shortDetail: z.string().optional(),
  }).passthrough().optional(),
}).passthrough();

const competitionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  date: z.string().optional(),
  startDate: z.string().optional(),
  type: z.object({ abbreviation: z.string().optional(), text: z.string().optional() }).passthrough().optional(),
  competitors: z.array(competitorSchema).default([]),
  status: statusSchema.optional(),
  venue: venueSchema.optional(),
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
  status: statusSchema.optional(),
  venue: venueSchema.optional(),
  venues: z.array(venueSchema).optional(),
}).passthrough();

const scoreboardSchema = z.object({
  leagues: z.array(z.object({
    calendar: z.array(z.object({
      label: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
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
type ScoreboardInput = z.infer<typeof scoreboardSchema>;

function eventIdFromRef(ref?: string): string | null {
  if (!ref) return null;
  const match = ref.match(/events\/(\d+)/);
  return match?.[1] ?? null;
}

function mapEventStatus(state?: string, completed?: boolean, name?: string, description?: string): EventStatus {
  const normalized = `${state ?? ""} ${name ?? ""} ${description ?? ""}`.toLowerCase();
  if (completed || state === "post" || normalized.includes("final") || normalized.includes("complete")) return "FINAL";
  if (state === "in" || normalized.includes("in progress") || normalized.includes("live")) return "LIVE";
  if (state === "pre" || normalized.includes("scheduled") || normalized.includes("pre")) return "UPCOMING";
  return "UNKNOWN";
}

function ensureUpcomingStatus(status: EventStatus, date: string): EventStatus {
  if (status !== "UNKNOWN") return status;
  const time = new Date(date).getTime();
  return Number.isFinite(time) && time > Date.now() ? "UPCOMING" : status;
}

function normalizeVenue(input?: z.infer<typeof venueSchema> | null): Venue {
  return {
    name: input?.fullName ?? null,
    city: input?.address?.city ?? null,
    state: input?.address?.state ?? null,
    country: input?.address?.country ?? null,
    latitude: null,
    longitude: null,
  };
}

function mergeVenue(primary: Venue, fallback: Venue): Venue {
  return {
    name: primary.name ?? fallback.name,
    city: primary.city ?? fallback.city,
    state: primary.state ?? fallback.state,
    country: primary.country ?? fallback.country,
    latitude: primary.latitude ?? fallback.latitude,
    longitude: primary.longitude ?? fallback.longitude,
  };
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
  const venueFromCompetition = normalizeVenue(comp?.venue);
  const venueFromEvent = normalizeVenue(input.venue ?? input.venues?.[0]);
  const venue = mergeVenue(venueFromCompetition, venueFromEvent);
  const broadcastNames = input.competitions?.flatMap((c) => c.broadcasts?.flatMap((b) => b.names ?? []) ?? []) ?? [];
  const eventNumber = input.name.match(/UFC\s+(\d+)/i)?.[1] ?? null;
  const status = mapEventStatus(
    input.status?.type?.state ?? comp?.status?.type?.state,
    input.status?.type?.completed ?? comp?.status?.type?.completed,
    input.status?.type?.name ?? comp?.status?.type?.name,
    input.status?.type?.description ?? comp?.status?.type?.description,
  );
  return {
    id: String(input.id),
    name: input.name,
    shortName: input.shortName ?? null,
    eventNumber,
    promotion: "UFC",
    status: ensureUpcomingStatus(status, input.date),
    date: input.date,
    startTime: comp?.date ?? comp?.startDate ?? input.date,
    timezone: "UTC",
    venue,
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

function mergeEventMetadata(primary: Event, secondary: Event): Event {
  return {
    ...primary,
    name: primary.name || secondary.name,
    shortName: primary.shortName ?? secondary.shortName,
    eventNumber: primary.eventNumber ?? secondary.eventNumber,
    status: primary.status === "UNKNOWN" ? secondary.status : primary.status,
    date: primary.date || secondary.date,
    startTime: primary.startTime ?? secondary.startTime,
    venue: mergeVenue(primary.venue, secondary.venue),
    broadcast: primary.broadcast.length ? primary.broadcast : secondary.broadcast,
    lastUpdated: new Date().toISOString(),
  };
}

function dateKey(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
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

    const allCompetitions = [
      ...(data.cards?.main?.competitions ?? []),
      ...(data.cards?.prelims1?.competitions ?? []),
      ...(data.cards?.prelims2?.competitions ?? []),
    ];
    const venueCompetition = allCompetitions.find((competition) => competition.venue)?.venue;
    if (venueCompetition) event.venue = mergeVenue(event.venue, normalizeVenue(venueCompetition));

    const firstFightDate = allCompetitions.map((competition) => competition.date ?? competition.startDate).find(Boolean);
    event.startTime = firstFightDate ?? event.startTime ?? event.date;
    event.mainCard = main;
    event.prelims = prelims;
    event.earlyPrelims = early;
    event.mainEvent = main[0] ?? null;
    event.coMainEvent = main[1] ?? null;
    return event;
  }

  private async rootScoreboard(): Promise<ScoreboardInput> {
    const raw = await fetchJson<unknown>(ESPN_SCOREBOARD, 1800);
    return scoreboardSchema.parse(raw);
  }

  private calendarDateForEvent(board: ScoreboardInput, id: string): string | null {
    const calendar = board.leagues?.[0]?.calendar ?? [];
    return calendar.find((item) => eventIdFromRef(item.event?.$ref) === id)?.startDate ?? null;
  }

  private async scoreboardEvent(id: string, dateHint?: string | null): Promise<EventInput | null> {
    let hint = dateHint ?? null;
    if (!hint) {
      const root = await this.rootScoreboard();
      hint = this.calendarDateForEvent(root, id);
      const alreadyLoaded = root.events?.find((event) => String(event.id) === id);
      if (alreadyLoaded) return alreadyLoaded;
    }
    if (!hint) return null;
    const key = dateKey(hint);
    if (!key) return null;
    const raw = await fetchJson<unknown>(`${ESPN_SCOREBOARD}?dates=${key}`, 900);
    const board = scoreboardSchema.parse(raw);
    return board.events?.find((event) => String(event.id) === id) ?? null;
  }

  async getUpcomingEvents(limit = 8): Promise<Event[]> {
    const board = await this.rootScoreboard();
    const now = Date.now();
    const calendar = board.leagues?.[0]?.calendar ?? [];
    const candidates = calendar
      .map((item) => ({ ...item, id: eventIdFromRef(item.event?.$ref) }))
      .filter((item) => item.id && new Date(item.startDate).getTime() >= now - 6 * 60 * 60 * 1000)
      .filter((item) => /^(UFC|Noche UFC)/i.test(item.label))
      .slice(0, limit);

    const settled = await Promise.allSettled(candidates.map((item) => this.getEvent(item.id!)));
    const events = settled.flatMap((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        return [{ ...result.value, status: ensureUpcomingStatus(result.value.status, result.value.date) }];
      }
      const item = candidates[index];
      return [{
        id: item.id!,
        name: item.label,
        shortName: item.label.split(":")[0] ?? item.label,
        eventNumber: item.label.match(/UFC\s+(\d+)/i)?.[1] ?? null,
        promotion: "UFC",
        status: "UPCOMING" as EventStatus,
        date: item.startDate,
        startTime: item.startDate,
        timezone: "UTC",
        venue: { name: null, city: null, state: null, country: null, latitude: null, longitude: null },
        bannerImage: null,
        posterImage: null,
        broadcast: [],
        isOfficial: false,
        lastUpdated: new Date().toISOString(),
        mainEvent: null,
        coMainEvent: null,
        mainCard: [],
        prelims: [],
        earlyPrelims: [],
      } satisfies Event];
    });
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getEvent(id: string): Promise<Event | null> {
    if (!/^\d+$/.test(id)) return null;

    let event: Event | null = null;
    let dateHint: string | null = null;

    try {
      const fightcenter = await this.fightcenter(id);
      event = this.normalizeFightcenter(fightcenter);
      dateHint = event.date;
    } catch {
      // Continue with scoreboard/core fallback.
    }

    try {
      const scoreboardInput = await this.scoreboardEvent(id, dateHint);
      if (scoreboardInput) {
        const scoreboardEvent = emptyEvent(scoreboardInput);
        event = event ? mergeEventMetadata(event, scoreboardEvent) : scoreboardEvent;
        dateHint = scoreboardEvent.date;
      }
    } catch {
      // Keep Fightcenter data if scoreboard metadata is temporarily unavailable.
    }

    if (!event) {
      try {
        const core = await fetchJson<unknown>(`https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/${id}`, 900);
        const parsed = eventSchema.safeParse(core);
        if (parsed.success) event = emptyEvent(parsed.data);
      } catch {
        return null;
      }
    }

    if (event) event.status = ensureUpcomingStatus(event.status, event.date);
    return event;
  }

  async getEventFightCard(id: string) {
    const event = await this.getEvent(id);
    if (!event) return null;
    return {
      mainEvent: event.mainEvent,
      coMainEvent: event.coMainEvent,
      mainCard: event.mainCard,
      prelims: event.prelims,
      earlyPrelims: event.earlyPrelims,
    };
  }

  async searchFighters(query: string): Promise<Fighter[]> { return this.ufc.searchFighters(query); }
  async getFighter(id: string): Promise<Fighter | null> { return this.ufc.getFighter(id); }
  async getFighterStats(id: string): Promise<FighterStats | null> { return this.ufc.getFighterStats(id); }
  async getFighterHistory(id: string): Promise<FighterFightHistoryItem[]> { return this.ufc.getFighterHistory(id); }
  async getFighters(page = 0, division?: string): Promise<PaginatedFighters> { return this.ufc.getFighters(page, division); }
  async getRankings(): Promise<Ranking[]> { return this.ufc.getRankings(); }
  async getRankingsByDivision(division: string): Promise<Ranking | null> { return this.ufc.getRankingsByDivision(division); }

  async search(query: string): Promise<SearchResults> {
    const [fighters, events] = await Promise.all([this.searchFighters(query), this.getUpcomingEvents(10)]);
    const q = query.toLocaleLowerCase();
    return { fighters, events: events.filter((event) => event.name.toLocaleLowerCase().includes(q)) };
  }
}
