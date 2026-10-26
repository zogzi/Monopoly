import { encounters } from "../shared/content";
import { encounterError } from "./engagement";
import { purchaseCost } from "./properties";
import { Game } from "./index";
import {
  controlled,
  developmentCost,
  developmentError,
  revenue,
} from "./properties";
import type { Command, Player, State } from "../shared/index";
import {
  auctionBid,
  emergencyBorrow,
  proposeTrade,
  respondToOffer,
} from "./market-bots";
import { lockedReason } from "./finance";
const automated = (s: State, p: Player) =>
  p.bot || (s.simulation.autoplay && p.id === s.host);
function destinationScore(
  s: State,
  p: Player,
  id: number,
  steps: number,
): number {
  const tile = s.board[id];
  if (steps > 0)
    return Math.max(
      ...tile.next.map((n) => destinationScore(s, p, n, steps - 1)),
    );
  if (tile.owner && tile.owner !== p.id) return -revenue(s, tile);
  if (tile.owner === p.id) return 20;
  if (tile.type === "tax") return -120;
  if (tile.type === "hq") return 200;
  if (tile.type === "opportunity") return 100;
  return p.cash >= tile.price + 200
    ? 80 + controlled(s, p.id, tile.district) * 70
    : 0;
}
export function botCommand(s: State, p: Player): Command | null {
  if (s.phase === "AUCTION") return auctionBid(s, p);
  const canUse =
    [
      "PLANNING",
      "ROLL",
      "PURCHASE_DECISION",
      "TURN_END",
      "FINANCIAL_CRISIS",
      "ENCOUNTER",
      "DETENTION",
    ].includes(s.phase) &&
    (s.phase === "PLANNING" || s.players[s.current]?.id === p.id);
  if (canUse)
    for (const card of p.cards) {
      const k = card.kind;
      if (
        (k === "grant" && p.cash < 900) ||
        (k === "shield" &&
          p.shield === 0 &&
          s.round >= 2 &&
          s.phase !== "FINANCIAL_CRISIS") ||
        (k === "builder" &&
          p.buildCredit < 150 &&
          s.phase === "PLANNING" &&
          s.board.some((t) => controlled(s, p.id, t.district) >= 3)) ||
        (k === "express" && p.moveBonus < 3 && s.phase === "ROLL") ||
        (k === "market" &&
          p.purchaseCredit < 140 &&
          s.phase === "PURCHASE_DECISION")
      )
        return { type: "USE_CARD", id: card.id };
    }
  if (canUse && p.detention) {
    const alibi = p.cards.find((c) => c.kind === "alibi");
    if (alibi) return { type: "USE_CARD", id: alibi.id };
  }
  switch (s.phase) {
    case "DETENTION":
      return {
        type: p.cash > p.detention!.bail + 350 ? "PAY_BAIL" : "SERVE_TIME",
      };
    case "PLANNING":
      for (const loan of s.loans.filter((l) => l.borrower === p.id))
        if (p.cash > loan.balance + 450)
          return { type: "REPAY_LOAN", id: loan.id, amount: loan.balance };
      if (
        p.serviceRound !== s.round &&
        p.cash > 800 &&
        p.buildCredit < 140 &&
        s.board.some(
          (t) =>
            t.owner === p.id &&
            controlled(s, p.id, t.district) >= 3 &&
            !developmentError(s, p, t),
        )
      )
        return { type: "VISIT_SERVICE", service: "contractor" };
      for (const tile of s.board
        .filter((t) => t.owner === p.id && t.type === "property")
        .sort((a, b) => b.base - a.base)) {
        if (p.cash - developmentCost(tile, s, p) < 300) continue;
        if (!developmentError(s, p, tile))
          return { type: "DEVELOP", tile: tile.id };
      }
      return proposeTrade(s, p);
    case "ROLL":
      return { type: "ROLL" };
    case "ROUTE_CHOICE":
      return {
        type: "ROUTE",
        tile: [...s.board[p.position].next].sort(
          (a, b) =>
            destinationScore(s, p, b, s.remaining - 1) -
            destinationScore(s, p, a, s.remaining - 1),
        )[0],
      };
    case "PURCHASE_DECISION":
      return {
        type:
          p.cash >= purchaseCost(s, s.board[p.position], p) + 200
            ? "BUY"
            : "DECLINE",
      };
    case "ENCOUNTER": {
      if (!s.encounter) return null;
      const options = encounters[s.encounter.index].options;
      const ranked = options
        .map((o, i) => ({
          i,
          value: encounterError(p, o)
            ? -Infinity
            : (o.reward.illegal
                ? p.cash < 400
                  ? 90
                  : ["moxie", "niko"].includes(p.token)
                    ? 80
                    : 20
                : 0) +
              (o.reward.cash ?? 0) +
              (o.reward.draw ?? 0) * 65 +
              (o.reward.shield ?? 0) * Math.max(60, s.round * 14) +
              (o.reward.buildCredit ?? 0) *
                (s.board.some((t) => controlled(s, p.id, t.district) >= 3)
                  ? 0.7
                  : 0.1) +
              (o.reward.purchaseCredit ?? 0) * 0.65 +
              (o.reward.moveBonus ?? 0) * 15,
        }))
        .sort((a, b) => b.value - a.value);
      return {
        type: "CHOOSE_ENCOUNTER",
        choice: Number.isFinite(ranked[0].value) ? ranked[0].i : -1,
      };
    }
    case "TURN_END":
      return { type: "END" };
    case "FINANCIAL_CRISIS": {
      const tile = s.board
        .filter(
          (t) => t.owner === p.id && t.level > 0 && !lockedReason(s, t.id),
        )
        .sort((a, b) => developmentCost(b) - developmentCost(a))[0];
      return tile
        ? { type: "SELL", tile: tile.id }
        : (emergencyBorrow(s, p) ?? { type: "BANKRUPT" });
    }
    default:
      return null;
  }
}
/** A paced server scheduler, separate from pure bot decisions. Never automates another human. */
export class BotRunner {
  private nextAt = 0;
  step(game: Game, now = Date.now()): boolean {
    const s = game.state;
    if (s.paused || s.phase === "LOBBY" || s.phase === "GAME_OVER") {
      this.nextAt = 0;
      return false;
    }
    if (now < this.nextAt) return false;
    this.nextAt = now + (s.simulation.speed === "FAST" ? 60 : 1100);
    if (s.phase === "AUCTION") {
      for (const p of s.players.filter(
        (p) => !p.eliminated && automated(s, p),
      )) {
        const action = auctionBid(s, p);
        if (action) {
          game.action(p.id, action);
          return true;
        }
      }
      return false;
    }
    for (const p of s.players.filter((p) => !p.eliminated && automated(s, p))) {
      const action = respondToOffer(s, p);
      if (action) {
        game.action(p.id, action);
        return true;
      }
    }
    if (s.phase === "PLANNING") {
      for (const p of s.players.filter(
        (p) => !p.eliminated && automated(s, p),
      )) {
        if (s.planningReady.includes(p.id)) continue;
        const action = botCommand(s, p);
        if (action) {
          game.action(p.id, action);
          return true;
        }
        game.action(p.id, { type: "FINISH_PLANNING" });
        return true;
      }
      // Humans choose when to finish, even with fast bot opponents.
      return false;
    }
    const p = s.players[s.current];
    if (!p || p.eliminated || !automated(s, p)) return false;
    const action = botCommand(s, p);
    if (!action) return false;
    game.action(p.id, action);
    return true;
  }
}
