import { z } from "zod";

export const modes = {
  CAPITAL: {
    name: "Capital Race",
    rounds: 12,
    cash: 1800,
    detail: "12 rounds. Highest net empire value wins.",
  },
  BLITZ: {
    name: "Blitz",
    rounds: 8,
    cash: 2400,
    detail:
      "8 rounds, $2,400 starting cash and 25% cheaper building. Same generous timers.",
  },
  DOMINATION: {
    name: "Domination",
    rounds: 30,
    cash: 1800,
    detail:
      "Last solvent player wins early. At 30 rounds, highest net empire wins. City fees rise after round 12.",
  },
} as const;
export type Mode = keyof typeof modes;
const amount = z.number().int().min(0).max(100000);
const positive = amount.min(1);
const tile = z.number().int().min(0).max(43);
const side = z.enum(["from", "to"]);
const duration = z.number().int().min(1).max(3);
export const clauseSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("payment"),
    giver: side,
    amount: positive,
    rounds: duration,
  }),
  z.object({
    kind: z.literal("loan"),
    giver: side,
    principal: positive,
    amount: positive,
    rounds: duration,
  }),
  z.object({
    kind: z.literal("revenue"),
    giver: side,
    tile,
    percent: z.number().int().min(10).max(50),
    rounds: duration,
  }),
  z.object({
    kind: z.literal("immunity"),
    giver: side,
    district: z.number().int().min(0).max(7),
    uses: z.number().int().min(1).max(2),
  }),
  z.object({
    kind: z.literal("option"),
    giver: side,
    tile,
    amount: positive,
    rounds: duration,
  }),
]);
export type Clause = z.infer<typeof clauseSchema>;
export const basketSchema = z.object({
  cash: amount,
  tiles: z.array(tile).max(43),
});
export const offerSchema = z.object({
  to: z.string().min(1).max(128),
  give: basketSchema,
  take: basketSchema,
  clauses: z.array(clauseSchema).max(3),
  counter: z.string().max(160).optional(),
});
export type OfferDraft = z.infer<typeof offerSchema>;
export type TradeOffer = OfferDraft & {
  id: string;
  from: string;
  expiresRound: number;
};
export type Contract = { id: string } & (
  | {
      kind: "payment" | "loan";
      payer: string;
      payee: string;
      amount: number;
      dueRound: number;
    }
  | {
      kind: "revenue";
      owner: string;
      beneficiary: string;
      tile: number;
      percent: number;
      expiresRound: number;
    }
  | {
      kind: "immunity";
      owner: string;
      beneficiary: string;
      district: number;
      remaining: number;
    }
  | {
      kind: "option";
      owner: string;
      beneficiary: string;
      tile: number;
      amount: number;
      expiresRound: number;
    }
);
export type BankLoan = {
  id: string;
  borrower: string;
  balance: number;
  rate: number;
  issuedRound: number;
  dueRound: number;
  collateral: number[];
};
/** Cash already reflects this shortfall; recipients receive only funded payments. */
export type DuePayment = {
  payer: string;
  payee: string | null;
  amount: number;
  reason: "rent" | "contract" | "bank" | "tax";
  collateral?: number[];
  rent?: {
    owner: string;
    beneficiary?: string;
    percent: number;
    received: number;
  };
};
export type Auction = {
  id: string;
  tile: number;
  seller: string | null;
  bid: number;
  bidder: string | null;
  passed: string[];
  passedAtBid?: number;
  resume: "encounter" | "crisis";
  turnRemainingMs?: number;
  crisisRemainingMs?: number;
};
export type MarketEvent = {
  id: number;
  kind: "trade" | "auction" | "loan" | "option";
  player: string;
  tile?: number;
  amount?: number;
};
export type PlayerStats = {
  trades: number;
  auctions: number;
  rent: number;
  interest: number;
  defaults: number;
  lastOfferRound: number;
};
export const emptyStats = (): PlayerStats => ({
  trades: 0,
  auctions: 0,
  rent: 0,
  interest: 0,
  defaults: 0,
  lastOfferRound: 0,
});
export const economyCommands = [
  z.object({
    type: z.literal("SET_MODE"),
    mode: z.enum(["CAPITAL", "BLITZ", "DOMINATION"]),
  }),
  z.object({ type: z.literal("OFFER_TRADE"), offer: offerSchema }),
  z.object({ type: z.literal("ACCEPT_TRADE"), id: z.string().max(160) }),
  z.object({ type: z.literal("REJECT_TRADE"), id: z.string().max(160) }),
  z.object({ type: z.literal("CANCEL_TRADE"), id: z.string().max(160) }),
  z.object({
    type: z.literal("BORROW"),
    amount: positive,
    collateral: z.array(tile).min(1).max(43),
  }),
  z.object({
    type: z.literal("REPAY_LOAN"),
    id: z.string().max(160),
    amount: positive,
  }),
  z.object({
    type: z.literal("REFINANCE"),
    id: z.string().max(160),
    amount: positive,
  }),
  z.object({ type: z.literal("EXERCISE_OPTION"), id: z.string().max(160) }),
  z.object({ type: z.literal("START_AUCTION"), tile }),
  z.object({ type: z.literal("BID"), amount: positive }),
  z.object({ type: z.literal("PASS_AUCTION") }),
] as const;
