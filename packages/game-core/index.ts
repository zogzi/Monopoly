import {
  DECISION_SECONDS,
  PLANNING_SECONDS,
  CRISIS_SECONDS,
} from "../shared/timing";
import { eventIds, cards, cityEvents, encounters } from "../shared/content";
import { drawCards, applyEncounter, useCard, visitService } from "./engagement";
import { purchaseCost, estimated } from "./properties";
import { modes, emptyStats } from "../shared/economy";
import {
  economyOpen,
  sendOffer,
  acceptOffer,
  borrow,
  repay,
  refinance,
  exercise,
  settleRound,
  payRent,
  validateHoldings,
} from "./economy";
import { lockedReason } from "./finance";
import { charge, receive, settleArrears, shortfall } from "./payments";
import type { DuePayment } from "../shared/economy";
import {
  createBoard,
  tokens,
  character,
  colors,
  commandSchema,
  type State,
  type Player,
  type Command,
  type Token,
} from "../shared/index";
import { develop, empire, developmentCost } from "./properties";
export {
  controlled,
  estimated,
  revenue,
  empire,
  developmentCost,
} from "./properties";
export const initialState = (): State => ({
  version: 0,
  phase: "LOBBY",
  round: 0,
  players: [],
  host: null,
  current: 0,
  board: createBoard(),
  dice: [],
  lastRoll: null,
  planningReady: [],
  cityEvent: null,
  nextCityEvent: null,
  encounter: null,
  lastEscort: null,
  path: [],
  remaining: 0,
  deadline: 0,
  turnDeadline: 0,
  crisisTurnRemainingMs: DECISION_SECONDS * 1000,
  pausedTimers: null,
  paused: false,
  log: [],
  simulation: { autoplay: false, speed: "NORMAL" },
  reactions: {},
  winner: null,
  mode: "CAPITAL",
  offers: [],
  contracts: [],
  loans: [],
  auction: null,
  crisisResume: "encounter",
  stats: {},
  lastMarketEvent: null,
  lastSettledRound: 0,
  arrears: [],
});
export class Game {
  state: State;
  seed: number;
  constructor(state = initialState(), seed = Date.now() >>> 0) {
    // Migrate pre-bot snapshots without carrying the removed chat history forward.
    this.state = {
      ...state,
      planningReady: state.planningReady ?? [],
      lastRoll: state.lastRoll ?? null,
      cityEvent: state.cityEvent ?? null,
      nextCityEvent: state.nextCityEvent ?? null,
      encounter: state.encounter ?? null,
      lastEscort: state.lastEscort ?? null,
      simulation: state.simulation ?? { autoplay: false, speed: "NORMAL" },
      mode: state.mode ?? "CAPITAL",
      offers: state.offers ?? [],
      contracts: state.contracts ?? [],
      loans: state.loans ?? [],
      auction: state.auction ?? null,
      crisisResume: state.crisisResume ?? "encounter",
      stats: state.stats ?? {},
      lastMarketEvent: state.lastMarketEvent ?? null,
      lastSettledRound: state.lastSettledRound ?? 0,
      arrears: state.arrears ?? [],
      turnDeadline:
        state.turnDeadline ??
        (!["LOBBY", "PLANNING", "GAME_OVER"].includes(state.phase)
          ? state.deadline
          : 0),
      crisisTurnRemainingMs:
        state.crisisTurnRemainingMs ?? DECISION_SECONDS * 1000,
      pausedTimers: state.pausedTimers ?? null,
    };
    if (this.state.auction && this.state.auction.passedAtBid === undefined) {
      this.state.auction = {
        ...this.state.auction,
        passed: [],
        passedAtBid: this.state.auction.bid,
      };
    }
    delete (this.state as State & { chat?: unknown }).chat;
    this.state.players.forEach((p, i) => {
      this.state.stats[p.id] ??= emptyStats();
      const legacyShortfall =
        Math.max(0, -p.cash) - shortfall(this.state, p.id);
      if (legacyShortfall > 0)
        this.state.arrears.push({
          payer: p.id,
          payee: null,
          amount: legacyShortfall,
          reason: "tax",
        });
      p.detention ??= null;
      p.cards ??= [];
      p.shield ??= 0;
      p.buildCredit ??= 0;
      p.purchaseCredit ??= 0;
      p.moveBonus ??= 0;
      p.serviceRound ??= 0;
      if (!tokens.includes(p.token)) p.token = tokens[i % tokens.length];
    });
    this.seed = seed || 1;
  }
  random() {
    let x = this.seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.seed = x >>> 0;
    return this.seed / 4294967296;
  }
  log(text: string) {
    const s = this.state;
    s.log.unshift({ id: (s.log[0]?.id ?? 0) + 1, text });
    s.log = s.log.slice(0, 60);
  }
  player(id: string) {
    const p = this.state.players.find((p) => p.id === id);
    if (!p) throw Error("Seat not found. Join the city first.");
    return p;
  }
  join(id: string, name: string, token: Token = "moxie") {
    const s = this.state;
    if (s.phase !== "LOBBY")
      throw Error(
        "A game is in progress. Reconnect with your original browser.",
      );
    if (s.players.length >= 15) throw Error("All 15 seats are taken.");
    const p: Player = {
      id,
      name,
      token,
      color:
        colors.find((color) => !s.players.some((p) => p.color === color)) ??
        colors[0],
      connected: true,
      ready: false,
      eliminated: false,
      cash: modes[s.mode].cash,
      position: 0,
      momentum: 0,
      cards: [],
      shield: 0,
      buildCredit: 0,
      purchaseCredit: 0,
      moveBonus: 0,
      serviceRound: 0,
      detention: null,
    };
    s.players.push(p);
    s.stats[id] = emptyStats();
    s.host ??= id;
    s.version++;
    this.log(`${name} arrived in Nova City.`);
    return p;
  }
  deadline(seconds: number) {
    this.state.deadline = Date.now() + seconds * 1000;
  }
  continueTurnClock() {
    const s = this.state;
    s.turnDeadline ||= s.deadline || Date.now() + DECISION_SECONDS * 1000;
    s.deadline = s.turnDeadline;
  }
  planning() {
    const s = this.state;
    s.phase = "PLANNING";
    s.current = 0;
    s.planningReady = [];
    s.turnDeadline = 0;
    this.deadline(PLANNING_SECONDS);
    this.log(`Round ${s.round}: plan and build, then click Finish planning.`);
  }
  beginTurn() {
    const s = this.state;
    while (s.players[s.current]?.eliminated) s.current++;
    if (s.current >= s.players.length) {
      this.roundEnd();
      return;
    }
    s.phase = s.players[s.current].detention ? "DETENTION" : "ROLL";
    s.dice = [];
    s.path = [];
    this.deadline(DECISION_SECONDS);
    s.turnDeadline = s.deadline;
  }
  offerEncounter() {
    const s = this.state;
    s.phase = "ENCOUNTER";
    s.encounter = {
      index: Math.floor(this.random() * encounters.length),
      playerId: s.players[s.current].id,
    };
    this.continueTurnClock();
  }
  nextTurn() {
    this.state.encounter = null;
    this.state.current++;
    this.beginTurn();
  }
  land() {
    const s = this.state,
      p = s.players[s.current],
      t = s.board[p.position];
    s.remaining = 0;
    if (["property", "transit", "utility"].includes(t.type)) {
      if (!t.owner) {
        s.phase = "PURCHASE_DECISION";
        this.continueTurnClock();
        return;
      }
      if (t.owner !== p.id) {
        this.log(payRent(s, p, t.id));
      }
    } else if (t.type === "tax") {
      charge(s, p, 120, { payee: null, reason: "tax" });
      this.log(`${p.name} paid $120 in city fees.`);
    } else if (t.type === "opportunity") {
      p.cash += 100;
      this.log(`${p.name} received a $100 opportunity grant.`);
    } else if (t.type === "civic") {
      p.cash += 50;
      this.log(`${p.name} received a $50 civic award.`);
    }
    s.phase = p.cash < 0 ? "FINANCIAL_CRISIS" : "TURN_END";
    s.crisisResume = "encounter";
    if (p.cash < 0) {
      s.crisisTurnRemainingMs = Math.max(
        0,
        (s.turnDeadline || s.deadline) - Date.now(),
      );
      this.deadline(CRISIS_SECONDS);
    }
    if (p.cash >= 0) this.offerEncounter();
  }
  move() {
    const s = this.state,
      p = s.players[s.current];
    while (s.remaining > 0) {
      const t = s.board[p.position];
      if (t.next.length > 1) {
        s.phase = "ROUTE_CHOICE";
        this.continueTurnClock();
        return;
      }
      this.step(t.next[0]);
    }
    this.land();
  }
  step(id: number) {
    const s = this.state,
      p = s.players[s.current];
    p.position = id;
    s.path.push(id);
    s.remaining--;
    if (id === 0) {
      const income = s.cityEvent === "harvest" ? 300 : 200;
      p.cash += income;
      this.log(`${p.name} passed HQ: +$${income}.`);
    }
  }
  bankrupt(p: Player) {
    const s = this.state;
    settleArrears(s);
    let estate = Math.max(0, p.cash);
    // Secured bank claims resolve before unsecured private obligations.
    for (const loan of s.loans.filter((l) => l.borrower === p.id)) {
      const proceeds = Math.floor(
        loan.collateral.reduce((n, id) => n + estimated(s.board[id]), 0) * 0.65,
      );
      estate += Math.max(0, proceeds - loan.balance);
      for (const id of loan.collateral) {
        s.board[id].owner = null;
        s.board[id].level = 0;
      }
    }
    for (const due of s.arrears.filter(
      (d) => d.payer === p.id && d.collateral,
    )) {
      const proceeds = Math.floor(
        due.collateral!.reduce(
          (n, id) =>
            n + (s.board[id].owner === p.id ? estimated(s.board[id]) : 0),
          0,
        ) * 0.65,
      );
      estate += Math.max(0, proceeds - due.amount);
      for (const id of due.collateral!) {
        s.board[id].owner = null;
        s.board[id].level = 0;
      }
    }
    const creditors: DuePayment[] = [
      ...s.arrears.filter((d) => d.payer === p.id && !d.collateral),
      ...s.contracts.flatMap((c) =>
        (c.kind === "loan" || c.kind === "payment") && c.payer === p.id
          ? [
              {
                payer: p.id,
                payee: c.payee,
                amount: c.amount,
                reason: "contract" as const,
              },
            ]
          : [],
      ),
    ];
    const total = creditors.reduce((n, c) => n + c.amount, 0);
    for (const due of creditors)
      receive(
        s,
        due,
        Math.floor(Math.min(1, estate / Math.max(1, total)) * due.amount),
      );
    s.arrears = s.arrears.filter((d) => {
      if (d.payer === p.id) return false;
      if (d.payee === p.id) {
        this.player(d.payer).cash += d.amount;
        return false;
      }
      if (d.rent?.beneficiary === p.id) {
        d.rent.beneficiary = undefined;
        d.rent.percent = 0;
      }
      return true;
    });
    s.loans = s.loans.filter((l) => l.borrower !== p.id);
    s.contracts = s.contracts.filter((c) =>
      "payer" in c
        ? c.payer !== p.id && c.payee !== p.id
        : c.owner !== p.id && c.beneficiary !== p.id,
    );
    s.offers = s.offers.filter((o) => o.from !== p.id && o.to !== p.id);
    s.stats[p.id].defaults++;
    for (const t of s.board)
      if (t.owner === p.id) {
        t.owner = null;
        t.level = 0;
      }
    p.eliminated = true;
    p.cash = 0;
    settleArrears(s);
    this.log(`${p.name} declared bankruptcy. Assets returned to the city.`);
    const survivors = s.players.filter((p) => !p.eliminated);
    if (survivors.length === 1 && survivors[0].cash < 0)
      this.roundRecovery("finish");
    else if (survivors.length <= 1) this.finish();
    else if (s.crisisResume === "planning" || s.crisisResume === "finish")
      this.recoverCrisis();
    else this.nextTurn();
  }
  recoverCrisis() {
    const s = this.state;
    if (
      s.phase !== "FINANCIAL_CRISIS" ||
      (!s.players[s.current].eliminated && s.players[s.current].cash < 0)
    )
      return;
    if (s.crisisResume === "encounter") {
      s.turnDeadline = Date.now() + s.crisisTurnRemainingMs;
      this.offerEncounter();
      return;
    }
    this.roundRecovery(s.crisisResume);
  }
  roundRecovery(resume: "planning" | "finish") {
    const s = this.state,
      current = s.players.findIndex((p) => !p.eliminated && p.cash < 0);
    if (current < 0) {
      if (resume === "finish") this.finish();
      else this.planning();
      return;
    }
    s.current = current;
    s.phase = "FINANCIAL_CRISIS";
    s.crisisResume = resume;
    this.deadline(CRISIS_SECONDS);
    this.log(
      `${s.players[current].name} has ten minutes to cover a round-end shortfall.`,
    );
  }
  startAuction(
    tile: number,
    seller: string | null,
    resume: "encounter" | "crisis",
  ) {
    const s = this.state;
    s.auction = {
      id: `auction-${s.version + 1}`,
      tile,
      seller,
      bid: 0,
      bidder: null,
      passed: [],
      passedAtBid: 0,
      resume,
      turnRemainingMs: Math.max(0, (s.turnDeadline || s.deadline) - Date.now()),
      crisisRemainingMs:
        resume === "crisis" ? Math.max(0, s.deadline - Date.now()) : undefined,
    };
    s.phase = "AUCTION";
    this.deadline(DECISION_SECONDS);
    this.log(
      `${s.board[tile].name} is up for auction. Bid or pass; all passes finish it early.`,
    );
  }
  settleAuction() {
    const s = this.state,
      a = s.auction;
    if (!a) return;
    if (a.bidder) {
      this.player(a.bidder).cash -= a.bid;
      if (a.seller) this.player(a.seller).cash += a.bid;
      s.board[a.tile].owner = a.bidder;
      s.stats[a.bidder].auctions++;
      s.lastMarketEvent = {
        id: s.version + 1,
        kind: "auction",
        player: a.bidder,
        tile: a.tile,
        amount: a.bid,
      };
      this.log(
        `${this.player(a.bidder).name} won ${s.board[a.tile].name} for $${a.bid}.`,
      );
    } else this.log(`No bids for ${s.board[a.tile].name}.`);
    s.auction = null;
    if (a.resume === "crisis") {
      s.phase = "FINANCIAL_CRISIS";
      s.deadline = Date.now() + (a.crisisRemainingMs ?? CRISIS_SECONDS * 1000);
      this.recoverCrisis();
    } else {
      s.turnDeadline =
        Date.now() + (a.turnRemainingMs ?? DECISION_SECONDS * 1000);
      this.offerEncounter();
    }
  }
  finish() {
    const s = this.state;
    const ranked = s.players
      .filter((p) => !p.eliminated)
      .sort((a, b) => empire(s, b) - empire(s, a));
    s.winner = ranked[0]?.id ?? null;
    s.phase = "GAME_OVER";
    s.deadline = 0;
    this.log(
      `${ranked[0]?.name ?? "Nobody"} wins ZMONOPOLY! Ties follow turn order.`,
    );
  }
  roundEnd() {
    const s = this.state;
    settleRound(s, (message) => this.log(message));
    settleArrears(s);
    const limit = modes[s.mode].rounds;
    if (limit !== null && s.round >= limit) {
      this.roundRecovery("finish");
      return;
    }
    if (s.mode === "DOMINATION" && s.round >= 12) {
      const levy = 100 + (s.round - 12) * 75;
      for (const p of s.players.filter((p) => !p.eliminated))
        p.cash -= Math.min(Math.max(0, p.cash), levy);
      this.log(
        `Domination city levy: up to $${levy} per player, capped at available cash. It rises by $75 next round.`,
      );
    }
    s.round++;
    s.cityEvent =
      s.nextCityEvent ?? eventIds[Math.floor(this.random() * eventIds.length)];
    const options = eventIds.filter((id) => id !== s.cityEvent);
    s.nextCityEvent = options[Math.floor(this.random() * options.length)];
    this.log(
      `City event: ${cityEvents[s.cityEvent].name}. ${cityEvents[s.cityEvent].effect}`,
    );
    this.roundRecovery("planning");
  }
  // Every command is transactional, including RNG. Invalid actions leave no partial changes.
  action(id: string, raw: unknown) {
    const action = commandSchema.parse(raw);
    const candidate = new Game(structuredClone(this.state), this.seed);
    settleArrears(candidate.state);
    candidate.apply(id, action);
    settleArrears(candidate.state);
    candidate.recoverCrisis();
    candidate.state.version++;
    this.state = candidate.state;
    this.seed = candidate.seed;
  }
  private apply(id: string, a: Command) {
    const s = this.state,
      p = this.player(id);
    const host = () => {
      if (s.host !== id) throw Error("Only the host can do that.");
    };
    const turn = () => {
      if (s.players[s.current]?.id !== id)
        throw Error("Wait for your movement turn.");
    };
    const phase = (...phases: State["phase"][]) => {
      if (!phases.includes(s.phase))
        throw Error("That action is unavailable in this phase.");
    };
    if (a.type === "ADD_BOT") {
      host();
      phase("LOBBY");
      const number =
        Array.from({ length: 15 }, (_, i) => i).find(
          (i) => !s.players.some((p) => p.id === `bot-${i}`),
        ) ?? 15;
      const figure =
        tokens.find((t) => !s.players.some((p) => p.token === t)) ??
        tokens[number % tokens.length];
      const name =
        character(figure).name +
        (s.players.some((p) => p.token === figure) ? ` ${number + 1}` : "");
      const bot = this.join(`bot-${number}`, name, figure);
      bot.bot = true;
      bot.ready = true;
      return;
    }
    if (a.type === "REMOVE_BOT") {
      host();
      phase("LOBBY");
      const bot = s.players.find((p) => p.id === a.id && p.bot);
      if (!bot) throw Error("Select a bot to remove.");
      s.players = s.players.filter((p) => p.id !== bot.id);
      return;
    }
    if (a.type === "SIMULATION") {
      host();
      s.simulation = { autoplay: a.autoplay, speed: a.speed };
      return;
    }
    if (a.type === "REACTION") {
      if ((s.reactions[id]?.until ?? 0) > Date.now())
        throw Error("Reactions have a 3-second cooldown.");
      s.reactions[id] = { emoji: a.emoji, until: Date.now() + 3000 };
      return;
    }
    if (a.type === "PAUSE") {
      host();
      phase(
        "PLANNING",
        "ROLL",
        "ROUTE_CHOICE",
        "PURCHASE_DECISION",
        "TURN_END",
        "FINANCIAL_CRISIS",
        "ENCOUNTER",
        "DETENTION",
        "AUCTION",
      );
      if (!s.paused)
        s.pausedTimers = {
          decision: Math.max(0, s.deadline - Date.now()),
          turn: Math.max(0, s.turnDeadline - Date.now()),
        };
      s.paused = true;
      return;
    }
    if (a.type === "RESUME") {
      host();
      if (!s.paused) throw Error("The game is already running.");
      s.paused = false;
      s.deadline =
        Date.now() +
        (s.pausedTimers?.decision ??
          (s.phase === "FINANCIAL_CRISIS" ? CRISIS_SECONDS : DECISION_SECONDS) *
            1000);
      if (s.turnDeadline)
        s.turnDeadline =
          Date.now() + (s.pausedTimers?.turn ?? DECISION_SECONDS * 1000);
      s.pausedTimers = null;
      return;
    }
    if (a.type === "RESTART") {
      host();
      const players = s.players.map((p) => ({
        ...p,
        ready: !!p.bot,
        eliminated: false,
        cash: modes[s.mode].cash,
        position: 0,
        momentum: 0,
        cards: [],
        shield: 0,
        buildCredit: 0,
        purchaseCredit: 0,
        moveBonus: 0,
        serviceRound: 0,
        detention: null,
      }));
      this.state = {
        ...initialState(),
        version: s.version,
        players,
        host: s.host,
        simulation: s.simulation,
        mode: s.mode,
        stats: Object.fromEntries(players.map((p) => [p.id, emptyStats()])),
      };
      return;
    }
    if (s.paused) throw Error("The host has paused the game.");
    if (a.type === "SET_MODE") {
      host();
      phase("LOBBY");
      s.mode = a.mode;
      for (const player of s.players) {
        player.cash = modes[a.mode].cash;
        player.ready = !!player.bot;
      }
      this.log(`Game mode: ${modes[a.mode].name}. ${modes[a.mode].detail}`);
      return;
    }
    if (a.type === "BID" || a.type === "PASS_AUCTION") {
      phase("AUCTION");
      const auction = s.auction;
      if (!auction || p.eliminated || auction.seller === id)
        throw Error("You cannot participate in this auction.");
      if (auction.passed.includes(id))
        throw Error("You have already passed on this auction.");
      if (auction.bidder === id)
        throw Error("You already hold the highest bid.");
      if (a.type === "BID") {
        if (a.amount < auction.bid + 10 || a.amount > p.cash)
          throw Error(
            "Bid at least $10 above the current bid, using available cash.",
          );
        auction.bid = a.amount;
        auction.bidder = id;
        // Passes answer the current price. Every new bid gives all rivals a fresh response.
        auction.passed = [];
        auction.passedAtBid = a.amount;
        s.deadline = Math.max(s.deadline, Date.now() + 60000);
        this.log(
          `${p.name} bid $${a.amount} for ${s.board[auction.tile].name}.`,
        );
      } else auction.passed.push(id);
      if (
        s.players
          .filter(
            (q) =>
              !q.eliminated &&
              q.id !== auction.seller &&
              q.id !== auction.bidder,
          )
          .every((q) => auction.passed.includes(q.id))
      )
        this.settleAuction();
      return;
    }
    if (
      [
        "OFFER_TRADE",
        "ACCEPT_TRADE",
        "REJECT_TRADE",
        "CANCEL_TRADE",
        "BORROW",
        "REPAY_LOAN",
        "REFINANCE",
        "EXERCISE_OPTION",
        "START_AUCTION",
      ].includes(a.type)
    ) {
      economyOpen(s, p);
      if (a.type === "OFFER_TRADE") {
        sendOffer(s, id, a.offer);
        // The contents are private to the two parties, including in the public log.
        this.log(
          `${p.name} sent a private trade offer to ${this.player(a.offer.to).name}.`,
        );
      }
      if (a.type === "ACCEPT_TRADE") {
        const o = acceptOffer(s, a.id, id);
        s.lastMarketEvent = { id: s.version + 1, kind: "trade", player: id };
        this.log(
          `${this.player(o.from).name} and ${p.name} completed a trade.`,
        );
      }
      if (a.type === "REJECT_TRADE" || a.type === "CANCEL_TRADE") {
        const o = s.offers.find((o) => o.id === a.id);
        if (!o || (a.type === "REJECT_TRADE" ? o.to : o.from) !== id)
          throw Error("That offer is no longer available.");
        s.offers = s.offers.filter((o) => o.id !== a.id);
      }
      if (a.type === "BORROW") {
        const rate = borrow(s, p, a.amount, a.collateral);
        s.lastMarketEvent = {
          id: s.version + 1,
          kind: "loan",
          player: id,
          amount: a.amount,
        };
        this.log(
          `${p.name} borrowed $${a.amount} at ${Math.round(rate * 100)}% per round, due after round ${s.round + 3}.`,
        );
      }
      if (a.type === "REPAY_LOAN") {
        repay(s, p, a.id, a.amount);
        this.log(`${p.name} repaid $${a.amount} of bank debt.`);
      }
      if (a.type === "REFINANCE") {
        refinance(s, p, a.id, a.amount);
        this.log(
          `${p.name} refinanced $${a.amount} of additional equity. The original rate and due round remain.`,
        );
      }
      if (a.type === "EXERCISE_OPTION") {
        const c = exercise(s, p, a.id);
        s.lastMarketEvent = {
          id: s.version + 1,
          kind: "option",
          player: id,
          tile: c.tile,
          amount: c.amount,
        };
        this.log(
          `${p.name} exercised a purchase option on ${s.board[c.tile].name} for $${c.amount}.`,
        );
      }
      if (a.type === "START_AUCTION") {
        turn();
        phase("FINANCIAL_CRISIS");
        const t = s.board[a.tile];
        if (t.owner !== id || t.level)
          throw Error("Choose an undeveloped property you own.");
        const lock = lockedReason(s, t.id);
        if (lock) throw Error(lock);
        const preview = structuredClone(s);
        preview.board[t.id].owner = null;
        validateHoldings(preview);
        this.startAuction(t.id, id, "crisis");
      } else this.recoverCrisis();
      return;
    }
    if (a.type === "READY") {
      phase("LOBBY");
      p.ready = !p.ready;
      return;
    }
    if (a.type === "FINISH_PLANNING" || a.type === "RESUME_PLANNING") {
      phase("PLANNING");
      if (p.eliminated) throw Error("Your empire has been eliminated.");
      s.planningReady = s.planningReady.filter((ready) => ready !== id);
      if (a.type === "FINISH_PLANNING") s.planningReady.push(id);
      if (
        s.players
          .filter((p) => !p.eliminated)
          .every((p) => s.planningReady.includes(p.id))
      )
        this.beginTurn();
      return;
    }
    if (a.type === "USE_CARD" || a.type === "DISCARD_CARD") {
      phase(
        "PLANNING",
        "ROLL",
        "PURCHASE_DECISION",
        "TURN_END",
        "FINANCIAL_CRISIS",
        "ENCOUNTER",
        "DETENTION",
      );
      if (p.eliminated) throw Error("Your empire has been eliminated.");
      if (s.phase !== "PLANNING") turn();
      else if (s.planningReady.includes(id))
        throw Error("Click Back to planning before playing cards.");
      if (a.type === "DISCARD_CARD") {
        const card = p.cards.findIndex((card) => card.id === a.id);
        if (card < 0) throw Error("That card is no longer in your hand.");
        p.cards.splice(card, 1);
        this.log(`${p.name} discarded a card.`);
        return;
      }
      const used = useCard(s, p, a.id);
      this.log(`${p.name} used ${cards[used].name}.`);
      if (s.phase === "DETENTION" && !p.detention) {
        s.phase = "ROLL";
        this.continueTurnClock();
      }
      this.recoverCrisis();
      return;
    }
    if (a.type === "VISIT_SERVICE") {
      phase("PLANNING");
      if (p.eliminated || s.planningReady.includes(id))
        throw Error("Return to planning before visiting a service.");
      visitService(s, p, a.service, a.card);
      this.log(`${p.name} visited the ${a.service}.`);
      return;
    }
    if (a.type === "START") {
      host();
      phase("LOBBY");
      if (
        s.players.length < 4 ||
        s.players.some((p) => !p.ready || !p.connected)
      )
        throw Error("4–15 connected, ready players are required.");
      // Seeded Fisher–Yates creates an authoritative initial turn order.
      for (let i = s.players.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [s.players[i], s.players[j]] = [s.players[j], s.players[i]];
      }
      s.cityEvent = eventIds[Math.floor(this.random() * eventIds.length)];
      s.nextCityEvent = eventIds.filter((id) => id !== s.cityEvent)[
        Math.floor(this.random() * 5)
      ];
      for (const person of s.players)
        drawCards(s, person, 1, () => this.random());
      s.round = 1;
      this.log(
        "Round 1: buy your first properties. Planning opens from round 2.",
      );
      this.beginTurn();
      return;
    }
    if (a.type === "SKIP") {
      host();
      phase(
        "PLANNING",
        "ROLL",
        "ROUTE_CHOICE",
        "PURCHASE_DECISION",
        "TURN_END",
      );
      if (s.phase === "PLANNING") {
        this.log("The host ended planning.");
        this.beginTurn();
        return;
      }
      this.log("The host skipped a movement turn.");
      this.nextTurn();
      return;
    }
    if (p.eliminated) throw Error("Your empire has been eliminated.");
    switch (a.type) {
      case "ROLL":
        turn();
        phase("ROLL");
        s.dice = [
          1 + Math.floor(this.random() * 6),
          1 + Math.floor(this.random() * 6),
        ];
        s.lastRoll = {
          id: s.version + 1,
          playerId: p.id,
          dice: [...s.dice],
          bonus: p.moveBonus,
        };
        if (s.dice[0] === s.dice[1]) p.momentum = Math.min(2, p.momentum + 1);
        s.remaining = s.dice[0] + s.dice[1] + p.moveBonus;
        p.moveBonus = 0;
        s.path = [p.position];
        this.log(`${p.name} rolled ${s.dice.join(" + ")}.`);
        this.move();
        break;
      case "ROUTE":
        turn();
        phase("ROUTE_CHOICE");
        if (!s.board[p.position].next.includes(a.tile))
          throw Error("Choose a highlighted road.");
        this.step(a.tile);
        this.move();
        break;
      case "BUY": {
        turn();
        phase("PURCHASE_DECISION");
        const t = s.board[p.position];
        const price = purchaseCost(s, t, p);
        if (t.owner || p.cash < price)
          throw Error("Not enough available cash.");
        p.cash -= price;
        p.purchaseCredit = 0;
        t.owner = id;
        this.log(`${p.name} acquired ${t.name} for $${price}.`);
        this.offerEncounter();
        break;
      }
      case "DECLINE":
        turn();
        phase("PURCHASE_DECISION");
        this.startAuction(p.position, null, "encounter");
        break;
      case "CHOOSE_ENCOUNTER": {
        turn();
        phase("ENCOUNTER");
        if (!s.encounter || s.encounter.playerId !== id)
          throw Error("No surprise to resolve.");
        if (a.choice >= 0) {
          const result = applyEncounter(s, p, s.encounter.index, a.choice, () =>
            this.random(),
          );
          this.log(`${p.name}: ${result}.`);
        } else this.log(`${p.name} skipped the surprise.`);
        if (p.detention)
          s.lastEscort = {
            id: s.version + 1,
            playerId: p.id,
            from: p.position,
          };
        this.nextTurn();
        break;
      }
      case "PAY_BAIL":
        turn();
        phase("DETENTION");
        if (!p.detention || p.cash < p.detention.bail)
          throw Error("Not enough cash for bail.");
        p.cash -= p.detention.bail;
        p.detention = null;
        p.position = 0;
        s.phase = "ROLL";
        this.continueTurnClock();
        this.log(`${p.name} paid bail and returned to HQ.`);
        break;
      case "SERVE_TIME":
        turn();
        phase("DETENTION");
        if (!p.detention) throw Error("You are not in custody.");
        p.detention.turns--;
        if (p.detention.turns <= 0) {
          p.detention = null;
          p.position = 0;
          this.log(`${p.name} completed the sentence and returned to HQ.`);
        } else this.log(`${p.name} served a turn in custody.`);
        this.nextTurn();
        break;
      case "END":
        turn();
        phase("TURN_END");
        this.nextTurn();
        break;
      case "DEVELOP": {
        phase("PLANNING");
        if (s.planningReady.includes(id))
          throw Error("Click Back to planning before building again.");
        const t = s.board[a.tile];
        develop(s, p, t);
        this.log(`${p.name} developed ${t.name} to level ${t.level}.`);
        break;
      }
      case "SELL": {
        phase("PLANNING", "FINANCIAL_CRISIS");
        if (s.phase === "FINANCIAL_CRISIS") turn();
        const t = s.board[a.tile];
        if (t.owner !== id || !t.level)
          throw Error("Select your developed property.");
        if (s.phase === "PLANNING" && s.planningReady.includes(id))
          throw Error("Click Back to planning before selling development.");
        if (lockedReason(s, t.id))
          throw Error(
            "Repay the loan or wait for the property contract to end before selling its development.",
          );
        t.level--;
        p.cash += Math.round(developmentCost(t) * 0.5);
        this.log(`${p.name} sold a level of development at ${t.name}.`);
        if (s.phase === "FINANCIAL_CRISIS" && p.cash >= 0) {
          this.recoverCrisis();
        }
        break;
      }
      case "BANKRUPT":
        turn();
        phase("FINANCIAL_CRISIS");
        this.bankrupt(p);
        break;
    }
  }
  tick() {
    const s = this.state;
    if (s.paused || !s.deadline || Date.now() < s.deadline) return false;
    const p = s.players[s.current];
    switch (s.phase) {
      case "PLANNING":
        this.beginTurn();
        break;
      case "ROLL":
        this.action(p.id, { type: "ROLL" });
        return true;
      case "ROUTE_CHOICE":
        this.action(p.id, { type: "ROUTE", tile: s.board[p.position].next[0] });
        return true;
      case "PURCHASE_DECISION":
        this.action(p.id, { type: "DECLINE" });
        return true;
      case "AUCTION":
        this.settleAuction();
        break;
      case "DETENTION":
        this.action(p.id, { type: "SERVE_TIME" });
        return true;
      case "ENCOUNTER":
      case "TURN_END":
        this.nextTurn();
        break;
      case "FINANCIAL_CRISIS":
        this.bankrupt(p);
        break;
      default:
        return false;
    }
    this.state.version++;
    return true;
  }
}
