import { describe, it, expect } from "vitest";
import { Game, controlled, revenue, empire } from "../packages/game-core/index";
function setup(count = 4) {
  const g = new Game(undefined, 1729);
  for (let i = 0; i < count; i++) {
    g.join(`p${i}`, `Tycoon ${i}`, "robot");
    g.action(`p${i}`, { type: "READY" });
  }
  g.action("p0", { type: "START" });
  return g;
}
function player(g: Game) {
  return g.state.players[g.state.current];
}
function phase(g: Game, phase: Game["state"]["phase"]) {
  g.state.phase = phase;
  g.state.deadline = Date.now() + 1000;
}
describe("authoritative core", () => {
  it("requires 4 ready players, caps at 15, and randomizes turn order", () => {
    const g = new Game(undefined, 1729);
    g.join("a", "Alex");
    expect(() => g.action("a", { type: "START" })).toThrow();
    const full = setup(15);
    expect(full.state.players).toHaveLength(15);
    expect(() => full.join("extra", "Extra")).toThrow();
    expect(full.state.players.map((p) => p.id)).not.toEqual(
      Array.from({ length: 15 }, (_, i) => `p${i}`),
    );
  });
  it("rejects wrong-player, malformed and wrong-phase actions without changing state or RNG", () => {
    const g = setup();
    phase(g, "ROLL");
    const before = structuredClone(g.state),
      seed = g.seed;
    expect(() => g.action(g.state.players[1].id, { type: "ROLL" })).toThrow();
    expect(() => g.action(player(g).id, { type: "BUY" })).toThrow();
    expect(() => g.action(player(g).id, { type: "ROUTE", tile: -1 })).toThrow();
    expect(g.state).toEqual(before);
    expect(g.seed).toBe(seed);
  });
  it("uses reproducible dice and legal roads, stops at junctions and buys once", () => {
    const a = setup(),
      b = setup();
    phase(a, "ROLL");
    phase(b, "ROLL");
    a.action(player(a).id, { type: "ROLL" });
    b.action(player(b).id, { type: "ROLL" });
    expect(a.state.dice).toEqual(b.state.dice);
    expect(a.state.phase).toBe("ROUTE_CHOICE");
    a.action(player(a).id, { type: "ROUTE", tile: 1 });
    expect(a.state.phase).toBe("PURCHASE_DECISION");
    const p = player(a),
      t = a.state.board[p.position],
      cash = p.cash;
    a.action(p.id, { type: "BUY" });
    expect(a.state.board[t.id].owner).toBe(p.id);
    expect(player(a).cash).toBe(cash - t.price);
    const before = structuredClone(a.state);
    expect(() => a.action(p.id, { type: "BUY" })).toThrow();
    expect(a.state).toEqual(before);
  });
  it("earns HQ income, pays correct revenue and preserves total player cash", () => {
    const g = setup();
    const p = player(g),
      owner = g.state.players[1];
    p.position = 39;
    g.state.remaining = 2;
    g.state.path = [];
    g.step(0);
    expect(p.cash).toBe(2000);
    g.state.board[1].owner = owner.id;
    g.state.board[2].owner = owner.id;
    g.state.board[1].level = 2;
    p.position = 1;
    const amount = revenue(g.state, g.state.board[1]);
    expect(amount).toBe(Math.round(g.state.board[1].base * 2.2 * 1.1));
    const sum = g.state.players.reduce((n, p) => n + p.cash, 0);
    g.land();
    expect(p.cash).toBe(2000 - amount);
    expect(g.state.players.reduce((n, p) => n + p.cash, 0)).toBe(sum);
  });
  it("enforces control, capacity, landmark access and cash for development", () => {
    const g = setup(),
      p = player(g);
    p.cash = 50000;
    g.state.board[1].owner = p.id;
    expect(() => g.action(p.id, { type: "DEVELOP", tile: 1 })).toThrow();
    g.state.board[2].owner = p.id;
    g.state.board[3].owner = p.id;
    expect(controlled(g.state, p.id, 0)).toBe(3);
    for (let i = 0; i < 3; i++) g.action(p.id, { type: "DEVELOP", tile: 1 });
    expect(() => g.action(p.id, { type: "DEVELOP", tile: 1 })).toThrow();
    g.state.board[4].owner = p.id;
    g.action(p.id, { type: "DEVELOP", tile: 1 });
    expect(g.state.board[1].level).toBe(4);
    expect(() => g.action(p.id, { type: "DEVELOP", tile: 1 })).toThrow();
  });
  it("allows crisis recovery by selling development and liquidates bankrupt assets", () => {
    const g = setup();
    const p = player(g);
    p.cash = -10;
    g.state.board[1].owner = p.id;
    g.state.board[1].level = 1;
    phase(g, "FINANCIAL_CRISIS");
    g.action(p.id, { type: "SELL", tile: 1 });
    expect(g.state.phase).toBe("TURN_END");
    expect(player(g).cash).toBeGreaterThanOrEqual(0);
    phase(g, "FINANCIAL_CRISIS");
    g.action(p.id, { type: "BANKRUPT" });
    expect(g.player(p.id).eliminated).toBe(true);
    expect(g.state.board[1].owner).toBeNull();
    expect(g.state.board[1].level).toBe(0);
  });
  it("pauses timers, enforces reaction cooldown, and preserves seats on rematch", () => {
    const g = setup();
    g.action("p0", { type: "PAUSE" });
    g.state.deadline = 1;
    expect(g.tick()).toBe(false);
    g.action("p0", { type: "RESUME" });
    g.action("p0", { type: "REACTION", emoji: "🔥" });
    expect(() => g.action("p0", { type: "REACTION", emoji: "🔥" })).toThrow();
    g.action("p0", { type: "RESTART" });
    expect(g.state.phase).toBe("LOBBY");
    expect(g.state.players).toHaveLength(4);
    expect(
      g.state.players.every(
        (p) => !p.ready && p.cash === 1800 && p.position === 0,
      ),
    ).toBe(true);
  });
  it.each([4, 10, 15])(
    "completes a full 12-round Capital Race with %i players",
    (count) => {
      const g = setup(count);
      let steps = 0;
      while (g.state.phase !== "GAME_OVER" && steps++ < 10000) {
        g.state.deadline = 1;
        if (g.state.phase === "PURCHASE_DECISION") {
          const p = player(g),
            t = g.state.board[p.position];
          if (p.cash > t.price + 300) g.action(p.id, { type: "BUY" });
          else g.tick();
        } else if (g.state.phase === "ROUTE_CHOICE")
          g.action(player(g).id, {
            type: "ROUTE",
            tile: g.state.board[player(g).position].next[0],
          });
        else g.tick();
      }
      expect(g.state.phase).toBe("GAME_OVER");
      expect(g.state.round).toBeLessThanOrEqual(12);
      const active = g.state.players.filter((p) => !p.eliminated);
      expect(g.state.winner).toBe(
        active.sort((a, b) => empire(g.state, b) - empire(g.state, a))[0].id,
      );
      expect(steps).toBeLessThan(10000);
    },
  );
});
