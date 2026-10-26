import type { State, Command } from "../../../../packages/shared/index";
import type { Cue, SoundEvent } from "./cues";
export class GameAudioEvents {
  private previous?: State;
  private turn = "";
  reset() {
    this.previous = undefined;
    this.turn = "";
  }
  consume(s: State, id: string | null): SoundEvent[] {
    const before = this.previous;
    this.previous = s;
    if (!before || s.phase === "LOBBY" || s.round < before.round) {
      this.turn = "";
      return [];
    }
    const events: SoundEvent[] = [],
      primary = new Set<string>();
    const add = (cue: Cue, actor?: string, important = false) => {
      events.push({ cue, remote: !!actor && actor !== id });
      if (important && actor) primary.add(actor);
    };
    if (s.paused !== before.paused) add(s.paused ? "pause" : "resume");
    if (before.phase === "LOBBY") add("start");
    else if (s.round !== before.round) add("round");
    const active = s.players[s.current];
    if (
      !s.paused &&
      ["ROLL", "DETENTION"].includes(s.phase) &&
      active?.id === id
    ) {
      const key = `${s.round}:${active.id}`;
      if (key !== this.turn) {
        this.turn = key;
        add("turn");
      }
    }
    if (s.phase === "GAME_OVER" && before.phase !== "GAME_OVER") {
      add(id && s.winner !== id ? "lose" : "win");
      return events;
    }
    if (
      s.phase === "FINANCIAL_CRISIS" &&
      active?.id === id &&
      (before.phase !== s.phase || before.players[before.current]?.id !== id)
    )
      add("crisis");
    if (
      before.phase === "FINANCIAL_CRISIS" &&
      s.phase !== "FINANCIAL_CRISIS" &&
      s.phase !== "AUCTION" &&
      before.players[before.current]?.id === id &&
      (s.players.find((p) => p.id === id)?.cash ?? -1) >= 0
    )
      add("recovery");
    if (
      s.phase === "ROUTE_CHOICE" &&
      active?.id === id &&
      before.phase !== "ROUTE_CHOICE"
    )
      add("route");
    if (
      s.encounter &&
      active?.id === id &&
      (before.encounter?.index !== s.encounter.index ||
        before.encounter?.playerId !== id ||
        before.phase !== "ENCOUNTER")
    )
      add("surprise");
    if (
      s.lastRoll &&
      s.lastRoll.id !== before.lastRoll?.id &&
      (s.lastRoll.playerId !== id || (s.simulation.autoplay && s.host === id))
    )
      add("roll", s.lastRoll.playerId);
    if (s.auction?.id !== before.auction?.id && s.auction) add("auction");
    if (
      s.auction &&
      s.auction.id === before.auction?.id &&
      s.auction.bid > before.auction.bid &&
      s.auction.bidder
    )
      add("bid", s.auction.bidder);
    const market = s.lastMarketEvent;
    const newMarket = market && market.id !== before.lastMarketEvent?.id;
    const transferred =
      newMarket && ["trade", "auction", "option"].includes(market.kind);
    if (newMarket) {
      if (market.kind === "trade") {
        const ownTrade = before.offers.some(
          (o) =>
            (o.from === id || o.to === id) &&
            !s.offers.some((next) => next.id === o.id),
        );
        add("trade", ownTrade ? (id ?? undefined) : market.player, true);
        // A completed exchange already has its own sound, including both cash legs.
        s.players.forEach((p) => primary.add(p.id));
      } else
        add(
          market.kind === "auction"
            ? "auctionWin"
            : market.kind === "option"
              ? "contract"
              : "loan",
          market.player,
          true,
        );
    }
    for (const offer of s.offers) {
      if (!before.offers.some((o) => o.id === offer.id)) add("offer");
    }
    for (const tile of s.board) {
      const old = before.board[tile.id];
      if (!old) continue;
      if (!transferred && tile.owner && tile.owner !== old.owner)
        add("purchase", tile.owner, true);
      if (tile.owner && tile.owner === old.owner && tile.level !== old.level)
        add(tile.level > old.level ? "build" : "sell", tile.owner, true);
    }
    for (const p of s.players) {
      const old = before.players.find((player) => player.id === p.id);
      if (!old) continue;
      if (!old.detention && p.detention) add("arrest", p.id, true);
      else if (old.detention && !p.detention && !p.eliminated)
        add("release", p.id, true);
      else if (
        old.detention &&
        p.detention &&
        p.detention.turns < old.detention.turns
      )
        add("serve", p.id, true);
      if (p.eliminated && !old.eliminated) add("lose", p.id, true);
      if (p.serviceRound !== old.serviceRound && p.serviceRound === s.round)
        add("service", p.id, true);
      else if (
        p.cards.length !== old.cards.length ||
        p.cards.some((card) => !old.cards.some((c) => c.id === card.id))
      )
        add("card", p.id, true);
      const loanBefore = before.loans
        .filter((l) => l.borrower === p.id)
        .reduce((n, l) => n + l.balance, 0);
      const loanAfter = s.loans
        .filter((l) => l.borrower === p.id)
        .reduce((n, l) => n + l.balance, 0);
      if (!(newMarket && market.kind === "loan" && market.player === p.id)) {
        const oldBankShortfall = before.arrears
          .filter((d) => d.payer === p.id && d.reason === "bank")
          .reduce((n, d) => n + d.amount, 0);
        const newBankShortfall = s.arrears
          .filter((d) => d.payer === p.id && d.reason === "bank")
          .reduce((n, d) => n + d.amount, 0);
        if (
          s.loans.some(
            (l) =>
              l.borrower === p.id &&
              before.loans.some(
                (oldLoan) => oldLoan.id === l.id && oldLoan.balance < l.balance,
              ),
          )
        )
          add("loan", p.id, true);
        else if (
          loanAfter + newBankShortfall < loanBefore + oldBankShortfall &&
          !p.eliminated
        )
          add("repay", p.id, true);
      }
      if (!primary.has(p.id) && p.cash !== old.cash && !p.eliminated)
        add(p.cash > old.cash ? "income" : "expense", p.id);
    }
    // One cue per kind/scope per snapshot keeps round-end payments and fast bots concise.
    return events.filter(
      (e, i) =>
        events.findIndex(
          (other) => other.cue === e.cue && other.remote === e.remote,
        ) === i,
    );
  }
}
export function commandCue(type: Command["type"]): Cue | null {
  if (type === "ROUTE") return "route";
  if (type === "CHOOSE_ENCOUNTER") return "confirm";
  if (
    [
      "READY",
      "FINISH_PLANNING",
      "RESUME_PLANNING",
      "END",
      "SKIP",
      "RESTART",
      "REJECT_TRADE",
      "CANCEL_TRADE",
      "PASS_AUCTION",
    ].includes(type)
  )
    return "confirm";
  if (
    ["ADD_BOT", "REMOVE_BOT", "SET_MODE", "SIMULATION", "REACTION"].includes(
      type,
    )
  )
    return "click";
  return null; // Outcomes such as purchases/cards/loans come from authoritative snapshots.
}
