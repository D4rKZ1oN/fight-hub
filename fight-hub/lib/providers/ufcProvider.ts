import * as cheerio from "cheerio";
import { fetchHtml } from "@/lib/api/fetch";
import type { MMADataProvider } from "./MMADataProvider";
import type {
  Event,
  Fighter,
  FighterFightHistoryItem,
  FighterStats,
  FightHistoryResult,
  PaginatedFighters,
  Ranking,
  SearchResults,
} from "@/lib/types/mma";
import { cleanText, parseNumber, slugify } from "@/lib/utils/text";
import { UfcStatsProvider } from "./ufcStatsProvider";

const UFC = "https://www.ufc.com";
const DIVISIONS = [
  "Men's Pound-for-Pound Top Rank",
  "Women's Pound-for-Pound Top Rank",
  "Flyweight",
  "Bantamweight",
  "Featherweight",
  "Lightweight",
  "Welterweight",
  "Middleweight",
  "Light Heavyweight",
  "Heavyweight",
  "Women's Strawweight",
  "Women's Flyweight",
  "Women's Bantamweight",
];

function recordFromText(text: string): string | null {
  return text.match(/\b\d+-\d+(?:-\d+)?(?:\s*\(\d+\s*NC\))?/i)?.[0] ?? null;
}

function absoluteUfcUrl(value: string | null | undefined): string | null {
  const raw = cleanText(value);
  if (!raw || raw.startsWith("data:")) return null;
  const first = raw.split(",")[0]?.trim().split(/\s+/)[0] ?? raw;
  if (!first || /placeholder|blank\.png|transparent/i.test(first)) return null;
  if (first.startsWith("//")) return `https:${first}`;
  if (first.startsWith("/")) return `${UFC}${first}`;
  if (/^https?:\/\//i.test(first)) return first.replace(/^http:\/\//i, "https://");
  return null;
}

function athleteFromCard($: cheerio.CheerioAPI, el: Parameters<cheerio.CheerioAPI>[0]): Fighter | null {
  const card = $(el);
  const name = cleanText(card.find(".c-listing-athlete__name").first().text());
  if (!name) return null;
  const nickname = cleanText(card.find(".c-listing-athlete__nickname").first().text())?.replace(/^['\"]|['\"]$/g, "") ?? null;
  const division = cleanText(card.find(".c-listing-athlete__title").first().text());
  const record = cleanText(card.find(".c-listing-athlete__record").first().text()) ?? recordFromText(card.text());
  const link = card.find('a[href*="/athlete/"]').first().attr("href") ?? card.closest("a").attr("href");
  const slug = link?.match(/\/athlete\/([^?/#]+)/)?.[1] ?? slugify(name);
  const container = card.closest("article, .c-listing-athlete, .views-row").length
    ? card.closest("article, .c-listing-athlete, .views-row")
    : card.parent();

  const candidates: Array<string | null | undefined> = [];
  container.find("img").each((_, image) => {
    const img = $(image);
    candidates.push(
      img.attr("data-src"),
      img.attr("data-original"),
      img.attr("data-lazy-src"),
      img.attr("src"),
      img.attr("data-srcset"),
      img.attr("srcset"),
    );
  });
  container.find("source").each((_, source) => {
    const node = $(source);
    candidates.push(node.attr("data-srcset"), node.attr("srcset"));
  });
  const image = candidates.map(absoluteUfcUrl).find(Boolean) ?? null;

  return {
    id: slug,
    providerId: null,
    name,
    nickname,
    country: null,
    flag: null,
    image,
    division,
    record,
    ranking: null,
    championStatus: null,
    active: true,
  };
}

function extractLabelValue(text: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escaped}\\s+([^\\n]+)`, "i"));
  return cleanText(match?.[1]);
}

function percentFromText(text: string, label: string): number | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const direct = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*%\\s*${escaped}`, "i"));
  if (direct) return Number(direct[1]);
  const reverse = text.match(new RegExp(`${escaped}[^\\d]{0,30}(\\d+(?:\\.\\d+)?)\\s*%`, "i"));
  return reverse ? Number(reverse[1]) : null;
}

function metricBeforeLabel(text: string, label: string): number | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${escaped}`, "i"));
  return match ? Number(match[1]) : null;
}

function normalizeName(value: string): string {
  return cleanText(value)
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9' -]/gi, "")
    .toLowerCase() ?? "";
}

function mapUfcResult(value: string): FightHistoryResult {
  const result = value.toLowerCase();
  if (result.startsWith("win")) return "WIN";
  if (result.startsWith("loss")) return "LOSS";
  if (result.startsWith("draw")) return "DRAW";
  if (result.startsWith("nc") || result.includes("no contest")) return "NC";
  return "UNKNOWN";
}

function opponentFromMatchup(matchup: string, fighterName: string): string {
  const sides = matchup.split(/\s+vs\.?\s+/i).map((side) => cleanText(side)).filter(Boolean) as string[];
  if (sides.length !== 2) return matchup;
  const fighterNormalized = normalizeName(fighterName);
  const lastName = fighterNormalized.split(/\s+/).filter(Boolean).at(-1) ?? fighterNormalized;
  const firstMatches = normalizeName(sides[0]).includes(lastName);
  const secondMatches = normalizeName(sides[1]).includes(lastName);
  if (firstMatches && !secondMatches) return sides[1];
  if (secondMatches && !firstMatches) return sides[0];
  return sides[1];
}

function parseUfcHistoryFromHtml(html: string, fighterName: string, pageNumber: number): FighterFightHistoryItem[] {
  const $ = cheerio.load(html);
  const compact = $("body").text().replace(/\r/g, " ").replace(/\s+/g, " ");
  const lower = compact.toLowerCase();
  const start = lower.indexOf("athlete record");
  if (start < 0) return [];
  const info = lower.indexOf(" info ", start + 14);
  const section = compact.slice(start + 14, info > start ? info : undefined);
  const month = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\.?";
  const pattern = new RegExp(
    `\\b(Win|Loss|Draw|NC|No Contest)\\b\\s+(.+?)\\s+(${month}\\s+\\d{1,2},\\s+\\d{4})\\s+Round\\s+(\\d+)\\s+Time\\s+([0-9:]+)\\s+Method\\s+(.+?)(?=\\s+(?:Watch Replay|Fight Card|Win|Loss|Draw|NC|No Contest|Info)\\b|$)`,
    "gi",
  );

  const items: FighterFightHistoryItem[] = [];
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(section)) !== null) {
    const resultText = cleanText(match[1]) ?? "";
    const matchup = cleanText(match[2]) ?? "";
    const date = cleanText(match[3]);
    const method = cleanText(match[6]?.replace(/\s+Watch Replay.*$/i, ""));
    const opponentName = opponentFromMatchup(matchup, fighterName);
    items.push({
      id: `${pageNumber}-${index}-${slugify(opponentName)}-${slugify(date ?? "date")}`,
      result: mapUfcResult(resultText),
      opponentName,
      opponentId: null,
      eventName: null,
      eventUrl: null,
      date,
      method,
      methodDetail: null,
      round: Number.parseInt(match[4] ?? "", 10) || null,
      time: cleanText(match[5]),
      fightUrl: null,
    });
    index += 1;
  }
  return items;
}

export class UfcProvider implements MMADataProvider {
  private statsHistory = new UfcStatsProvider();

  async getUpcomingEvents(): Promise<Event[]> { return []; }
  async getEvent(): Promise<Event | null> { return null; }
  async getEventFightCard(): Promise<Pick<Event, "mainEvent" | "coMainEvent" | "mainCard" | "prelims" | "earlyPrelims"> | null> { return null; }

  async getFighters(page = 0, division?: string): Promise<PaginatedFighters> {
    const safePage = Math.max(0, Math.min(300, Math.trunc(page)));
    const params = new URLSearchParams({ gender: "All", search: "", page: String(safePage) });
    const html = await fetchHtml(`${UFC}/athletes/all?${params}`, 21600);
    const $ = cheerio.load(html);
    let items = $("div.c-listing-athlete__text").toArray().map((el) => athleteFromCard($, el)).filter((v): v is Fighter => Boolean(v));
    if (division) items = items.filter((fighter) => fighter.division?.toLowerCase() === division.toLowerCase());
    return { items, page: safePage, hasMore: items.length > 0 };
  }

  async searchFighters(query: string): Promise<Fighter[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const html = await fetchHtml(`${UFC}/athletes/all?gender=All&search=${encodeURIComponent(q)}&page=0`, 3600);
    const $ = cheerio.load(html);
    const items = $("div.c-listing-athlete__text").toArray().map((el) => athleteFromCard($, el)).filter((v): v is Fighter => Boolean(v));
    const needle = q.toLocaleLowerCase();
    return items.filter((fighter) => fighter.name.toLocaleLowerCase().includes(needle) || fighter.nickname?.toLocaleLowerCase().includes(needle)).slice(0, 12);
  }

  private async fighterPage(id: string): Promise<{ fighter: Fighter; stats: FighterStats; html: string } | null> {
    if (!/^[a-z0-9-]+$/i.test(id)) return null;
    const html = await fetchHtml(`${UFC}/athlete/${encodeURIComponent(id)}`, 21600);
    const $ = cheerio.load(html);
    const name = cleanText($("h1").first().text());
    if (!name) return null;
    const body = $("body").text().replace(/\r/g, "").replace(/[ \t]+/g, " ");
    const compact = body.replace(/\s+/g, " ");
    const division = cleanText($("body").text().match(/([^\n]+ Division)/i)?.[1])?.replace(/\s+Division$/i, "") ?? null;
    const record = recordFromText(compact);
    const profileImage = absoluteUfcUrl($("meta[property='og:image']").attr("content"));
    const matchingImage = $("img").filter((_, element) => ($(element).attr("alt") ?? "").toLowerCase().includes(name.toLowerCase())).first();
    const image = profileImage
      ?? absoluteUfcUrl(matchingImage.attr("data-src"))
      ?? absoluteUfcUrl(matchingImage.attr("src"))
      ?? absoluteUfcUrl(matchingImage.attr("srcset"));
    const nickname = cleanText($(".field--name-nickname, .c-bio__nickname").first().text())?.replace(/^['\"]|['\"]$/g, "") ?? null;
    const country = extractLabelValue(body, "Place of Birth");
    const rankingMatch = compact.match(/#(\d+)\s+(?:PFP|[A-Za-z'’ -]+ Division)/i);

    // UFC profiles explicitly use "Title Holder" for current champions.
    // Do not match the generic word "Champion", which appears in unrelated page copy.
    const champion = /\bTitle Holder\b/i.test(compact) ? "CHAMPION" as const : null;
    const fighter: Fighter = {
      id,
      providerId: null,
      name,
      nickname,
      country,
      flag: null,
      image,
      division,
      record,
      ranking: rankingMatch ? Number(rankingMatch[1]) : null,
      championStatus: champion,
      active: /\bActive\b/i.test(compact),
    };

    const winsKo = compact.match(/(\d+)\s+Wins by Knockout/i)?.[1];
    const winsSub = compact.match(/(\d+)\s+Wins by Submission/i)?.[1];
    const streak = compact.match(/(\d+)\s+Fight Win Streak/i)?.[1];
    const stats: FighterStats = {
      age: parseNumber(extractLabelValue(body, "Age")),
      height: extractLabelValue(body, "Height"),
      weight: extractLabelValue(body, "Weight"),
      reach: extractLabelValue(body, "Reach"),
      stance: extractLabelValue(body, "Stance") ?? extractLabelValue(body, "Fighting style"),
      slpm: metricBeforeLabel(compact, "Sig. Str. Landed Per Min"),
      strikingAccuracy: percentFromText(compact, "Striking accuracy") ?? (() => {
        const landed = parseNumber(extractLabelValue(body, "Sig. Strikes Landed"));
        const attempted = parseNumber(extractLabelValue(body, "Sig. Strikes Attempted"));
        return landed !== null && attempted ? Math.round((landed / attempted) * 1000) / 10 : null;
      })(),
      sapm: metricBeforeLabel(compact, "Sig. Str. Absorbed Per Min"),
      strikingDefense: percentFromText(compact, "Sig. Str. Defense"),
      takedownAverage: metricBeforeLabel(compact, "Takedown avg Per 15 Min"),
      takedownAccuracy: percentFromText(compact, "Takedown Accuracy") ?? (() => {
        const landed = parseNumber(extractLabelValue(body, "Takedowns Landed"));
        const attempted = parseNumber(extractLabelValue(body, "Takedowns Attempted"));
        return landed !== null && attempted ? Math.round((landed / attempted) * 1000) / 10 : null;
      })(),
      takedownDefense: percentFromText(compact, "Takedown Defense"),
      submissionAverage: metricBeforeLabel(compact, "Submission avg Per 15 Min"),
      koWins: winsKo ? Number(winsKo) : null,
      submissionWins: winsSub ? Number(winsSub) : null,
      decisionWins: null,
      winStreak: streak ? Number(streak) : null,
      fightBonuses: null,
    };
    return { fighter, stats, html };
  }

  async getFighter(id: string): Promise<Fighter | null> {
    return (await this.fighterPage(id))?.fighter ?? null;
  }

  async getFighterStats(id: string): Promise<FighterStats | null> {
    return (await this.fighterPage(id))?.stats ?? null;
  }

  async getFighterHistory(id: string): Promise<FighterFightHistoryItem[]> {
    const page = await this.fighterPage(id);
    if (!page?.fighter.name) return [];

    const unique = new Map<string, FighterFightHistoryItem>();
    const addItems = (items: FighterFightHistoryItem[]) => {
      for (const item of items) {
        const key = `${normalizeName(item.opponentName)}|${item.date ?? ""}|${item.method ?? ""}|${item.round ?? ""}|${item.time ?? ""}`;
        if (!unique.has(key)) unique.set(key, item);
      }
    };

    addItems(parseUfcHistoryFromHtml(page.html, page.fighter.name, 0));

    const historyPages = await Promise.allSettled(
      Array.from({ length: 4 }, (_, index) => index + 1).map(async (pageNumber) => ({
        pageNumber,
        html: await fetchHtml(`${UFC}/athlete/${encodeURIComponent(id)}?page=${pageNumber}`, 21600),
      })),
    );
    for (const result of historyPages) {
      if (result.status !== "fulfilled") continue;
      addItems(parseUfcHistoryFromHtml(result.value.html, page.fighter.name, result.value.pageNumber));
    }

    if (unique.size) return [...unique.values()];

    // Secondary free source only when UFC.com did not expose athlete-record rows.
    try {
      return await this.statsHistory.getFighterHistoryByName(page.fighter.name);
    } catch {
      return [];
    }
  }

  async getRankings(): Promise<Ranking[]> {
    const html = await fetchHtml(`${UFC}/rankings`, 21600);
    const $ = cheerio.load(html);
    const rankings: Ranking[] = [];
    const seen = new Set<string>();

    $("h2, h3, h4").each((_, heading) => {
      const division = cleanText($(heading).text());
      if (!division || !DIVISIONS.some((item) => item.toLowerCase() === division.toLowerCase()) || seen.has(division)) return;
      seen.add(division);
      const container = $(heading).closest("section, .view-grouping, .views-element-container, .c-listing").first();
      const scope = container.length ? container : $(heading).parent();
      const links = scope.find('a[href*="/athlete/"]').toArray();
      const unique: Fighter[] = [];
      const slugs = new Set<string>();
      for (const link of links) {
        const name = cleanText($(link).text());
        const href = $(link).attr("href") ?? "";
        const slug = href.match(/\/athlete\/([^?/#]+)/)?.[1];
        if (!name || !slug || slugs.has(slug)) continue;
        slugs.add(slug);
        unique.push({ id: slug, providerId: null, name, nickname: null, country: null, flag: null, image: null, division, record: null, ranking: null, championStatus: null, active: true });
      }
      if (!unique.length) return;
      const text = scope.text();
      const hasExplicitChampionLabel = /\bChampion\b/i.test(text);
      const champion = hasExplicitChampionLabel ? { ...unique[0], championStatus: "CHAMPION" as const } : null;
      const ranked = champion ? unique.slice(1, 16) : unique.slice(0, 15);
      rankings.push({
        division: { id: slugify(division), name: division },
        champion,
        entries: ranked.map((fighter, index) => ({ rank: index + 1, fighter: { ...fighter, ranking: index + 1 } })),
        lastUpdated: new Date().toISOString(),
      });
    });

    return rankings;
  }

  async getRankingsByDivision(division: string): Promise<Ranking | null> {
    const all = await this.getRankings();
    const needle = decodeURIComponent(division).toLowerCase();
    return all.find((ranking) => ranking.division.id === needle || ranking.division.name.toLowerCase() === needle) ?? null;
  }

  async search(query: string): Promise<SearchResults> {
    return { fighters: await this.searchFighters(query), events: [] };
  }
}
