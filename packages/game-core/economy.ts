import type { State, Player } from "../shared/index";
import type { OfferDraft, TradeOffer, Clause } from "../shared/economy";
import { emptyStats } from "../shared/economy";
import { estimated, revenue } from "./properties";
import { credit, lockedReason } from "./finance";
import { charge } from "./payments";

const person = (s: State, id: string) => {
  const p = s.players.find((p) => p.id === id && !p.eliminated);
  if (!p) throw Error("That player is no longer in the game.");
  return p;
};
export function economyOpen(s: State, p: Player) {
  if (
    s.paused ||
    ["LOBBY", "GAME_OVER", "AUCTION"].includes(s.phase) ||
    p.eliminated
  )
    throw Error("The market is closed in this phase.");
  if (s.phase === "PLANNING" && s.planningReady.includes(p.id))
    throw Error("Click Back to planning before making a deal.");
}
export function capacity(s: State, collateral: number[]) {
  return Math.floor(
    collateral.reduce((n, id) => n + estimated(s.board[id]), 0) * 0.65,
  );
}
function unique(values: number[]) {
  if (new Set(values).size !== values.length)
    throw Error("Select each property only once.");
}
export function validateHoldings(s: State) {
  for (const p of s.players)
    for (let d = 0; d < 8; d++) {
      const tiles = s.board.filter(
        (t) => t.owner === p.id && t.district === d && t.type === "property",
      );
      const levels = tiles.reduce((n, t) => n + t.level, 0);
      if (
        (levels > 0 && tiles.length < 3) ||
        levels > (tiles.length === 4 ? 12 : 6) ||
        (tiles.length < 4 && tiles.some((t) => t.level === 4))
      )
        throw Error(
          "Sell development before splitting this district. Developed districts must keep legal building capacity.",
        );
    }
}
function sides(offer: TradeOffer, clause: Clause) {
  return clause.giver === "from"
    ? [offer.from, offer.to]
    : [offer.to, offer.from];
}
/** Run at both send and acceptance: an offer never reserves cash or promises stale ownership. */
export function validateOffer(s: State, o: TradeOffer) {
  if (s.contracts.length + o.clauses.length > 240)
    throw Error(
      "The city has too many active contracts. Wait for some to settle.",
    );
  const from = person(s, o.from),
    to = person(s, o.to);
  if (o.from === o.to) throw Error("Choose another player.");
  unique([...o.give.tiles, ...o.take.tiles]);
  if (
    !o.give.cash &&
    !o.take.cash &&
    !o.give.tiles.length &&
    !o.take.tiles.length &&
    !o.clauses.length
  )
    throw Error("Add cash, a property or a contract to the offer.");
  const preview = structuredClone(s);
  for (const [basket, owner, recipient] of [
    [o.give, from, to],
    [o.take, to, from],
  ] as const)
    for (const id of basket.tiles) {
      if (s.board[id].owner !== owner.id)
        throw Error("A selected property changed owner. Make a new offer.");
      const lock = lockedReason(s, id);
      if (lock) throw Error(lock);
      preview.board[id].owner = recipient.id;
    }
  validateHoldings(preview);
  const deltas: Record<string, number> = {
    [from.id]: o.take.cash - o.give.cash,
    [to.id]: o.give.cash - o.take.cash,
  };
  const reserved = new Set<number>();
  for (const c of o.clauses) {
    const [giver, receiver] = sides(o, c);
    if (c.kind === "loan") {
      if (c.amount < c.principal)
        throw Error("Loan repayment must cover its principal.");
      deltas[giver] -= c.principal;
      deltas[receiver] += c.principal;
    }
    if (c.kind === "revenue" || c.kind === "option") {
      if (preview.board[c.tile].owner !== giver)
        throw Error(
          "The contract grantor must own that property after the exchange.",
        );
      if (lockedReason(s, c.tile) || reserved.has(c.tile))
        throw Error("That property already secures another agreement.");
      reserved.add(c.tile);
    }
    if (
      c.kind === "immunity" &&
      !preview.board.some((t) => t.owner === giver && t.district === c.district)
    )
      throw Error("Rent immunity must cover a district owned by its grantor.");
  }
  for (const p of [from, to]) {
    if (deltas[p.id] < 0 && p.cash + deltas[p.id] < 0)
      throw Error(`${p.name} cannot afford this offer anymore.`);
    const liabilities = o.clauses.filter((c) => {
      const [giver, receiver] = sides(o, c);
      return (
        (c.kind === "payment" && giver === p.id) ||
        (c.kind === "loan" && receiver === p.id)
      );
    });
    if (
      liabilities.reduce((n, c) => n + ("amount" in c ? c.amount : 0), 0) >
      10000
    )
      throw Error("Keep promised repayments at $10,000 or less per deal.");
  }
  return { preview, deltas };
}
export function sendOffer(s: State, from: string, draft: OfferDraft) {
  const offer: TradeOffer = {
    ...draft,
    from,
    id: `trade-${s.version + 1}`,
    expiresRound: s.round + 2,
  };
  if (draft.counter) {
    const previous = s.offers.find((o) => o.id === draft.counter);
    if (!previous || previous.to !== from || previous.from !== draft.to)
      throw Error("That offer is no longer available to counter.");
  }
  if (
    s.offers.filter((o) => o.from === from && o.id !== draft.counter).length >=
    3
  )
    throw Error("Withdraw an offer first. You can have three open offers.");
  validateOffer(s, offer);
  s.offers = s.offers.filter((o) => o.id !== draft.counter);
  s.offers.push(offer);
  (s.stats[from] ??= emptyStats()).lastOfferRound = s.round;
  return offer;
}
export function acceptOffer(s: State, id: string, recipient: string) {
  const o = s.offers.find((o) => o.id === id);
  if (!o || o.to !== recipient || o.expiresRound < s.round)
    throw Error("That offer is no longer available to accept.");
  const { preview, deltas } = validateOffer(s, o);
  for (const p of s.players) p.cash += deltas[p.id] ?? 0;
  s.board = preview.board;
  for (const [index, c] of o.clauses.entries()) {
    const [giver, receiver] = sides(o, c),
      id = `${o.id}-clause-${index}`;
    if (c.kind === "payment" || c.kind === "loan")
      s.contracts.push({
        id,
        kind: c.kind,
        payer: c.kind === "loan" ? receiver : giver,
        payee: c.kind === "loan" ? giver : receiver,
        amount: c.amount,
        dueRound: s.round + c.rounds,
      });
    if (c.kind === "revenue")
      s.contracts.push({
        id,
        kind: c.kind,
        owner: giver,
        beneficiary: receiver,
        tile: c.tile,
        percent: c.percent,
        expiresRound: s.round + c.rounds,
      });
    if (c.kind === "immunity")
      s.contracts.push({
        id,
        kind: c.kind,
        owner: giver,
        beneficiary: receiver,
        district: c.district,
        remaining: c.uses,
      });
    if (c.kind === "option")
      s.contracts.push({
        id,
        kind: c.kind,
        owner: giver,
        beneficiary: receiver,
        tile: c.tile,
        amount: c.amount,
        expiresRound: s.round + c.rounds,
      });
  }
  s.offers = s.offers.filter((offer) => offer.id !== id);
  for (const p of [o.from, o.to]) (s.stats[p] ??= emptyStats()).trades++;
  return o;
}
export function borrow(
  s: State,
  p: Player,
  amount: number,
  collateral: number[],
) {
  unique(collateral);
  for (const id of collateral) {
    if (s.board[id].owner !== p.id)
      throw Error("Only your properties can secure a bank loan.");
    const lock = lockedReason(s, id);
    if (lock) throw Error(lock);
  }
  if (amount > capacity(s, collateral))
    throw Error("The bank lends at most 65% of the collateral value.");
  const { rate } = credit(s, p);
  s.loans.push({
    id: `bank-${s.version + 1}`,
    borrower: p.id,
    balance: amount,
    rate,
    issuedRound: s.round,
    dueRound: s.round + 3,
    collateral,
  });
  p.cash += amount;
  return rate;
}
export function repay(s: State, p: Player, id: string, amount: number) {
  const loan = s.loans.find((l) => l.id === id && l.borrower === p.id);
  if (!loan) throw Error("That bank loan is already repaid.");
  if (amount > loan.balance || amount > p.cash)
    throw Error(
      "Choose a repayment you can afford, up to the remaining balance.",
    );
  p.cash -= amount;
  loan.balance -= amount;
  s.loans = s.loans.filter((l) => l.balance > 0);
}
export function refinance(s: State, p: Player, id: string, amount: number) {
  const loan = s.loans.find((l) => l.id === id && l.borrower === p.id);
  if (!loan || amount > capacity(s, loan.collateral) - loan.balance)
    throw Error("The collateral has no available equity for this amount.");
  loan.balance += amount;
  p.cash += amount;
}
export function exercise(s: State, p: Player, id: string) {
  const c = s.contracts.find((c) => c.id === id);
  if (
    !c ||
    c.kind !== "option" ||
    c.beneficiary !== p.id ||
    c.expiresRound < s.round
  )
    throw Error("That purchase option is unavailable.");
  if (p.cash < c.amount || s.board[c.tile].owner !== c.owner)
    throw Error("Not enough cash, or the property is no longer available.");
  p.cash -= c.amount;
  person(s, c.owner).cash += c.amount;
  s.board[c.tile].owner = p.id;
  validateHoldings(s);
  s.contracts = s.contracts.filter((q) => q.id !== id);
  return c;
}
/** End-of-round settlement. A negative wallet enters recovery before anybody can roll. */
export function settleRound(s: State, log: (message: string) => void) {
  if (s.round <= s.lastSettledRound) return;
  s.lastSettledRound = s.round;
  for (const loan of s.loans) {
    const p = person(s, loan.borrower);
    if (s.round <= loan.issuedRound) continue;
    const interest = Math.ceil(loan.balance * loan.rate);
    charge(s, p, interest, { payee: null, reason: "bank" });
    (s.stats[p.id] ??= emptyStats()).interest += interest;
    log(`${p.name} was charged $${interest} bank interest.`);
    if (loan.dueRound <= s.round) {
      charge(s, p, loan.balance, {
        payee: null,
        reason: "bank",
        collateral: loan.collateral,
      });
      log(
        `${p.name}'s $${loan.balance} bank principal came due. Collateral releases when the principal is paid.`,
      );
    }
  }
  s.loans = s.loans.filter((l) => l.dueRound > s.round);
  for (const c of s.contracts)
    if ((c.kind === "payment" || c.kind === "loan") && c.dueRound <= s.round) {
      const payer = person(s, c.payer),
        payee = person(s, c.payee);
      const funded = charge(s, payer, c.amount, {
        payee: payee.id,
        reason: "contract",
      });
      log(
        `${payer.name} paid ${payee.name} $${funded} under their ${c.kind === "loan" ? "private loan" : "contract"}${funded < c.amount ? `; $${c.amount - funded} still owed` : ""}.`,
      );
    }
  s.contracts = s.contracts.filter((c) =>
    "dueRound" in c
      ? c.dueRound > s.round
      : c.kind === "immunity"
        ? c.remaining > 0
        : c.expiresRound > s.round,
  );
  s.offers = s.offers.filter((o) => o.expiresRound > s.round);
}
export function payRent(s: State, p: Player, tile: number) {
  const t = s.board[tile],
    owner = person(s, t.owner!),
    amount = revenue(s, t);
  const immunity = s.contracts.find(
    (c) =>
      c.kind === "immunity" &&
      c.owner === owner.id &&
      c.beneficiary === p.id &&
      c.district === t.district,
  );
  if (immunity?.kind === "immunity") {
    immunity.remaining--;
    s.contracts = s.contracts.filter(
      (c) => c.kind !== "immunity" || c.remaining > 0,
    );
    return `${p.name} used rent immunity at ${t.name}.`;
  }
  if (p.shield) {
    p.shield--;
    return `${p.name} blocked $${amount} rent with a shield.`;
  }
  const share = s.contracts.find(
    (c) => c.kind === "revenue" && c.owner === owner.id && c.tile === tile,
  );
  const funded = charge(s, p, amount, {
    payee: owner.id,
    reason: "rent",
    rent: {
      owner: owner.id,
      percent: share?.kind === "revenue" ? share.percent : 0,
      beneficiary: share?.kind === "revenue" ? share.beneficiary : undefined,
      received: 0,
    },
  });
  return `${p.name} paid ${owner.name} $${funded} rent for ${t.name}${funded < amount ? `; $${amount - funded} still owed` : ""}${share?.kind === "revenue" ? ` (${share.percent}% shared with ${person(s, share.beneficiary).name})` : ""}.`;
}
