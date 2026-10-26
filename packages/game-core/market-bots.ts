import type { Command, Player, State } from "../shared/index";
import type { TradeOffer } from "../shared/economy";
import { estimated, controlled, revenue } from "./properties";
import { capacity, validateOffer } from "./economy";
import { lockedReason } from "./finance";

export function tradeValue(s: State, p: Player, o: TradeOffer) {
  const incoming = o.from === p.id ? o.take : o.give;
  const outgoing = o.from === p.id ? o.give : o.take;
  const asset = (id: number, receive: boolean) => {
    const t = s.board[id],
      count = controlled(s, p.id, t.district);
    return (
      estimated(t) +
      (t.type === "property" &&
      (receive ? count === 2 || count === 3 : count === 3 || count === 4)
        ? t.price * 0.35
        : 0)
    );
  };
  let value =
    incoming.cash -
    outgoing.cash +
    incoming.tiles.reduce((n, id) => n + asset(id, true), 0) -
    outgoing.tiles.reduce((n, id) => n + asset(id, false), 0);
  for (const c of o.clauses) {
    const giver = c.giver === "from" ? o.from : o.to,
      sign = giver === p.id ? -1 : 1;
    if (c.kind === "payment") value += sign * c.amount * 0.95;
    if (c.kind === "loan")
      value +=
        sign * (c.principal - c.amount * 0.95) +
        (giver !== p.id && p.cash < 400 ? c.principal * 0.2 : 0);
    if (c.kind === "revenue")
      value +=
        ((sign * revenue(s, s.board[c.tile]) * c.percent) / 100) *
        c.rounds *
        0.7;
    if (c.kind === "immunity") value += sign * c.uses * 60;
    if (c.kind === "option")
      value += sign * Math.max(0, estimated(s.board[c.tile]) - c.amount) * 0.5;
  }
  return value;
}
export function respondToOffer(s: State, p: Player): Command | null {
  if (
    ["AUCTION", "LOBBY", "GAME_OVER"].includes(s.phase) ||
    (s.phase === "PLANNING" && s.planningReady.includes(p.id))
  )
    return null;
  const o = s.offers.find((o) => o.to === p.id);
  if (!o) return null;
  try {
    validateOffer(s, o);
  } catch {
    return { type: "REJECT_TRADE", id: o.id };
  }
  return {
    type: tradeValue(s, p, o) >= -5 ? "ACCEPT_TRADE" : "REJECT_TRADE",
    id: o.id,
  };
}
export function proposeTrade(s: State, p: Player): Command | null {
  if (
    s.stats[p.id].lastOfferRound === s.round ||
    s.offers.filter((o) => o.from === p.id).length >= 3
  )
    return null;
  const tile = s.board.find(
    (t) =>
      t.type === "property" &&
      t.owner &&
      t.owner !== p.id &&
      !t.level &&
      controlled(s, p.id, t.district) >= 2 &&
      !lockedReason(s, t.id) &&
      p.cash > estimated(t) * 1.1 + 350,
  );
  if (!tile) return null;
  return {
    type: "OFFER_TRADE",
    offer: {
      to: tile.owner!,
      give: { cash: Math.ceil(estimated(tile) * 1.1), tiles: [] },
      take: { cash: 0, tiles: [tile.id] },
      clauses: [],
    },
  };
}
export function auctionBid(s: State, p: Player): Command | null {
  const a = s.auction;
  if (!a || a.seller === p.id || a.bidder === p.id || a.passed.includes(p.id))
    return null;
  const t = s.board[a.tile],
    max = Math.min(
      p.cash - 250,
      estimated(t) * 0.9 + controlled(s, p.id, t.district) * 45,
    );
  const next = a.bid + Math.max(10, Math.min(50, Math.floor(t.price / 10)));
  return next <= max ? { type: "BID", amount: next } : { type: "PASS_AUCTION" };
}
export function emergencyBorrow(s: State, p: Player): Command | null {
  if (p.cash >= 0) return null;
  const collateral = s.board
    .filter((t) => t.owner === p.id && !lockedReason(s, t.id))
    .map((t) => t.id);
  const max = capacity(s, collateral);
  return max > 0
    ? {
        type: "BORROW",
        amount: Math.min(max, Math.ceil(-p.cash + 150)),
        collateral,
      }
    : null;
}
