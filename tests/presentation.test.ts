import { it, expect } from "vitest";
import { Game } from "../packages/game-core/index";
import { shareSnapshot } from "../apps/web/src/presentation";
import { characterGeometry } from "../apps/web/src/city/characterGeometry";
import { characters } from "../packages/shared/index";
it("retains geometry references for turn and cash snapshots without hiding gameplay changes", () => {
  const game = new Game();
  game.join("a", "Alex");
  game.join("b", "Ben");
  const before = game.state,
    next = structuredClone(before);
  next.players[0].cash -= 100;
  next.current = 1;
  next.phase = "ROLL";
  const result = shareSnapshot(before, next);
  expect(result.board).toBe(before.board);
  expect(result.players[1]).toBe(before.players[1]);
  expect(result.players[0]).not.toBe(before.players[0]);
  expect(result.players[0].cash).toBe(1700);
  expect(result.current).toBe(1);
  expect(result.phase).toBe("ROLL");
});
it("updates ownership, buildings, routes and player order while retaining unaffected objects", () => {
  const game = new Game();
  game.join("a", "Alex");
  game.join("b", "Ben");
  const before = game.state,
    next = structuredClone(before);
  next.board[1].owner = "a";
  next.board[1].level = 2;
  next.board[0].next = [1];
  next.players.reverse();
  const result = shareSnapshot(before, next);
  expect(result.board[1].level).toBe(2);
  expect(result.board[1].owner).toBe("a");
  expect(result.board[0].next).toEqual([1]);
  expect(result.board[2]).toBe(before.board[2]);
  expect(result.players[0]).toBe(before.players[1]);
  expect(result.players[1]).toBe(before.players[0]);
});
it("caches ten distinct character designs in at most three batches each", () => {
  const signatures = new Set();
  for (const c of characters) {
    const parts = characterGeometry(c.id);
    expect(characterGeometry(c.id)).toBe(parts);
    expect(parts.boxes.length).toBeGreaterThan(7);
    expect(parts.balls.length).toBeGreaterThan(0);
    for (const part of [...parts.boxes, ...parts.balls, ...parts.cones])
      expect(part.size.every((n) => Number.isFinite(n) && n > 0)).toBe(true);
    signatures.add(JSON.stringify(parts));
  }
  expect(signatures.size).toBe(10);
});
