import {
  DECISION_SECONDS,
  PLANNING_SECONDS,
  CRISIS_SECONDS,
} from "../shared/timing";
import { eventIds, cards, cityEvents, encounters } from "../shared/content";
import { drawCards, applyEncounter, useCard, visitService } from "./engagement";
import { purchaseCost } from "./properties";
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
import { develop, revenue, empire, developmentCost } from "./properties";
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
  paused: false,
  log: [],
  simulation: { autoplay: false, speed: "NORMAL" },
  reactions: {},
  winner: null,
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
    };
    delete (this.state as State & { chat?: unknown }).chat;
    this.state.players.forEach((p, i) => {
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
      cash: 1800,
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
    s.host ??= id;
    s.version++;
    this.log(`${name} arrived in Nova City.`);
    return p;
  }
  deadline(seconds: number) {
    this.state.deadline = Date.now() + seconds * 1000;
  }
  planning() {
    const s = this.state;
    s.phase = "PLANNING";
    s.current = 0;
    s.planningReady = [];
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
  }
  offerEncounter() {
    const s = this.state;
    s.phase = "ENCOUNTER";
    s.encounter = {
      index: Math.floor(this.random() * encounters.length),
      playerId: s.players[s.current].id,
    };
    this.deadline(DECISION_SECONDS);
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
        this.deadline(DECISION_SECONDS);
        return;
      }
      if (t.owner !== p.id) {
        const amount = revenue(s, t);
        if (p.shield) {
          p.shield--;
          this.log(`${p.name} blocked $${amount} rent with a shield.`);
        } else {
          p.cash -= amount;
          this.player(t.owner).cash += amount;
          this.log(
            `${p.name} paid ${this.player(t.owner).name} $${amount} rent for ${t.name}.`,
          );
        }
      }
    } else if (t.type === "tax") {
      p.cash -= 120;
      this.log(`${p.name} paid $120 in city fees.`);
    } else if (t.type === "opportunity") {
      p.cash += 100;
      this.log(`${p.name} received a $100 opportunity grant.`);
    } else if (t.type === "civic") {
      p.cash += 50;
      this.log(`${p.name} received a $50 civic award.`);
    }
    s.phase = p.cash < 0 ? "FINANCIAL_CRISIS" : "TURN_END";
    this.deadline(p.cash < 0 ? CRISIS_SECONDS : DECISION_SECONDS);
    if (p.cash >= 0) this.offerEncounter();
  }
  move() {
    const s = this.state,
      p = s.players[s.current];
    while (s.remaining > 0) {
      const t = s.board[p.position];
      if (t.next.length > 1) {
        s.phase = "ROUTE_CHOICE";
        this.deadline(DECISION_SECONDS);
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
    for (const t of s.board)
      if (t.owner === p.id) {
        t.owner = null;
        t.level = 0;
      }
    p.eliminated = true;
    p.cash = 0;
    this.log(`${p.name} declared bankruptcy. Assets returned to the city.`);
    if (s.players.filter((p) => !p.eliminated).length <= 1) this.finish();
    else this.nextTurn();
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
      `${ranked[0]?.name ?? "Nobody"} wins Empire Circuit! Ties follow turn order.`,
    );
  }
  roundEnd() {
    const s = this.state;
    if (s.round >= 12) {
      this.finish();
      return;
    }
    s.round++;
    s.cityEvent =
      s.nextCityEvent ?? eventIds[Math.floor(this.random() * eventIds.length)];
    const options = eventIds.filter((id) => id !== s.cityEvent);
    s.nextCityEvent = options[Math.floor(this.random() * options.length)];
    this.log(
      `City event: ${cityEvents[s.cityEvent].name}. ${cityEvents[s.cityEvent].effect}`,
    );
    this.planning();
  }
  // Every command is transactional, including RNG. Invalid actions leave no partial changes.
  action(id: string, raw: unknown) {
    const action = commandSchema.parse(raw);
    const candidate = new Game(structuredClone(this.state), this.seed);
    candidate.apply(id, action);
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
      );
      s.paused = true;
      return;
    }
    if (a.type === "RESUME") {
      host();
      s.paused = false;
      this.deadline(
        s.phase === "FINANCIAL_CRISIS" ? CRISIS_SECONDS : DECISION_SECONDS,
      );
      return;
    }
    if (a.type === "RESTART") {
      host();
      const players = s.players.map((p) => ({
        ...p,
        ready: !!p.bot,
        eliminated: false,
        cash: 1800,
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
      };
      return;
    }
    if (s.paused) throw Error("The host has paused the game.");
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
        this.deadline(DECISION_SECONDS);
      }
      if (s.phase === "FINANCIAL_CRISIS" && p.cash >= 0) this.offerEncounter();
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
      this.planning();
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
        this.offerEncounter();
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
        this.deadline(DECISION_SECONDS);
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
        t.level--;
        p.cash += Math.round(developmentCost(t) * 0.5);
        this.log(`${p.name} sold a level of development at ${t.name}.`);
        if (s.phase === "FINANCIAL_CRISIS" && p.cash >= 0) {
          this.offerEncounter();
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
        s.phase = "TURN_END";
        this.deadline(DECISION_SECONDS);
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
