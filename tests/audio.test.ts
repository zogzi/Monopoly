import { expect, it } from "vitest";
import { Game } from "../packages/game-core/index";
import { GameAudioEvents } from "../apps/web/src/audio/events";
import { normalizeAudioSettings } from "../apps/web/src/audio/preferences";
import { placeOwnershipLabel } from "../apps/web/src/city/Ownership";
function fixture() {
  const g = new Game(undefined, 1337);
  for (let i = 0; i < 4; i++) g.join(`p${i}`, `Person ${i}`);
  g.state.phase = "PLANNING";
  g.state.round = 2;
  g.state.current = 0;
  return g;
}
it("normalizes saved volume preferences and safely rejects malformed values", () => {
  const s = normalizeAudioSettings({
    master: 170,
    effects: -20,
    alerts: NaN,
    enabled: "false",
    movement: false,
    interface: false,
    others: false,
  });
  expect(s).toMatchObject({
    master: 100,
    effects: 0,
    alerts: 100,
    enabled: false,
    movement: false,
    interface: false,
    others: false,
  });
  expect(normalizeAudioSettings(null).master).toBe(80);
});
it("detects turn alerts independently of purchases or logs in the same update", () => {
  const g = fixture(),
    audio = new GameAudioEvents();
  audio.consume(structuredClone(g.state), "p0");
  g.state.phase = "ROLL";
  g.state.board[1].owner = "p1";
  g.state.players[1].cash -= 200;
  const events = audio.consume(structuredClone(g.state), "p0");
  expect(events).toContainEqual({ cue: "turn", remote: false });
  expect(events).toContainEqual({ cue: "purchase", remote: true });
  expect(events).not.toContainEqual({ cue: "expense", remote: true });
  expect(audio.consume(structuredClone(g.state), "p0")).toEqual([]);
});
it("plays card, service, money, custody and shortfall cues from actual state changes", () => {
  const g = fixture(),
    audio = new GameAudioEvents(),
    p = g.player("p0");
  p.cards = [{ id: "cash", kind: "grant" }];
  audio.consume(structuredClone(g.state), p.id);
  g.action(p.id, { type: "USE_CARD", id: "cash" });
  expect(audio.consume(structuredClone(g.state), p.id)).toContainEqual({
    cue: "card",
    remote: false,
  });
  g.action(p.id, { type: "VISIT_SERVICE", service: "contractor" });
  expect(audio.consume(structuredClone(g.state), p.id)).toContainEqual({
    cue: "service",
    remote: false,
  });
  const current = g.player(p.id);
  current.cash -= 50;
  expect(audio.consume(structuredClone(g.state), p.id)).toContainEqual({
    cue: "expense",
    remote: false,
  });
  current.detention = { turns: 2, bail: 200 };
  expect(audio.consume(structuredClone(g.state), p.id)).toContainEqual({
    cue: "arrest",
    remote: false,
  });
  current.detention = null;
  expect(audio.consume(structuredClone(g.state), p.id)).toContainEqual({
    cue: "release",
    remote: false,
  });
  g.state.phase = "FINANCIAL_CRISIS";
  current.cash = -5;
  expect(audio.consume(structuredClone(g.state), p.id)).toContainEqual({
    cue: "crisis",
    remote: false,
  });
});
it("does not replay old game events on reconnect and recognizes new results", () => {
  const g = fixture(),
    audio = new GameAudioEvents();
  g.state.lastMarketEvent = { id: 12, kind: "loan", player: "p0" };
  expect(audio.consume(structuredClone(g.state), "p0")).toEqual([]);
  audio.reset();
  expect(audio.consume(structuredClone(g.state), "p0")).toEqual([]);
  g.state.phase = "GAME_OVER";
  g.state.winner = "p1";
  expect(audio.consume(structuredClone(g.state), "p0")).toContainEqual({
    cue: "lose",
    remote: false,
  });
});
it("keeps dense ownership labels inside the map without covering one another", () => {
  const used: ReturnType<typeof placeOwnershipLabel>[] = [];
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const b = placeOwnershipLabel(
      430 + Math.cos(a) * 200,
      450 + Math.sin(a) * 140,
      102,
      36,
      850,
      890,
      used,
    );
    expect(b.x).toBeGreaterThanOrEqual(8);
    expect(b.y).toBeGreaterThanOrEqual(68);
    expect(b.x + b.w).toBeLessThanOrEqual(842);
    expect(b.y + b.h).toBeLessThanOrEqual(804);
    expect(
      used.some(
        (p) =>
          b.x < p.x + p.w &&
          b.x + b.w > p.x &&
          b.y < p.y + p.h &&
          b.y + b.h > p.y,
      ),
    ).toBe(false);
    used.push(b);
  }
});

it("does not play a repayment celebration when debt only becomes an unfunded claim", () => {
  const g = fixture(),
    audio = new GameAudioEvents();
  g.state.phase = "ROLL";
  g.state.loans = [
    {
      id: "due",
      borrower: "p0",
      balance: 100,
      rate: 0.05,
      issuedRound: 0,
      dueRound: 2,
      collateral: [],
    },
  ];
  audio.consume(structuredClone(g.state), "p0");
  g.state.loans = [];
  g.state.arrears = [{ payer: "p0", payee: null, amount: 100, reason: "bank" }];
  g.player("p0").cash = -100;
  g.state.phase = "FINANCIAL_CRISIS";
  const events = audio.consume(structuredClone(g.state), "p0");
  expect(events).toContainEqual({ cue: "crisis", remote: false });
  expect(events.some((e) => e.cue === "repay")).toBe(false);
});
