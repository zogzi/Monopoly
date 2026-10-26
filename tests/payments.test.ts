import { it, expect } from "vitest";
import { Game, empire, revenue } from "../packages/game-core/index";
import {
  charge,
  settleArrears,
  shortfall,
} from "../packages/game-core/payments";
import { settleRound } from "../packages/game-core/economy";
import { lockedReason, receivables } from "../packages/game-core/finance";
function table() {
  const g = new Game(undefined, 1337);
  for (let i = 0; i < 4; i++) {
    g.join(`p${i}`, `Person ${i}`);
    g.action(`p${i}`, { type: "READY" });
  }
  g.action("p0", { type: "START" });
  g.planning();
  g.state.cityEvent = null;
  g.state.current = g.state.players.findIndex((p) => p.id === "p0");
  return g;
}
it("does not credit unfunded rent and pays the remaining claim as cash is raised", () => {
  const g = table();
  g.state.board[1].owner = "p1";
  g.player("p0").position = 1;
  g.player("p0").cash = 10;
  const amount = revenue(g.state, g.state.board[1]);
  g.land();
  expect(g.player("p0").cash).toBe(10 - amount);
  expect(g.player("p1").cash).toBe(1810);
  expect(shortfall(g.state, "p0")).toBe(amount - 10);
  expect(receivables(g.state, "p1")).toBe(amount - 10);
  g.player("p0").cards = [{ id: "funding", kind: "grant" }];
  g.action("p0", { type: "USE_CARD", id: "funding" });
  expect(g.player("p1").cash).toBe(1800 + amount);
  expect(g.state.arrears).toEqual([]);
  expect(g.player("p0").cash).toBe(130 - amount);
  expect(g.state.phase).toBe("ENCOUNTER");
});
it("bankruptcy writes off unfunded rent instead of creating spendable money for its recipient", () => {
  const g = table();
  g.state.board[1].owner = "p1";
  g.player("p0").position = 1;
  g.player("p0").cash = 5;
  g.land();
  g.action("p0", { type: "BANKRUPT" });
  expect(g.player("p1").cash).toBe(1805);
  expect(receivables(g.state, "p1")).toBe(0);
  expect(g.state.arrears).toEqual([]);
  expect(g.player("p0").eliminated).toBe(true);
});
it("partial revenue sharing uses cumulative rounding and never pays more than collected rent", () => {
  const g = table();
  g.player("p0").cash = 0;
  charge(g.state, g.player("p0"), 37, {
    payee: "p1",
    reason: "rent",
    rent: { owner: "p1", beneficiary: "p2", percent: 33, received: 0 },
  });
  for (let i = 0; i < 37; i++) {
    g.player("p0").cash++;
    settleArrears(g.state);
  }
  expect(g.player("p1").cash).toBe(1800 + 25);
  expect(g.player("p2").cash).toBe(1800 + 12);
  expect(g.state.stats.p1.rent).toBe(37);
  expect(g.state.arrears).toEqual([]);
});
it("funded incoming payments can clear a chain of shortfalls without credit being invented", () => {
  const g = table();
  g.player("p0").cash = g.player("p1").cash = 0;
  charge(g.state, g.player("p0"), 100, { payee: "p1", reason: "contract" });
  charge(g.state, g.player("p1"), 100, { payee: "p2", reason: "contract" });
  g.player("p0").cash += 100;
  settleArrears(g.state);
  expect(g.player("p0").cash).toBe(0);
  expect(g.player("p1").cash).toBe(0);
  expect(g.player("p2").cash).toBe(1900);
  expect(g.state.arrears).toEqual([]);
});
it("mature bank principal keeps collateral pledged until actual recovery and is not double-counted", () => {
  const g = table();
  g.state.board[1].owner = "p0";
  g.action("p0", { type: "BORROW", amount: 100, collateral: [1] });
  g.player("p0").cash = 0;
  g.state.round = 4;
  settleRound(g.state, () => {});
  expect(g.player("p0").cash).toBe(-105);
  expect(lockedReason(g.state, 1)).toContain("overdue");
  expect(empire(g.state, g.player("p0"))).toBe(g.state.board[1].price - 105);
  g.player("p0").cash += 105;
  settleArrears(g.state);
  expect(lockedReason(g.state, 1)).toBeNull();
  expect(g.state.arrears).toEqual([]);
});
