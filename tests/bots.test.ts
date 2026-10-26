import { it, expect, vi, afterEach } from "vitest";
import { Game } from "../packages/game-core/index";
import { BotRunner, botCommand } from "../packages/game-core/bots";
import { characters } from "../packages/shared/index";
afterEach(() => vi.restoreAllMocks());
function practice(count = 3) {
  const g = new Game(undefined, 1234);
  g.join("host", "Alex", "moxie");
  for (let i = 0; i < count; i++) g.action("host", { type: "ADD_BOT" });
  return g;
}
it("has ten original, distinct characters and migrates old token snapshots", () => {
  expect(characters).toHaveLength(10);
  expect(new Set(characters.map((c) => c.style)).size).toBe(10);
  expect(new Set(characters.map((c) => c.name)).size).toBe(10);
  const g = practice();
  const saved = JSON.parse(JSON.stringify(g.state));
  saved.players[0].token = "rocket";
  saved.chat = [{ text: "old" }];
  delete saved.simulation;
  const migrated = new Game(saved);
  expect(migrated.state.players[0].token).toBe("moxie");
  expect(migrated.state).not.toHaveProperty("chat");
  expect(migrated.state.simulation.autoplay).toBe(false);
});
it("only the human host can add/remove bots, caps total seats at 15, and keeps bots ready on rematch", () => {
  const g = practice(14);
  expect(g.state.players).toHaveLength(15);
  expect(
    g.state.players.filter((p) => p.bot).every((p) => p.ready && p.connected),
  ).toBe(true);
  expect(() => g.action("host", { type: "ADD_BOT" })).toThrow();
  expect(() =>
    g.action(g.state.players[1].id, {
      type: "REMOVE_BOT",
      id: g.state.players[2].id,
    }),
  ).toThrow();
  const id = g.state.players[1].id;
  g.action("host", { type: "REMOVE_BOT", id });
  g.action("host", { type: "ADD_BOT" });
  expect(new Set(g.state.players.map((p) => p.id)).size).toBe(15);
  expect(new Set(g.state.players.map((p) => p.color)).size).toBe(15);
  g.action("host", { type: "RESTART" });
  expect(g.state.players.filter((p) => p.bot).every((p) => p.ready)).toBe(true);
  expect(g.player("host").ready).toBe(false);
});
it("bots do not automate another human and pause blocks all bot decisions", () => {
  const g = practice();
  g.join("friend", "Human", "otto");
  g.action("host", { type: "SIMULATION", autoplay: true, speed: "FAST" });
  g.action("host", { type: "READY" });
  g.action("friend", { type: "READY" });
  g.action("host", { type: "START" });
  g.state.phase = "ROLL";
  g.state.current = g.state.players.findIndex((p) => p.id === "friend");
  const runner = new BotRunner(),
    before = structuredClone(g.state);
  expect(runner.step(g, 1000)).toBe(false);
  expect(g.state).toEqual(before);
  g.state.current = g.state.players.findIndex((p) => p.bot);
  g.action("host", { type: "PAUSE" });
  expect(runner.step(g, 2000)).toBe(false);
});
it("bots buy, sell to recover crises, and develop only with legal control", () => {
  const g = practice(),
    bot = g.state.players[1];
  g.state.phase = "PURCHASE_DECISION";
  bot.position = 1;
  expect(botCommand(g.state, bot)).toEqual({ type: "BUY" });
  g.state.phase = "FINANCIAL_CRISIS";
  g.state.board[1].owner = bot.id;
  g.state.board[1].level = 1;
  expect(botCommand(g.state, bot)).toEqual({ type: "SELL", tile: 1 });
  g.state.phase = "PLANNING";
  expect(botCommand(g.state, bot)).toBeNull();
  for (const id of [2, 3]) g.state.board[id].owner = bot.id;
  expect(botCommand(g.state, bot)?.type).toBe("DEVELOP");
});
it("completes 100 seeded full matches through the real bot scheduler without stuck phases or invalid money", () => {
  let completed = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const g = practice(seed % 3 === 0 ? 14 : 3);
    g.seed = seed;
    g.action("host", { type: "SIMULATION", autoplay: true, speed: "FAST" });
    g.action("host", { type: "READY" });
    g.action("host", { type: "START" });
    const runner = new BotRunner();
    let n = 0;
    while (g.state.phase !== "GAME_OVER" && n++ < 5000) runner.step(g, n * 200);
    expect(g.state.phase).toBe("GAME_OVER");
    expect(g.state.winner).toBeTruthy();
    expect(g.state.players.every((p) => Number.isFinite(p.cash))).toBe(true);
    expect(g.state.board.every((t) => t.level >= 0 && t.level <= 4)).toBe(true);
    completed++;
  }
  expect(completed).toBe(100);
}, 20000);
