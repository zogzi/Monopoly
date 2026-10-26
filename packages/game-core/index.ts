import {
  createBoard,
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
  path: [],
  remaining: 0,
  deadline: 0,
  paused: false,
  log: [],
  chat: [],
  reactions: {},
  winner: null,
});
export class Game {
  state: State;
  seed: number;
  constructor(state = initialState(), seed = Date.now() >>> 0) {
    this.state = state;
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
  join(id: string, name: string, token: Token = "rocket") {
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
      color: colors[s.players.length],
      connected: true,
      ready: false,
      eliminated: false,
      cash: 1800,
      position: 0,
      momentum: 0,
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
    this.deadline(25);
    this.log(
      `Round ${s.round}: 25 seconds to inspect and develop your district.`,
    );
  }
  beginTurn() {
    const s = this.state;
    while (s.players[s.current]?.eliminated) s.current++;
    if (s.current >= s.players.length) {
      this.roundEnd();
      return;
    }
    s.phase = "ROLL";
    s.dice = [];
    s.path = [];
    this.deadline(25);
  }
  nextTurn() {
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
        this.deadline(15);
        return;
      }
      if (t.owner !== p.id) {
        const amount = revenue(s, t);
        p.cash -= amount;
        this.player(t.owner).cash += amount;
        this.log(
          `${p.name} paid ${this.player(t.owner).name} $${amount} at ${t.name}: $${t.base} base × ${(1 + t.level * 0.6).toFixed(1)} development${t.type === "property" ? " × " + (revenue(s, t) / (t.base * (1 + t.level * 0.6))).toFixed(2) + " portfolio" : ""}.`,
        );
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
    this.deadline(p.cash < 0 ? 45 : 8);
  }
  move() {
    const s = this.state,
      p = s.players[s.current];
    while (s.remaining > 0) {
      const t = s.board[p.position];
      if (t.next.length > 1) {
        s.phase = "ROUTE_CHOICE";
        this.deadline(15);
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
      p.cash += 200;
      this.log(`${p.name} passed HQ: +$200.`);
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
    if (a.type === "CHAT") {
      s.chat.push({ name: p.name, text: a.text });
      s.chat = s.chat.slice(-80);
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
      );
      s.paused = true;
      return;
    }
    if (a.type === "RESUME") {
      host();
      s.paused = false;
      this.deadline(25);
      return;
    }
    if (a.type === "RESTART") {
      host();
      const players = s.players.map((p) => ({
        ...p,
        ready: false,
        eliminated: false,
        cash: 1800,
        position: 0,
        momentum: 0,
      }));
      this.state = {
        ...initialState(),
        version: s.version,
        players,
        host: s.host,
      };
      return;
    }
    if (s.paused) throw Error("The host has paused the game.");
    if (a.type === "READY") {
      phase("LOBBY");
      p.ready = !p.ready;
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
      s.round = 1;
      this.planning();
      return;
    }
    if (a.type === "SKIP") {
      host();
      phase("ROLL", "ROUTE_CHOICE", "PURCHASE_DECISION", "TURN_END");
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
        if (s.dice[0] === s.dice[1]) p.momentum = Math.min(2, p.momentum + 1);
        s.remaining = s.dice[0] + s.dice[1];
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
        if (t.owner || p.cash < t.price)
          throw Error("Not enough available cash.");
        p.cash -= t.price;
        t.owner = id;
        this.log(`${p.name} acquired ${t.name} for $${t.price}.`);
        s.phase = "TURN_END";
        this.deadline(8);
        break;
      }
      case "DECLINE":
        turn();
        phase("PURCHASE_DECISION");
        s.phase = "TURN_END";
        this.deadline(8);
        break;
      case "END":
        turn();
        phase("TURN_END");
        this.nextTurn();
        break;
      case "DEVELOP": {
        phase("PLANNING");
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
          s.phase = "TURN_END";
          this.deadline(8);
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
        this.deadline(5);
        break;
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
