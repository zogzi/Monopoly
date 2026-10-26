import { afterEach, expect, it, vi } from "vitest";
import { Game } from "../packages/game-core/index";
afterEach(() => vi.useRealTimers());
function start() {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-26T12:00:00Z"));
  const g = new Game(undefined, 1337);
  for (let i = 0; i < 4; i++) {
    g.join(`p${i}`, `Person ${i}`);
    g.action(`p${i}`, { type: "READY" });
  }
  g.action("p0", { type: "START" });
  return g;
}
it("round one immediately starts buying and movement, without an empty build phase", () => {
  const g = start();
  expect(g.state.phase).toBe("ROLL");
  expect(g.state.round).toBe(1);
  expect(g.state.board.every((t) => !t.owner)).toBe(true);
  g.roundEnd();
  expect(g.state.round).toBe(2);
  expect(g.state.phase).toBe("PLANNING");
});
it("rolling, selecting a road, purchasing and choosing a surprise share one five-minute turn", () => {
  const g = start(),
    id = g.state.players[g.state.current].id,
    deadline = g.state.deadline;
  g.seed = 1;
  vi.advanceTimersByTime(60000);
  g.action(id, { type: "ROLL" });
  expect(g.state.phase).toBe("ROUTE_CHOICE");
  expect(g.state.deadline).toBe(deadline);
  vi.advanceTimersByTime(30000);
  g.action(id, { type: "ROUTE", tile: 1 });
  expect(g.state.phase).toBe("PURCHASE_DECISION");
  expect(g.state.deadline).toBe(deadline);
  vi.advanceTimersByTime(10000);
  g.action(id, { type: "BUY" });
  expect(g.state.deadline).toBe(deadline);
  g.action(id, { type: "CHOOSE_ENCOUNTER", choice: -1 });
  expect(g.state.players[g.state.current].id).not.toBe(id);
  expect(g.state.deadline).toBe(Date.now() + 300000);
});
it("an auction pauses the current player's remaining budget instead of resetting it", () => {
  const g = start(),
    id = g.state.players[g.state.current].id;
  g.seed = 1;
  g.action(id, { type: "ROLL" });
  g.action(id, { type: "ROUTE", tile: 1 });
  vi.advanceTimersByTime(90000);
  g.action(id, { type: "DECLINE" });
  expect(g.state.auction?.turnRemainingMs).toBe(210000);
  vi.advanceTimersByTime(120000);
  for (const p of [...g.state.players])
    g.action(p.id, { type: "PASS_AUCTION" });
  expect(g.state.phase).toBe("ENCOUNTER");
  expect(g.state.deadline - Date.now()).toBe(210000);
});
it("pause/resume preserves time and cannot be used on a running game to refill it", () => {
  const g = start();
  vi.advanceTimersByTime(100000);
  g.action("p0", { type: "PAUSE" });
  vi.advanceTimersByTime(90000);
  g.action("p0", { type: "RESUME" });
  expect(g.state.deadline - Date.now()).toBe(200000);
  expect(g.state.turnDeadline).toBe(g.state.deadline);
  const before = structuredClone(g.state);
  expect(() => g.action("p0", { type: "RESUME" })).toThrow();
  expect(g.state).toEqual(before);
});
it("cash recovery has ten minutes and restores the exact unused normal-turn budget", () => {
  const g = start(),
    p = g.state.players[g.state.current];
  p.position = 20;
  p.cash = 0;
  vi.advanceTimersByTime(220000);
  g.land();
  expect(g.state.deadline - Date.now()).toBe(600000);
  vi.advanceTimersByTime(300000);
  g.player(p.id).cards = [{ id: "rescue", kind: "grant" }];
  g.action(p.id, { type: "USE_CARD", id: "rescue" });
  expect(g.state.phase).toBe("ENCOUNTER");
  expect(g.state.deadline - Date.now()).toBe(80000);
});
