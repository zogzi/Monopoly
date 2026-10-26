import { Game } from "./index";
import { controlled, developmentCost, develop, revenue } from "./properties";
import type { Command, Player, State } from "../shared/index";
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
  switch (s.phase) {
    case "PLANNING":
      for (const tile of s.board
        .filter((t) => t.owner === p.id && t.type === "property")
        .sort((a, b) => b.base - a.base)) {
        if (p.cash - developmentCost(tile) < 300) continue;
        try {
          develop(
            structuredClone(s),
            structuredClone(p),
            structuredClone(tile),
          );
          return { type: "DEVELOP", tile: tile.id };
        } catch {
          /* Not eligible; inspect the next asset. */
        }
      }
      return null;
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
        type: p.cash >= s.board[p.position].price + 200 ? "BUY" : "DECLINE",
      };
    case "TURN_END":
      return { type: "END" };
    case "FINANCIAL_CRISIS": {
      const tile = s.board
        .filter((t) => t.owner === p.id && t.level > 0)
        .sort((a, b) => developmentCost(b) - developmentCost(a))[0];
      return tile ? { type: "SELL", tile: tile.id } : { type: "BANKRUPT" };
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
    this.nextAt = now + (s.simulation.speed === "FAST" ? 150 : 1100);
    if (s.phase === "PLANNING") {
      for (const p of s.players.filter(
        (p) => !p.eliminated && automated(s, p),
      )) {
        const action = botCommand(s, p);
        if (action) {
          game.action(p.id, action);
          return true;
        }
      }
      // Fast-forward planning only when every active seat is explicitly automated.
      if (
        s.players.filter((p) => !p.eliminated).every((p) => automated(s, p))
      ) {
        game.beginTurn();
        game.state.version++;
        return true;
      }
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
