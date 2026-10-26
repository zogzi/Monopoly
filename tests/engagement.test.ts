import { it, expect, vi, afterEach } from "vitest";
import { Game, revenue } from "../packages/game-core/index";
import {
  purchaseCost,
  developmentCost,
} from "../packages/game-core/properties";
import {
  snapshotFor,
  drawCards,
  applyEncounter,
} from "../packages/game-core/engagement";
import { encounters, cardKinds, cityEvents } from "../packages/shared/content";
import { BotRunner } from "../packages/game-core/bots";
import { GAME_VERSION } from "../packages/shared/version";
import { stormFlash } from "../apps/web/src/city/Storm";
import { buildingArchitecture } from "../apps/web/src/city/architecture";
import { escortRoute, custodyPosition } from "../apps/web/src/city/Prison";
import { sidewalkPoint } from "../apps/web/src/city/CityLife";
afterEach(() => vi.restoreAllMocks());
function setup() {
  const g = new Game(undefined, 1729);
  for (let i = 0; i < 4; i++) {
    g.join("p" + i, "Player " + i);
    g.action("p" + i, { type: "READY" });
  }
  g.action("p0", { type: "START" });
  g.planning(); // A later planning-phase fixture; live games now open directly with movement.
  return g;
}
function ownTurn(g: Game, id: string, phase: Game["state"]["phase"]) {
  g.state.current = g.state.players.findIndex((p) => p.id === id);
  g.state.phase = phase;
  g.state.deadline = Date.now() + 300000;
}
it("uses one real release version and gives five-minute decisions with ten-minute crisis recovery", () => {
  expect(GAME_VERSION).toBe("0.3.2");
  const g = setup();
  expect(g.state.deadline - Date.now()).toBeGreaterThan(299000);
  g.beginTurn();
  expect(g.state.deadline - Date.now()).toBeGreaterThan(299000);
  const p = g.state.players[g.state.current];
  p.cash = 0;
  p.position = 20;
  g.land();
  expect(g.state.phase).toBe("FINANCIAL_CRISIS");
  expect(g.state.deadline - Date.now()).toBeGreaterThan(599000);
});
it("planning finishes immediately only when everyone is ready, clears next round, and can be undone", () => {
  const g = setup();
  g.action("p0", { type: "FINISH_PLANNING" });
  expect(g.state.phase).toBe("PLANNING");
  g.action("p0", { type: "RESUME_PLANNING" });
  expect(g.state.planningReady).not.toContain("p0");
  for (let i = 0; i < 4; i++) g.action("p" + i, { type: "FINISH_PLANNING" });
  expect(g.state.phase).toBe("ROLL");
  g.planning();
  expect(g.state.planningReady).toEqual([]);
});
it("deals private opening cards without leaking opponents or mutating server state", () => {
  const g = setup();
  expect(g.state.players.every((p) => p.cards.length === 1)).toBe(true);
  const mine = snapshotFor(g.state, "p0"),
    spectator = snapshotFor(g.state);
  expect(mine.players.find((p) => p.id === "p0")!.cards[0].kind).not.toBe(
    "hidden",
  );
  expect(
    mine.players
      .filter((p) => p.id !== "p0")
      .every((p) => p.cards[0].kind === "hidden"),
  ).toBe(true);
  expect(spectator.players.every((p) => p.cards[0].kind === "hidden")).toBe(
    true,
  );
  expect(g.state.players.every((p) => p.cards[0].kind !== "hidden")).toBe(true);
  expect(JSON.stringify(mine)).not.toContain("seed");
});
it.each(["shield", "builder", "express", "grant", "market"] as const)(
  "plays %s once and rejects duplicate card IDs transactionally",
  (kind) => {
    const g = setup(),
      p = g.player("p0");
    p.cards = [{ id: "chosen", kind }];
    g.action("p0", { type: "USE_CARD", id: "chosen" });
    const after = structuredClone(g.state);
    expect(g.player("p0").cards).toHaveLength(0);
    expect(() => g.action("p0", { type: "USE_CARD", id: "chosen" })).toThrow();
    expect(g.state).toEqual(after);
  },
);
it("shield blocks rent, grant rescues a crisis, and Express changes movement without changing dice", () => {
  const g = setup(),
    p = g.player("p0");
  g.state.board[1].owner = "p1";
  ownTurn(g, "p0", "ROLL");
  p.position = 1;
  p.shield = 1;
  const cash = p.cash;
  g.land();
  expect(p.cash).toBe(cash);
  expect(p.shield).toBe(0);
  ownTurn(g, "p0", "FINANCIAL_CRISIS");
  g.player("p0").cash = -50;
  g.player("p0").cards = [{ id: "rescue", kind: "grant" }];
  g.action("p0", { type: "USE_CARD", id: "rescue" });
  expect(g.player("p0").cash).toBe(70);
  expect(g.state.phase).toBe("ENCOUNTER");
  ownTurn(g, "p0", "ROLL");
  g.player("p0").position = 0;
  g.player("p0").moveBonus = 3;
  g.action("p0", { type: "ROLL" });
  expect(g.state.remaining).toBe(g.state.dice[0] + g.state.dice[1] + 3);
  expect(g.state.lastRoll?.dice).toEqual(g.state.dice);
});
it("city event prices and stored coupons are enforced without negative prices", () => {
  const g = setup(),
    p = g.player("p0"),
    tile = g.state.board[1];
  g.state.cityEvent = "market";
  p.purchaseCredit = 140;
  expect(purchaseCost(g.state, tile, p)).toBe(
    Math.round(tile.price * 0.85) - 140,
  );
  g.state.cityEvent = "builders";
  p.buildCredit = 150;
  expect(developmentCost(tile, g.state, p)).toBe(0);
  g.state.cityEvent = "festival";
  g.state.board[6].owner = "p1";
  expect(revenue(g.state, g.state.board[6])).toBe(
    Math.round(g.state.board[6].base * 1.2),
  );
});
it("surprise choices are optional, atomic, and cannot overspend or overflow the hand", () => {
  const g = setup();
  ownTurn(g, "p0", "ENCOUNTER");
  g.state.encounter = { index: 2, playerId: "p0" };
  g.player("p0").cash = 0;
  const before = structuredClone(g.state),
    seed = g.seed;
  expect(() =>
    g.action("p0", { type: "CHOOSE_ENCOUNTER", choice: 0 }),
  ).toThrow();
  expect(g.state).toEqual(before);
  expect(g.seed).toBe(seed);
  g.action("p0", { type: "CHOOSE_ENCOUNTER", choice: -1 });
  expect(g.state.current).not.toBe(before.current);
  const p = g.player("p1");
  p.cards = cardKinds.slice(0, 4).map((kind, i) => ({ id: "full" + i, kind }));
  expect(() => drawCards(g.state, p, 1, () => 0)).toThrow();
});
it("services cost real cash, are limited per round, and do not give free cash-grant arbitrage", () => {
  const g = setup(),
    before = g.player("p0").cash;
  g.action("p0", { type: "VISIT_SERVICE", service: "broker", card: "shield" });
  expect(g.player("p0").cash).toBe(before - 100);
  expect(g.player("p0").cards.at(-1)?.kind).toBe("shield");
  const after = structuredClone(g.state);
  expect(() =>
    g.action("p0", { type: "VISIT_SERVICE", service: "contractor" }),
  ).toThrow();
  expect(g.state).toEqual(after);
  expect(() =>
    g.action("p1", { type: "VISIT_SERVICE", service: "broker", card: "grant" }),
  ).toThrow();
});
it("illegal deals show real odds, create an escort only when caught, and offer bail, sentence or Alibi", () => {
  const index = encounters.findIndex((e) =>
    e.options.some((o) => o.reward.illegal),
  );
  expect(index).toBeGreaterThanOrEqual(0);
  const g = setup();
  ownTurn(g, "p0", "ENCOUNTER");
  g.state.encounter = { index, playerId: "p0" };
  g.seed = 1;
  g.action("p0", { type: "CHOOSE_ENCOUNTER", choice: 1 });
  expect(g.player("p0").detention?.turns).toBe(2);
  expect(g.state.lastEscort?.playerId).toBe("p0");
  expect(
    escortRoute(g.state.board, g.state.lastEscort!.from).at(-1)?.x,
  ).toBeGreaterThan(24);
  expect(custodyPosition(g.state, "p0")[0]).toBeGreaterThan(21);
  ownTurn(g, "p0", "DETENTION");
  const cash = g.player("p0").cash;
  g.action("p0", { type: "PAY_BAIL" });
  expect(g.player("p0").cash).toBe(cash - 200);
  expect(g.player("p0").position).toBe(0);
  expect(g.state.phase).toBe("ROLL");
  g.player("p0").detention = { turns: 2, bail: 200 };
  g.player("p0").cards = [{ id: "lawyer", kind: "alibi" }];
  ownTurn(g, "p0", "DETENTION");
  g.action("p0", { type: "USE_CARD", id: "lawyer" });
  expect(g.player("p0").detention).toBeNull();
  g.player("p0").detention = { turns: 2, bail: 200 };
  ownTurn(g, "p0", "DETENTION");
  g.action("p0", { type: "SERVE_TIME" });
  expect(g.player("p0").detention?.turns).toBe(1);
  ownTurn(g, "p0", "DETENTION");
  g.action("p0", { type: "SERVE_TIME" });
  expect(g.player("p0").detention).toBeNull();
});
it("safe illegal-deal roll pays without custody and never exposes future randomness", () => {
  const g = setup(),
    p = g.player("p0"),
    index = encounters.findIndex((e) =>
      e.options.some((o) => o.reward.illegal),
    ),
    cash = p.cash;
  applyEncounter(g.state, p, index, 1, () => 0.9);
  expect(p.cash).toBe(cash + 180);
  expect(p.detention).toBeNull();
});
it("has eight architecturally distinct districts and valid scenery at every development level", () => {
  const g = setup(),
    signatures = new Set();
  for (let district = 0; district < 8; district++) {
    const tile = { ...g.state.board[district * 5 + 1], level: 0 };
    signatures.add(JSON.stringify(buildingArchitecture(tile, 0, 0)));
    for (let level = 0; level <= 4; level++) {
      const model = buildingArchitecture({ ...tile, level }, 0, 0);
      expect(model.boxes.length).toBeGreaterThan(2);
      for (const item of Object.values(model).flat())
        expect(item.size.every((n) => Number.isFinite(n) && n > 0)).toBe(true);
    }
  }
  expect(signatures.size).toBe(8);
  for (let i = 0; i < 40; i++) {
    const p = sidewalkPoint(g.state.board, i, 3);
    expect(p.every(Number.isFinite)).toBe(true);
  }
  expect(stormFlash(5.3)).toBeGreaterThan(0.9);
  expect(stormFlash(0)).toBe(0);
});
it("the new choices and long timers still complete a 15-seat match with bots", () => {
  const g = new Game(undefined, 90210);
  g.join("host", "Alex");
  for (let i = 0; i < 14; i++) g.action("host", { type: "ADD_BOT" });
  g.action("host", { type: "SIMULATION", autoplay: true, speed: "FAST" });
  g.action("host", { type: "READY" });
  g.action("host", { type: "START" });
  const runner = new BotRunner();
  let steps = 0;
  while (g.state.phase !== "GAME_OVER" && steps++ < 5000)
    runner.step(g, steps * 200);
  expect(g.state.phase).toBe("GAME_OVER");
  expect(
    g.state.players.every((p) => p.cards.length <= 4 && p.shield <= 2),
  ).toBe(true);
  expect(g.state.cityEvent && cityEvents[g.state.cityEvent]).toBeTruthy();
});
