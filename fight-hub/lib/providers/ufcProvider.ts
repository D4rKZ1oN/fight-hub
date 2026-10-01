import * as cheerio from "cheerio";
import { fetchHtml } from "@/lib/api/fetch";
import type { MMADataProvider } from "./MMADataProvider";
import type { Event, Fighter, FighterStats, PaginatedFighters, Ranking, SearchResults } from "@/lib/types/mma";
import { cleanText, parseNumber, slugify } from "@/lib/utils/text";

const UFC = "https://www.ufc.com";
const DIVISIONS = [
  "Men's Pound-for-Pound Top Rank", "Women's Pound-for-Pound Top Rank", "Flyweight", "Bantamweight", "Featherweight", "Lightweight", "Welterweight", "Middleweight", "Light Heavyweight", "Heavyweight", "Women's Strawweight", "Women's Flyweight", "Women's Bantamweight",
];

function recordFromText(text: string): string | null {
  return text.match(/\b\d+-\d+(?:-\d+)?(?:\s*\(\d+\s*NC\))?/i)?.[0] ?? null;
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
  const container = card.closest("article, .c-listing-athlete, .views-row");
  const image = container.find("img").first().attr("src") ?? container.find("img").first().attr("data-src") ?? null;
  return { id: slug, providerId: null, name, nickname, country: null, flag: null, image, division, record, ranking: null, championStatus: null, active: true };
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

export class UfcProvider implements MMADataProvider {
  async getUpcomingEvents(): Promise<Event[]> { return []; }
  async getEvent(): Promise<Event | null> { return null; }
  async getEventFightCard(): Promise<Pick<Event, "mainEvent" | "coMainEvent" | "mainCard" | "prelims" | "earlyPrelims"> | null> { return null; }

  async getFighters(page = 0, division?: string): Promise<PaginatedFighters> {
    const safePage = Math.max(0, Math.min(300, Math.trunc(page)));
    const params = new URLSearchParams({ gender: "All", search: "", page: String(safePage) });
    const html = await fetchHtml(`${UFC}/athletes/all?${params}`, 21600);
    const $ = cheerio.load(html);
    let items = $("div.c-listing-athlete__text").toArray().map((el) => athleteFromCard($, el)).filter((v): v is Fighter => Boolean(v));
    if (division) items = items.filter((f) => f.division?.toLowerCase() === division.toLowerCase());
    return { items, page: safePage, hasMore: items.length > 0 };
  }

  async searchFighters(query: string): Promise<Fighter[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const html = await fetchHtml(`${UFC}/athletes/all?gender=All&search=${encodeURIComponent(q)}&page=0`, 3600);
    const $ = cheerio.load(html);
    const items = $("div.c-listing-athlete__text").toArray().map((el) => athleteFromCard($, el)).filter((v): v is Fighter => Boolean(v));
    const needle = q.toLocaleLowerCase();
    return items.filter((f) => f.name.toLocaleLowerCase().includes(needle) || f.nickname?.toLocaleLowerCase().includes(needle)).slice(0, 12);
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
    const image = $('meta[property="og:image"]').attr("content") ?? $("img").filter((_, el) => ($(el).attr("alt") ?? "").toLowerCase().includes(name.toLowerCase())).first().attr("src") ?? null;
    const nickname = cleanText($(".field--name-nickname, .c-bio__nickname").first().text())?.replace(/^['\"]|['\"]$/g, "") ?? null;
    const country = extractLabelValue(body, "Place of Birth");
    const rankingMatch = compact.match(/#(\d+)\s+(?:PFP|[A-Za-z'’ -]+ Division)/i);
    const champion = /Title Holder|Champion/i.test(compact) ? "CHAMPION" as const : null;
    const fighter: Fighter = { id, providerId: null, name, nickname, country, flag: null, image, division, record, ranking: rankingMatch ? Number(rankingMatch[1]) : null, championStatus: champion, active: /\bActive\b/i.test(compact) };

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

  async getFighter(id: string): Promise<Fighter | null> { return (await this.fighterPage(id))?.fighter ?? null; }
  async getFighterStats(id: string): Promise<FighterStats | null> { return (await this.fighterPage(id))?.stats ?? null; }

  async getRankings(): Promise<Ranking[]> {
    const html = await fetchHtml(`${UFC}/rankings`, 21600);
    const $ = cheerio.load(html);
    const rankings: Ranking[] = [];
    const seen = new Set<string>();

    $("h2, h3, h4").each((_, heading) => {
      const division = cleanText($(heading).text());
      if (!division || !DIVISIONS.some((d) => d.toLowerCase() === division.toLowerCase()) || seen.has(division)) return;
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
      const championName = /Champion/i.test(text) ? unique[0]?.name ?? null : null;
      const champion = championName ? { ...unique[0], championStatus: "CHAMPION" as const } : null;
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
    return all.find((r) => r.division.id === needle || r.division.name.toLowerCase() === needle) ?? null;
  }

  async search(query: string): Promise<SearchResults> { return { fighters: await this.searchFighters(query), events: [] }; }
}
