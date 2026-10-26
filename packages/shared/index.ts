import { z } from "zod";
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
  { name: "Harbor Row", color: "#74b9c9" },
  { name: "Old Town", color: "#d6926d" },
  { name: "Neon Mile", color: "#bd83c6" },
  { name: "Innovation Park", color: "#6fbcae" },
  { name: "Financial Core", color: "#83a4d0" },
  { name: "Greenbelt", color: "#9cba76" },
  { name: "Skyline", color: "#b3a3d5" },
  { name: "Crown District", color: "#dfba72" },
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
export const tokens = ["rocket", "robot", "cat", "car"] as const;
export type Token = (typeof tokens)[number];
export type Player = {
  id: string;
  name: string;
  token: Token;
  color: string;
  connected: boolean;
  ready: boolean;
  eliminated: boolean;
  cash: number;
  position: number;
  momentum: number;
};
export type Phase =
  | "LOBBY"
  | "PLANNING"
  | "ROLL"
  | "ROUTE_CHOICE"
  | "PURCHASE_DECISION"
  | "TURN_END"
  | "FINANCIAL_CRISIS"
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
  path: number[];
  remaining: number;
  deadline: number;
  paused: boolean;
  log: { id: number; text: string }[];
  chat: { name: string; text: string }[];
  reactions: Record<string, { emoji: string; until: number }>;
  winner: string | null;
};
export const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("READY") }),
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
  z.object({
    type: z.literal("CHAT"),
    text: z.string().trim().min(1).max(280),
  }),
  z.object({
    type: z.literal("REACTION"),
    emoji: z.enum(["😂", "💀", "🤝", "🔥", "👀", "📈"]),
  }),
]);
export type Command = z.infer<typeof commandSchema>;
