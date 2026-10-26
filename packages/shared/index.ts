import { cardKinds, serviceIds, type Card, type EventId } from "./content";
import { z } from "zod";
import {
  economyCommands,
  type Mode,
  type TradeOffer,
  type Contract,
  type BankLoan,
  type Auction,
  type PlayerStats,
  type MarketEvent,
  type DuePayment,
} from "./economy";
export const colors = [
  "#eab66d",
  "#66c8c6",
  "#ab91df",
  "#ed8b86",
  "#a7c877",
  "#7da7db",
  "#df86ba",
  "#ddc75e",
  "#73b393",
  "#d49970",
  "#99a0e0",
  "#bcdaae",
  "#e79eaf",
  "#a4ceda",
  "#c4bda4",
];
export const districts = [
  { name: "Harbor Row", color: "#5c7afa" },
  { name: "Old Town", color: "#ed895f" },
  { name: "Neon Mile", color: "#e95aa6" },
  { name: "Innovation Park", color: "#8a69df" },
  { name: "Financial Core", color: "#ffbf60" },
  { name: "Greenbelt", color: "#44a5df" },
  { name: "Skyline", color: "#c69ef4" },
  { name: "Crown District", color: "#f46164" },
];
export type Tile = {
  id: number;
  name: string;
  district: number;
  type:
    "property" | "hq" | "opportunity" | "tax" | "civic" | "transit" | "utility";
  x: number;
  z: number;
  next: number[];
  price: number;
  base: number;
  owner: string | null;
  level: number;
};
export function createBoard(): Tile[] {
  const names = [
    ["Dockside Works", "Ocean Exchange", "Ferry Terminal", "Harbor House"],
    ["Foundry Square", "Clocktower Café", "Brick & Co.", "Heritage Court"],
    ["Neon Plaza", "Velvet Theater", "Midnight Arcade", "Crown Arena"],
    ["Quantum Labs", "Vector Campus", "Data Foundry", "Circuit House"],
    ["Apex Bank", "Exchange Tower", "Capital Square", "Sterling Offices"],
    ["Willow Gardens", "Solar Commons", "Canopy House", "Verdant Court"],
    ["Cloud Nine", "Horizon Residences", "Aerial Tower", "Skyline Terrace"],
    ["Embassy Row", "Royal Arcade", "Crown Estate", "Sovereign Hall"],
  ];
  const board: Tile[] = [];
  for (let d = 0; d < 8; d++)
    for (let j = 0; j < 5; j++) {
      const id = d * 5 + j,
        a = (id / 40) * Math.PI * 2;
      const type =
        j === 0
          ? (
              [
                "hq",
                "opportunity",
                "transit",
                "utility",
                "tax",
                "civic",
                "opportunity",
                "transit",
              ] as const
            )[d]
          : "property";
      board.push({
        id,
        name:
          j === 0
            ? [
                "Empire HQ",
                "Opportunity",
                "Central Station",
                "City Energy",
                "City Levy",
                "City Hall",
                "Opportunity",
                "Skyline Station",
              ][d]
            : names[d][j - 1],
        district: d,
        type,
        x: Math.sin(a) * 12,
        z: Math.cos(a) * 12,
        next: [(id + 1) % 40],
        price: 180 + d * 65 + j * 25,
        base: 28 + d * 9 + j * 4,
        owner: null,
        level: 0,
      });
    }
  // Interior streets are playable shortcuts, not a second board.
  for (let j = 0; j < 4; j++) {
    const id = 40 + j;
    board.push({
      id,
      name: [
        "Metro Exchange",
        "Innovation Station",
        "Civic Gardens",
        "Grand Central",
      ][j],
      district: j * 2,
      type: j === 2 ? "civic" : "transit",
      x: Math.sin((j * Math.PI) / 2) * 4,
      z: Math.cos((j * Math.PI) / 2) * 4,
      next: [(j * 10 + 10) % 40],
      price: 320,
      base: 48,
      owner: null,
      level: 0,
    });
    board[j * 10].next.push(id);
  }
  return board;
}
export { tokens, characters, character, type Token } from "./characters";
import type { Token } from "./characters";
export type Player = {
  id: string;
  name: string;
  token: Token;
  color: string;
  connected: boolean;
  ready: boolean;
  bot?: boolean;
  eliminated: boolean;
  cash: number;
  position: number;
  momentum: number;
  cards: Card[];
  shield: number;
  buildCredit: number;
  purchaseCredit: number;
  moveBonus: number;
  serviceRound: number;
  detention: { turns: number; bail: number } | null;
};
export type Phase =
  | "LOBBY"
  | "PLANNING"
  | "ROLL"
  | "ROUTE_CHOICE"
  | "PURCHASE_DECISION"
  | "DETENTION"
  | "ENCOUNTER"
  | "TURN_END"
  | "FINANCIAL_CRISIS"
  | "AUCTION"
  | "GAME_OVER";
export type State = {
  version: number;
  phase: Phase;
  round: number;
  players: Player[];
  host: string | null;
  current: number;
  board: Tile[];
  dice: number[];
  lastRoll: {
    id: number;
    playerId: string;
    dice: number[];
    bonus?: number;
  } | null;
  planningReady: string[];
  cityEvent: EventId | null;
  nextCityEvent: EventId | null;
  encounter: { index: number; playerId: string } | null;
  lastEscort: { id: number; playerId: string; from: number } | null;
  path: number[];
  remaining: number;
  deadline: number;
  turnDeadline: number;
  crisisTurnRemainingMs: number;
  pausedTimers: { decision: number; turn: number } | null;
  paused: boolean;
  log: { id: number; text: string }[];
  simulation: { autoplay: boolean; speed: "NORMAL" | "FAST" };
  reactions: Record<string, { emoji: string; until: number }>;
  winner: string | null;
  mode: Mode;
  offers: TradeOffer[];
  contracts: Contract[];
  loans: BankLoan[];
  auction: Auction | null;
  crisisResume: "planning" | "encounter" | "finish";
  stats: Record<string, PlayerStats>;
  lastMarketEvent: MarketEvent | null;
  lastSettledRound: number;
  arrears: DuePayment[];
};
export const commandSchema = z.discriminatedUnion("type", [
  ...economyCommands,
  z.object({ type: z.literal("READY") }),
  z.object({ type: z.literal("PAY_BAIL") }),
  z.object({ type: z.literal("SERVE_TIME") }),
  z.object({
    type: z.literal("CHOOSE_ENCOUNTER"),
    choice: z.number().int().min(-1).max(1),
  }),
  z.object({ type: z.literal("DISCARD_CARD"), id: z.string().min(1).max(120) }),
  z.object({ type: z.literal("USE_CARD"), id: z.string().min(1).max(120) }),
  z.object({
    type: z.literal("VISIT_SERVICE"),
    service: z.enum(serviceIds),
    card: z.enum(cardKinds).optional(),
  }),
  z.object({ type: z.literal("FINISH_PLANNING") }),
  z.object({ type: z.literal("RESUME_PLANNING") }),
  z.object({ type: z.literal("START") }),
  z.object({ type: z.literal("ROLL") }),
  z.object({ type: z.literal("BUY") }),
  z.object({ type: z.literal("DECLINE") }),
  z.object({ type: z.literal("END") }),
  z.object({ type: z.literal("PAUSE") }),
  z.object({ type: z.literal("RESUME") }),
  z.object({ type: z.literal("RESTART") }),
  z.object({ type: z.literal("SKIP") }),
  z.object({ type: z.literal("BANKRUPT") }),
  z.object({ type: z.literal("ROUTE"), tile: z.number().int().min(0).max(43) }),
  z.object({
    type: z.literal("DEVELOP"),
    tile: z.number().int().min(0).max(43),
  }),
  z.object({ type: z.literal("SELL"), tile: z.number().int().min(0).max(43) }),
  z.object({ type: z.literal("ADD_BOT") }),
  z.object({ type: z.literal("REMOVE_BOT"), id: z.string() }),
  z.object({
    type: z.literal("SIMULATION"),
    autoplay: z.boolean(),
    speed: z.enum(["NORMAL", "FAST"]),
  }),
  z.object({
    type: z.literal("REACTION"),
    emoji: z.enum(["😂", "💀", "🤝", "🔥", "👀", "📈"]),
  }),
]);
export type Command = z.infer<typeof commandSchema>;
