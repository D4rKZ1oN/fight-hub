import * as cheerio from "cheerio";
import { fetchHtml } from "@/lib/api/fetch";
import type { FighterFightHistoryItem, FightHistoryResult } from "@/lib/types/mma";

const UFC_STATS = "https://ufcstats.com";

function clean(value: string | undefined | null): string {
  return (value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeName(value: string): string {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9' -]/gi, "")
    .toLowerCase();
}

function slugFromUfcAthleteName(name: string): string {
  return normalizeName(name).replace(/[' ]+/g, "-").replace(/-+/g, "-");
}

function mapResult(value: string): FightHistoryResult {
  const result = clean(value).toLowerCase();
  if (result.startsWith("w")) return "WIN";
  if (result.startsWith("l")) return "LOSS";
  if (result.startsWith("d")) return "DRAW";
  if (result.includes("nc") || result.includes("no contest")) return "NC";
  return "UNKNOWN";
}

function parseRound(value: string): number | null {
  const parsed = Number.parseInt(clean(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * UFCStats exposes a public HTML statistics site with structured fighter tables.
 * This adapter reads only published UFCStats data. It does not invent missing bouts.
 */
export class UfcStatsProvider {
  private async findFighterUrl(fighterName: string): Promise<string | null> {
    const normalized = normalizeName(fighterName);
    const parts = normalized.split(/\s+/).filter(Boolean);
    const lastName = parts.at(-1) ?? "";
    const char = (lastName[0] ?? normalized[0] ?? "a").toLowerCase();
    if (!/^[a-z]$/.test(char)) return null;

    const html = await fetchHtml(`${UFC_STATS}/statistics/fighters?char=${encodeURIComponent(char)}&page=all`, 21600);
    const $ = cheerio.load(html);
    let exact: string | null = null;
    let fallback: string | null = null;

    $("tr.b-statistics__table-row").each((_, row) => {
      const links = $(row).find('a[href*="/fighter-details/"]');
      if (!links.length) return;
      const names = links.toArray().map((el) => clean($(el).text())).filter(Boolean);
      const fullName = clean(names.slice(0, 2).join(" "));
      const href = links.first().attr("href") ?? "";
      if (!href) return;
      const candidate = normalizeName(fullName);
      const safeHref = href.replace(/^http:\/\//i, "https://");
      if (candidate === normalized) exact = safeHref;
      else if (!fallback && (candidate.includes(normalized) || normalized.includes(candidate))) fallback = safeHref;
    });

    return exact ?? fallback;
  }

  async getFighterHistoryByName(fighterName: string): Promise<FighterFightHistoryItem[]> {
    const fighterUrl = await this.findFighterUrl(fighterName);
    if (!fighterUrl) return [];

    const html = await fetchHtml(fighterUrl, 21600);
    const $ = cheerio.load(html);
    const history: FighterFightHistoryItem[] = [];

    $("tr.b-fight-details__table-row.b-fight-details__table-row__hover").each((index, row) => {
      const cells = $(row).find("td").toArray();
      if (cells.length < 10) return;

      const fighterLinks = $(cells[1]).find('a[href*="/fighter-details/"]').toArray();
      const fighterNames = fighterLinks.map((el) => clean($(el).text())).filter(Boolean);
      if (fighterNames.length < 2) return;

      const subjectNormalized = normalizeName(fighterName);
      const firstIsSubject = normalizeName(fighterNames[0]) === subjectNormalized;
      const secondIsSubject = normalizeName(fighterNames[1]) === subjectNormalized;
      let opponentName = fighterNames[1];
      let opponentHref = $(fighterLinks[1]).attr("href") ?? null;
      if (secondIsSubject && !firstIsSubject) {
        opponentName = fighterNames[0];
        opponentHref = $(fighterLinks[0]).attr("href") ?? null;
      }

      const eventLink = $(cells[6]).find('a[href*="/event-details/"]').first();
      const eventName = clean(eventLink.text()) || null;
      const eventUrl = eventLink.attr("href") ?? null;
      const eventLines = $(cells[6]).find("p").toArray().map((el) => clean($(el).text())).filter(Boolean);
      const date = eventLines.find((line) => /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},\s+\d{4}\b/i.test(line)) ?? eventLines.at(-1) ?? null;

      const methodLines = $(cells[7]).find("p").toArray().map((el) => clean($(el).text())).filter(Boolean);
      const method = methodLines[0] ?? (clean($(cells[7]).text()) || null);
      const methodDetail = methodLines.length > 1 ? methodLines.slice(1).join(" · ") : null;
      const result = mapResult($(cells[0]).text());
      const fightUrl = $(row).attr("data-link") ?? null;
      const rawId = fightUrl?.match(/fight-details\/([^/?#]+)/)?.[1] ?? `${index}-${normalizeName(opponentName).replace(/\s+/g, "-")}`;

      history.push({
        id: rawId,
        result,
        opponentName,
        opponentId: opponentHref ? slugFromUfcAthleteName(opponentName) : null,
        eventName,
        eventUrl,
        date,
        method,
        methodDetail,
        round: parseRound($(cells[8]).text()),
        time: clean($(cells[9]).text()) || null,
        fightUrl,
      });
    });

    return history;
  }
}
