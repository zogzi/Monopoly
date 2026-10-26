import { describe, expect, it } from "vitest";
import { Game, empire } from "../packages/game-core/index";
import { capacity, settleRound } from "../packages/game-core/economy";
import { bankDebt, credit, lockedReason } from "../packages/game-core/finance";
import { snapshotFor } from "../packages/game-core/engagement";
import { BotRunner } from "../packages/game-core/bots";
import type { Clause, OfferDraft } from "../packages/shared/economy";
function setup() {
  const g = new Game(undefined, 1729);
  for (let i = 0; i < 4; i++) {
    g.join(`p${i}`, `Player ${i}`);
    g.action(`p${i}`, { type: "READY" });
  }
  g.action("p0", { type: "START" });
  for (const id of [1, 2, 6, 7]) g.state.board[id].owner = id < 5 ? "p0" : "p1";
  return g;
}
const draft = (clauses: Clause[] = []): OfferDraft => ({
  to: "p1",
  give: { cash: 100, tiles: [1, 2] },
  take: { cash: 50, tiles: [6, 7] },
  clauses,
});
function offer(g: Game, clauses: Clause[] = [], data = draft(clauses)) {
  g.action("p0", { type: "OFFER_TRADE", offer: data });
  return g.state.offers.at(-1)!.id;
}
function accept(g: Game, clauses: Clause[] = [], data?: OfferDraft) {
  const id = offer(g, clauses, data);
  g.action("p1", { type: "ACCEPT_TRADE", id });
  return id;
}
function atomic(g: Game, f: () => void) {
  const before = structuredClone(g.state),
    seed = g.seed;
  expect(f).toThrow();
  expect(g.state).toEqual(before);
  expect(g.seed).toBe(seed);
}
describe("private, transactional trading", () => {
  it("exchanges multiple properties and cash exactly once and records actual stats", () => {
    const g = setup(),
      total = g.state.players.reduce((n, p) => n + p.cash, 0),
      id = accept(g);
    expect(g.player("p0").cash).toBe(1750);
    expect(g.player("p1").cash).toBe(1850);
    expect(g.state.board[1].owner).toBe("p1");
    expect(g.state.board[7].owner).toBe("p0");
    expect(g.state.players.reduce((n, p) => n + p.cash, 0)).toBe(total);
    expect(g.state.stats.p0.trades).toBe(1);
    expect(g.state.stats.p1.trades).toBe(1);
    atomic(g, () => g.action("p1", { type: "ACCEPT_TRADE", id }));
  });
  it("only shows an offer to its parties and keeps the server save complete", () => {
    const g = setup(),
      id = offer(g);
    expect(snapshotFor(g.state, "p0").offers[0].id).toBe(id);
    expect(snapshotFor(g.state, "p1").offers[0].id).toBe(id);
    expect(snapshotFor(g.state, "p2").offers).toEqual([]);
    expect(snapshotFor(g.state).offers).toEqual([]);
    expect(g.state.offers).toHaveLength(1);
    expect(g.state.log[0].text).not.toContain("$100");
  });
  it("counteroffers replace the old terms and invalidate old acceptance", () => {
    const g = setup(),
      id = offer(g);
    g.action("p1", {
      type: "OFFER_TRADE",
      offer: {
        to: "p0",
        give: { cash: 0, tiles: [6] },
        take: { cash: 300, tiles: [] },
        clauses: [],
        counter: id,
      },
    });
    expect(g.state.offers).toHaveLength(1);
    expect(g.state.offers[0].from).toBe("p1");
    atomic(g, () => g.action("p1", { type: "ACCEPT_TRADE", id }));
    g.action("p0", { type: "ACCEPT_TRADE", id: g.state.offers[0].id });
    expect(g.state.board[6].owner).toBe("p0");
  });
  it("revalidates cash, ownership, collateral and participant permissions on acceptance", () => {
    const g = setup(),
      id = offer(g);
    atomic(g, () => g.action("p2", { type: "ACCEPT_TRADE", id }));
    atomic(g, () => g.action("p1", { type: "CANCEL_TRADE", id }));
    g.player("p0").cash = 0;
    atomic(g, () => g.action("p1", { type: "ACCEPT_TRADE", id }));
    g.player("p0").cash = 1800;
    g.state.board[1].owner = "p2";
    atomic(g, () => g.action("p1", { type: "ACCEPT_TRADE", id }));
    g.state.board[1].owner = "p0";
    g.action("p0", { type: "BORROW", amount: 50, collateral: [1] });
    atomic(g, () => g.action("p1", { type: "ACCEPT_TRADE", id }));
  });
  it("cannot duplicate properties, split developed control illegally or trade after finishing planning", () => {
    const g = setup();
    atomic(g, () =>
      offer(g, [], { ...draft(), give: { cash: 0, tiles: [1, 1] } }),
    );
    g.state.board[3].owner = "p0";
    g.state.board[1].level = 1;
    atomic(g, () => offer(g));
    g.state.board[1].level = 0;
    g.action("p0", { type: "FINISH_PLANNING" });
    atomic(g, () => offer(g));
  });
});
describe("secured loans and equity", () => {
  it("enforces 65% collateral limits, partial repayment, full release and debt-aware scores", () => {
    const g = setup(),
      before = empire(g.state, g.player("p0")),
      limit = capacity(g.state, [1, 2]);
    atomic(g, () =>
      g.action("p0", { type: "BORROW", amount: limit + 1, collateral: [1, 2] }),
    );
    atomic(g, () =>
      g.action("p0", { type: "BORROW", amount: 1, collateral: [6] }),
    );
    g.action("p0", { type: "BORROW", amount: 200, collateral: [1, 2] });
    const loan = g.state.loans[0];
    expect(bankDebt(g.state, "p0")).toBe(200);
    expect(empire(g.state, g.player("p0"))).toBe(before);
    expect(lockedReason(g.state, 1)).toContain("bank");
    g.action("p0", { type: "REPAY_LOAN", id: loan.id, amount: 50 });
    expect(g.state.loans[0].balance).toBe(150);
    expect(lockedReason(g.state, 1)).toBeTruthy();
    g.action("p0", { type: "REPAY_LOAN", id: loan.id, amount: 150 });
    expect(lockedReason(g.state, 1)).toBeNull();
    expect(g.state.loans).toEqual([]);
    expect(empire(g.state, g.player("p0"))).toBe(before);
  });
  it("refinances only unused equity, without postponing maturity or changing the rate", () => {
    const g = setup();
    g.action("p0", { type: "BORROW", amount: 50, collateral: [1, 2] });
    const loan = structuredClone(g.state.loans[0]),
      room = capacity(g.state, [1, 2]) - 50;
    g.action("p0", { type: "REFINANCE", id: loan.id, amount: room });
    expect(g.state.loans[0].balance).toBe(50 + room);
    expect(g.state.loans[0].dueRound).toBe(loan.dueRound);
    expect(g.state.loans[0].rate).toBe(loan.rate);
    atomic(g, () =>
      g.action("p0", { type: "REFINANCE", id: loan.id, amount: 1 }),
    );
  });
  it("charges interest once per round, matures once, and gives ten-minute recovery before planning", () => {
    const g = setup();
    g.action("p0", { type: "BORROW", amount: 200, collateral: [1, 2] });
    const before = g.player("p0").cash;
    settleRound(g.state, () => {});
    expect(g.player("p0").cash).toBe(before);
    g.state.round = 2;
    settleRound(g.state, () => {});
    expect(g.player("p0").cash).toBe(before - 10);
    settleRound(g.state, () => {});
    expect(g.player("p0").cash).toBe(before - 10);
    g.player("p0").cash = 0;
    g.state.round = 4;
    g.roundEnd();
    expect(g.player("p0").cash).toBe(-210);
    expect(g.state.loans).toEqual([]);
    expect(g.state.phase).toBe("FINANCIAL_CRISIS");
    expect(g.state.crisisResume).toBe("planning");
    expect(g.state.deadline - Date.now()).toBeGreaterThan(599000);
    expect(lockedReason(g.state, 1)).toContain("overdue");
    g.state.board[3].owner = "p0";
    g.state.board[4].owner = "p0";
    g.action("p0", { type: "BORROW", amount: 250, collateral: [3, 4] });
    expect(g.state.phase).toBe("PLANNING");
    expect(lockedReason(g.state, 1)).toBeNull();
    expect(g.state.round).toBe(5);
    expect(credit(g.state, g.player("p0")).grade).not.toBe("AAA");
  });
});
describe("server-enforced contracts", () => {
  const cashOnly = (clauses: Clause[]): OfferDraft => ({
    to: "p1",
    give: { cash: 0, tiles: [] },
    take: { cash: 0, tiles: [] },
    clauses,
  });
  it("private loans transfer principal now and repay automatically on the stated round", () => {
    const g = setup(),
      clauses: Clause[] = [
        { kind: "loan", giver: "from", principal: 200, amount: 240, rounds: 2 },
      ];
    const total = g.state.players.reduce((n, p) => n + empire(g.state, p), 0);
    accept(g, clauses, cashOnly(clauses));
    expect(g.player("p0").cash).toBe(1600);
    expect(g.player("p1").cash).toBe(2000);
    expect(g.state.players.reduce((n, p) => n + empire(g.state, p), 0)).toBe(
      total,
    );
    g.state.round = 2;
    settleRound(g.state, () => {});
    expect(g.player("p0").cash).toBe(1600);
    g.state.round = 3;
    settleRound(g.state, () => {});
    expect(g.player("p0").cash).toBe(1840);
    expect(g.player("p1").cash).toBe(1760);
    expect(g.state.contracts).toEqual([]);
  });
  it("enforces rent immunity before shields, then distributes real revenue to beneficiaries", () => {
    const g = setup(),
      clauses: Clause[] = [
        { kind: "revenue", giver: "from", tile: 1, percent: 20, rounds: 2 },
        { kind: "immunity", giver: "from", district: 0, uses: 1 },
      ];
    accept(g, clauses, cashOnly(clauses));
    g.state.current = g.state.players.findIndex((p) => p.id === "p1");
    g.player("p1").position = 1;
    g.player("p1").shield = 1;
    g.land();
    expect(g.player("p1").cash).toBe(1800);
    expect(g.player("p1").shield).toBe(1);
    expect(g.state.contracts.some((c) => c.kind === "immunity")).toBe(false);
    g.state.current = g.state.players.findIndex((p) => p.id === "p2");
    g.player("p2").position = 1;
    g.land();
    expect(g.player("p0").cash).toBeGreaterThan(1800);
    expect(g.player("p1").cash).toBeGreaterThan(1800);
    expect(g.state.players.reduce((n, p) => n + p.cash, 0)).toBe(7200);
    expect(lockedReason(g.state, 1)).toContain("contract");
    g.state.round = 3;
    settleRound(g.state, () => {});
    expect(lockedReason(g.state, 1)).toBeNull();
  });
  it("reserves option ownership until exercise or expiry and rechecks payment and building control", () => {
    const g = setup(),
      clauses: Clause[] = [
        { kind: "option", giver: "from", tile: 1, amount: 100, rounds: 2 },
      ];
    accept(g, clauses, cashOnly(clauses));
    const id = g.state.contracts[0].id;
    atomic(g, () =>
      g.action("p0", { type: "BORROW", amount: 50, collateral: [1] }),
    );
    atomic(g, () => g.action("p2", { type: "EXERCISE_OPTION", id }));
    g.action("p1", { type: "EXERCISE_OPTION", id });
    expect(g.state.board[1].owner).toBe("p1");
    expect(g.player("p1").cash).toBe(1700);
    expect(g.state.contracts).toEqual([]);
    atomic(g, () => g.action("p1", { type: "EXERCISE_OPTION", id }));
  });
  it("settles future payment shortfalls before final scoring and cleans obligations on bankruptcy", () => {
    const g = setup(),
      clauses: Clause[] = [
        { kind: "payment", giver: "to", amount: 2000, rounds: 1 },
      ];
    accept(g, clauses, cashOnly(clauses));
    g.state.round = 12;
    g.roundEnd();
    expect(g.state.phase).toBe("FINANCIAL_CRISIS");
    expect(g.state.crisisResume).toBe("finish");
    g.action("p1", { type: "BANKRUPT" });
    expect(g.state.phase).toBe("GAME_OVER");
    expect(g.player("p1").eliminated).toBe(true);
    expect(g.state.contracts).toEqual([]);
    expect(g.state.offers).toEqual([]);
  });
});
describe("live auctions", () => {
  function auction() {
    const g = setup();
    g.state.current = g.state.players.findIndex((p) => p.id === "p0");
    g.state.phase = "PURCHASE_DECISION";
    g.player("p0").position = 3;
    g.action("p0", { type: "DECLINE" });
    return g;
  }
  it("allows off-turn bids, rejects unaffordable/low bids and gives the winner exact ownership", () => {
    const g = auction(),
      total = g.player("p1").cash;
    expect(g.state.phase).toBe("AUCTION");
    expect(g.state.deadline - Date.now()).toBeGreaterThan(299000);
    atomic(g, () => g.action("p1", { type: "BID", amount: 1801 }));
    g.action("p1", { type: "BID", amount: 100 });
    atomic(g, () => g.action("p2", { type: "BID", amount: 109 }));
    atomic(g, () => g.action("p1", { type: "PASS_AUCTION" }));
    for (const id of ["p0", "p2", "p3"]) g.action(id, { type: "PASS_AUCTION" });
    expect(g.state.board[3].owner).toBe("p1");
    expect(g.player("p1").cash).toBe(total - 100);
    expect(g.state.phase).toBe("ENCOUNTER");
    expect(g.state.stats.p1.auctions).toBe(1);
  });
  it("freezes other spending, makes passing final and extends late bids by at least a minute", () => {
    const g = auction();
    g.action("p2", { type: "PASS_AUCTION" });
    atomic(g, () => g.action("p2", { type: "BID", amount: 50 }));
    atomic(g, () =>
      g.action("p0", { type: "BORROW", amount: 50, collateral: [1] }),
    );
    g.state.deadline = Date.now() + 10;
    g.action("p1", { type: "BID", amount: 50 });
    expect(g.state.deadline - Date.now()).toBeGreaterThan(59000);
    g.state.deadline = 1;
    expect(g.tick()).toBe(true);
    expect(g.state.phase).toBe("ENCOUNTER");
    expect(g.state.board[3].owner).toBe("p1");
  });
  it("finishes unsold auctions with all passes and routes an emergency sale back through recovery", () => {
    const g = auction();
    for (const p of [...g.state.players])
      g.action(p.id, { type: "PASS_AUCTION" });
    expect(g.state.board[3].owner).toBeNull();
    g.state.phase = "FINANCIAL_CRISIS";
    g.state.current = g.state.players.findIndex((p) => p.id === "p0");
    g.player("p0").cash = -80;
    g.action("p0", { type: "START_AUCTION", tile: 1 });
    g.action("p1", { type: "BID", amount: 100 });
    for (const id of ["p2", "p3"]) g.action(id, { type: "PASS_AUCTION" });
    expect(g.player("p0").cash).toBe(20);
    expect(g.state.phase).toBe("ENCOUNTER");
    expect(g.state.board[1].owner).toBe("p1");
  });
});
it("a last remaining player with debt shortfalls must recover before being declared solvent", () => {
  const g = setup();
  g.player("p2").eliminated = true;
  g.player("p3").eliminated = true;
  g.player("p0").cash = -20;
  g.player("p1").cash = -20;
  g.state.current = g.state.players.findIndex((p) => p.id === "p0");
  g.state.phase = "FINANCIAL_CRISIS";
  g.state.crisisResume = "planning";
  g.action("p0", { type: "BANKRUPT" });
  expect(g.state.phase).toBe("FINANCIAL_CRISIS");
  expect(g.state.winner).toBeNull();
  expect(g.state.players[g.state.current].id).toBe("p1");
  g.action("p1", { type: "BORROW", amount: 50, collateral: [6] });
  expect(g.state.phase).toBe("GAME_OVER");
  expect(g.state.winner).toBe("p1");
  expect(g.player("p1").cash).toBe(30);
});
it("Domination's rising levy removes liquidity without bankrupting everybody simultaneously", () => {
  const g = setup();
  g.state.mode = "DOMINATION";
  g.state.round = 12;
  for (const p of g.state.players) p.cash = 10;
  g.roundEnd();
  expect(g.state.players.every((p) => p.cash === 0 && !p.eliminated)).toBe(
    true,
  );
  expect(g.state.phase).toBe("PLANNING");
  expect(g.state.round).toBe(13);
});
it.each(["CAPITAL", "BLITZ", "DOMINATION"] as const)(
  "bots complete %s using auctions and trades with finite balances and valid holdings",
  (mode) => {
    const g = new Game(undefined, 137);
    g.join("host", "Host");
    for (let i = 0; i < 3; i++) g.action("host", { type: "ADD_BOT" });
    g.action("host", { type: "SET_MODE", mode });
    g.action("host", { type: "READY" });
    g.action("host", { type: "SIMULATION", autoplay: true, speed: "FAST" });
    g.action("host", { type: "START" });
    const runner = new BotRunner();
    let n = 0;
    while (g.state.phase !== "GAME_OVER" && n++ < 15000)
      runner.step(g, n * 200);
    expect(g.state.phase).toBe("GAME_OVER");
    expect(g.state.players.every((p) => Number.isFinite(p.cash))).toBe(true);
    expect(g.state.winner).toBeTruthy();
    expect(g.player(g.state.winner!).cash).toBeGreaterThanOrEqual(0);
    if (mode === "DOMINATION")
      expect(
        g.state.players.filter((p) => !p.eliminated).length === 1 ||
          g.state.round === 30,
      ).toBe(true);
    else expect(g.state.round).toBe(mode === "BLITZ" ? 8 : 12);
  },
  20000,
);
