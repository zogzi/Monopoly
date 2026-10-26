import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { Game } from "../packages/game-core/index.ts";
import { BotRunner } from "../packages/game-core/bots.ts";
import { shortfall } from "../packages/game-core/payments.ts";
import { validateHoldings } from "../packages/game-core/economy.ts";
import type { Mode } from "../packages/shared/economy.ts";

const samples = Number(process.env.SIMULATION_SAMPLES ?? 30);
const output = process.env.AUDIT_OUTPUT ?? "artifacts/simulation-audit.json";
const groups: Record<string, unknown>[] = [],
  failures: unknown[] = [];
const started = performance.now();
for (const mode of ["CAPITAL", "BLITZ", "DOMINATION"] as Mode[])
  for (const seats of [4, 8, 15]) {
    const runs: {
      rounds: number;
      steps: number;
      builds: number;
      trades: number;
      auctions: number;
      survivors: number;
      encounters: number;
      loans: number;
    }[] = [];
    for (let seed = 1; seed <= samples; seed++) {
      const game = new Game(undefined, seed * 7919);
      game.join("host", "Audit host");
      for (let i = 1; i < seats; i++) game.action("host", { type: "ADD_BOT" });
      game.action("host", { type: "SET_MODE", mode });
      game.action("host", { type: "READY" });
      game.action("host", {
        type: "SIMULATION",
        autoplay: true,
        speed: "FAST",
      });
      game.action("host", { type: "START" });
      const bots = new BotRunner();
      let steps = 0,
        builds = 0,
        encounters = 0,
        loans = 0,
        previousLog = game.state.log[0].id;
      try {
        while (game.state.phase !== "GAME_OVER" && steps++ < 25000) {
          if (!bots.step(game, steps * 200))
            throw Error(`Stuck in ${game.state.phase}`);
          const s = game.state;
          for (const event of s.log.filter((l) => l.id > previousLog)) {
            if (event.text.includes(" developed ")) builds++;
            if (event.text.includes(" borrowed ")) loans++;
          }
          previousLog = s.log[0].id;
          if (s.phase === "ENCOUNTER") encounters++;
          validateHoldings(s);
          for (const p of s.players) {
            if (!Number.isSafeInteger(p.cash))
              throw Error("Non-integer or unsafe balance");
            if (!p.eliminated && shortfall(s, p.id) !== Math.max(0, -p.cash))
              throw Error(`Unfunded balance mismatch for ${p.id}`);
            if (p.cards.length > 4) throw Error("Hand overflow");
          }
          for (const t of s.board) {
            if (
              t.owner &&
              !s.players.some((p) => p.id === t.owner && !p.eliminated)
            )
              throw Error("Orphan property");
            if (t.level < 0 || t.level > 4 || (!t.owner && t.level))
              throw Error("Invalid building");
          }
          const collateral = [
            ...s.loans.flatMap((l) => l.collateral),
            ...s.arrears.flatMap((d) => d.collateral ?? []),
          ];
          if (new Set(collateral).size !== collateral.length)
            throw Error("Duplicate collateral");
        }
        if (game.state.phase !== "GAME_OVER")
          throw Error("Exceeded 25,000 actions");
        if (game.state.winner && game.player(game.state.winner).cash < 0)
          throw Error("Insolvent winner");
        const stats = Object.values(game.state.stats);
        runs.push({
          rounds: game.state.round,
          steps,
          builds,
          trades: stats.reduce((n, p) => n + p.trades, 0) / 2,
          auctions: stats.reduce((n, p) => n + p.auctions, 0),
          survivors: game.state.players.filter((p) => !p.eliminated).length,
          encounters,
          loans,
        });
      } catch (error) {
        failures.push({
          mode,
          seats,
          seed,
          phase: game.state.phase,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    const average = (key: keyof (typeof runs)[number]) =>
      runs.length
        ? Math.round(
            (runs.reduce((n, r) => n + r[key], 0) / runs.length) * 100,
          ) / 100
        : null;
    const result = {
      mode,
      seats,
      samples,
      completed: runs.length,
      avgRounds: average("rounds"),
      avgActions: average("steps"),
      avgBuildingActions: average("builds"),
      avgTrades: average("trades"),
      avgAuctionsWon: average("auctions"),
      avgSurvivors: average("survivors"),
      avgEncounters: average("encounters"),
      avgLoans: average("loans"),
      maxRounds: Math.max(0, ...runs.map((r) => r.rounds)),
    };
    groups.push(result);
    console.log(JSON.stringify(result));
  }
await mkdir("artifacts", { recursive: true });
await writeFile(
  output,
  JSON.stringify(
    {
      version: (await import("../packages/shared/version.ts")).GAME_VERSION,
      samplesPerGroup: samples,
      totalMatches: samples * 9,
      durationSeconds: Math.round((performance.now() - started) / 1000),
      groups,
      failures,
    },
    null,
    2,
  ) + "\n",
);
if (failures.length) {
  console.error(JSON.stringify(failures));
  process.exitCode = 1;
}
