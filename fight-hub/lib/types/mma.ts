export type EventStatus = "CONFIRMED" | "UPCOMING" | "LIVE" | "FINAL" | "UNKNOWN";
export type CardType = "MAIN_CARD" | "PRELIMS" | "EARLY_PRELIMS" | "UNKNOWN";

export interface Venue {
  name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Fighter {
  id: string;
  providerId?: string | null;
  name: string;
  nickname: string | null;
  country: string | null;
  flag: string | null;
  image: string | null;
  division: string | null;
  record: string | null;
  ranking: number | null;
  championStatus: "CHAMPION" | "INTERIM" | null;
  active?: boolean | null;
}

export interface FighterStats {
  age: number | null;
  height: string | null;
  weight: string | null;
  reach: string | null;
  stance: string | null;
  slpm: number | null;
  strikingAccuracy: number | null;
  sapm: number | null;
  strikingDefense: number | null;
  takedownAverage: number | null;
  takedownAccuracy: number | null;
  takedownDefense: number | null;
  submissionAverage: number | null;
  koWins: number | null;
  submissionWins: number | null;
  decisionWins: number | null;
  winStreak: number | null;
  fightBonuses: number | null;
}


export type FightHistoryResult = "WIN" | "LOSS" | "DRAW" | "NC" | "UNKNOWN";

export interface FighterFightHistoryItem {
  id: string;
  result: FightHistoryResult;
  opponentName: string;
  opponentId: string | null;
  eventName: string | null;
  eventUrl: string | null;
  date: string | null;
  method: string | null;
  methodDetail: string | null;
  round: number | null;
  time: string | null;
  fightUrl: string | null;
}

export interface FightResult {
  method: string | null;
  round: number | null;
  time: string | null;
  winnerId: string | null;
}

export interface Fight {
  fightId: string;
  fighterRed: Fighter;
  fighterBlue: Fighter;
  weightClass: string | null;
  isTitleFight: boolean;
  isInterimTitleFight: boolean;
  rounds: number | null;
  status: string;
  order: number;
  cardType: CardType;
  isMainEvent: boolean;
  isCoMainEvent: boolean;
  result?: FightResult | null;
}

export interface Event {
  id: string;
  name: string;
  shortName: string | null;
  eventNumber: string | null;
  promotion: string;
  status: EventStatus;
  date: string;
  startTime: string | null;
  timezone: string | null;
  venue: Venue;
  bannerImage: string | null;
  posterImage: string | null;
  broadcast: string[];
  isOfficial: boolean;
  lastUpdated: string;
  mainEvent: Fight | null;
  coMainEvent: Fight | null;
  mainCard: Fight[];
  prelims: Fight[];
  earlyPrelims: Fight[];
}

export interface Division {
  id: string;
  name: string;
}

export interface RankingEntry {
  rank: number;
  fighter: Fighter;
}

export interface Ranking {
  division: Division;
  champion: Fighter | null;
  entries: RankingEntry[];
  lastUpdated: string;
}

export interface PaginatedFighters {
  items: Fighter[];
  page: number;
  hasMore: boolean;
}

export interface SearchResults {
  fighters: Fighter[];
  events: Event[];
}
