import * as cheerio from "cheerio";
import { fetchHtmlFresh, fetchJson } from "@/lib/api/fetch";
import type { FighterFightHistoryItem, FightHistoryResult } from "@/lib/types/mma";
import { slugify } from "@/lib/utils/text";

const ESPN_SEARCH = "https://site.web.api.espn.com/apis/common/v3/search";
const ESPN = "https://www.espn.com";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9' -]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function mapResult(value: string): FightHistoryResult {
  const token = value.trim().toUpperCase();
  if (token === "W" || token === "WIN") return "WIN";
  if (token === "L" || token === "LOSS" || token === "LOST") return "LOSS";
  if (token === "D" || token === "DRAW") return "DRAW";
  if (token === "NC" || token.includes("NO CONTEST")) return "NC";
  return "UNKNOWN";
}

function parseRound(value: string): number | null {
  const n = Number.parseInt(value.trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function absoluteEspnUrl(value: string | undefined): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value.replace(/^http:\/\//i, "https://");
  if (value.startsWith("/")) return `${ESPN}${value}`;
  return null;
}

/**
 * ESPN publishes a dedicated Fight History table for MMA athletes.  This
 * adapter reads the result column from the fighter's own history page, so W/L
 * is already from the perspective of the profile being viewed.
 */
export class EspnHistoryProvider {
  private async findEspnAthleteId(fighterName: string): Promise<string | null> {
    const raw = await fetchJson<unknown>(
      `${ESPN_SEARCH}?query=${encodeURIComponent(fighterName)}&limit=25`,
      86400,
    );

    if (!isRecord(raw)) return null;
    const items = Array.isArray(raw.items) ? raw.items : [];
    const target = normalizeName(fighterName);

    const candidates = items
      .filter(isRecord)
      .map((item) => {
        const displayName = text(item.displayName) || text(item.name) || text(item.shortName);
        const id = text(item.id);
        const type = text(item.type).toLowerCase();
        const sport = text(item.sport).toLowerCase();
        const league = text(item.league).toLowerCase();
        const normalized = normalizeName(displayName);
        let score = 0;
        if (normalized === target) score += 100;
        else if (normalized.startsWith(target) || target.startsWith(normalized)) score += 60;
        else if (normalized.includes(target) || target.includes(normalized)) score += 40;
        if (type === "athlete" || type === "player") score += 20;
        if (sport === "mma") score += 20;
        if (league === "ufc" || league.includes("ufc")) score += 10;
        return { id, displayName, score };
      })
      .filter((candidate) => candidate.id && candidate.displayName && candidate.score > 0)
      .sort((a, b) => b.score - a.score);

    return candidates[0]?.id ?? null;
  }

  private parseHistoryHtml(html: string): FighterFightHistoryItem[] {
    const $ = cheerio.load(html);
    const history: FighterFightHistoryItem[] = [];
    const seen = new Set<string>();

    $("table").each((_, table) => {
      const headers = $(table)
        .find("thead th")
        .toArray()
        .map((node) => $(node).text().replace(/\s+/g, " ").trim().toLowerCase());

      const joinedHeaders = headers.join(" | ");
      const looksLikeHistory =
        (joinedHeaders.includes("opponent") || joinedHeaders.includes("oponente")) &&
        (joinedHeaders.includes("res") || joinedHeaders.includes("result")) &&
        (joinedHeaders.includes("event") || joinedHeaders.includes("evento"));

      if (!looksLikeHistory) return;

      const indexOf = (...needles: string[]) =>
        headers.findIndex((header) => needles.some((needle) => header.includes(needle)));

      const dateIndex = indexOf("date", "fecha");
      const opponentIndex = indexOf("opponent", "oponente");
      const resultIndex = indexOf("res", "result");
      const methodIndex = indexOf("decision", "decisión", "method", "método");
      const roundIndex = indexOf("rnd", "round");
      const timeIndex = indexOf("time", "tiempo");
      const eventIndex = indexOf("event", "evento");

      $(table)
        .find("tbody tr")
        .each((rowIndex, row) => {
          const cells = $(row).find("td").toArray();
          if (!cells.length || opponentIndex < 0 || resultIndex < 0) return;

          const getCell = (index: number) =>
            index >= 0 && cells[index]
              ? $(cells[index]).text().replace(/\s+/g, " ").trim()
              : "";

          const opponentName = getCell(opponentIndex);
          const result = mapResult(getCell(resultIndex));
          if (!opponentName || result === "UNKNOWN") return;

          const date = getCell(dateIndex) || null;
          const method = getCell(methodIndex) || null;
          const round = parseRound(getCell(roundIndex));
          const time = getCell(timeIndex) || null;
          const eventName = getCell(eventIndex) || null;
          const eventLink = eventIndex >= 0 && cells[eventIndex]
            ? absoluteEspnUrl($(cells[eventIndex]).find("a").first().attr("href"))
            : null;
          const opponentLink = absoluteEspnUrl($(cells[opponentIndex]).find("a").first().attr("href"));
          const opponentId = opponentLink
            ? opponentLink.match(/\/id\/(\d+)\/?(?:[^/?#]+)?/)?.[1] ?? slugify(opponentName)
            : slugify(opponentName);

          const id = `${date ?? "date"}-${opponentName}-${rowIndex}`;
          if (seen.has(id)) return;
          seen.add(id);

          history.push({
            id,
            result,
            opponentName,
            opponentId,
            eventName,
            eventUrl: eventLink,
            date,
            method,
            methodDetail: null,
            round,
            time,
            fightUrl: null,
          });
        });
    });

    // ESPN sometimes renders responsive tables without a thead.  Keep a very
    // conservative fallback: only rows with exactly the visible history shape
    // Date | Opponent | Res. | Decision | Rnd | Time | Event are accepted.
    if (!history.length) {
      $("tr").each((rowIndex, row) => {
        const cells = $(row).find("td").toArray();
        if (cells.length < 7) return;
        const values = cells.map((cell) => $(cell).text().replace(/\s+/g, " ").trim());
        const result = mapResult(values[2] ?? "");
        if (result === "UNKNOWN" || !values[1]) return;
        const date = values[0] || null;
        const opponentName = values[1];
        const id = `${date ?? "date"}-${opponentName}-${rowIndex}`;
        if (seen.has(id)) return;
        seen.add(id);
        history.push({
          id,
          result,
          opponentName,
          opponentId: slugify(opponentName),
          eventName: values[6] || null,
          eventUrl: absoluteEspnUrl($(cells[6]).find("a").first().attr("href")),
          date,
          method: values[3] || null,
          methodDetail: null,
          round: parseRound(values[4] ?? ""),
          time: values[5] || null,
          fightUrl: null,
        });
      });
    }

    return history;
  }

  async getFighterHistoryByName(fighterName: string): Promise<FighterFightHistoryItem[]> {
    const athleteId = await this.findEspnAthleteId(fighterName);
    if (!athleteId) return [];

    const slug = slugify(fighterName);
    const url = `${ESPN}/mma/fighter/history/_/id/${encodeURIComponent(athleteId)}/${slug}`;
    const html = await fetchHtmlFresh(url);
    return this.parseHistoryHtml(html);
  }
}
