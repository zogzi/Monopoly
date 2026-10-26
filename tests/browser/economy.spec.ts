import {
  test,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Game } from "../../packages/game-core/index";

async function table(browser: Browser, port: number, auction = false) {
  const directory = await mkdtemp(path.join(tmpdir(), "zmonopoly-market-")),
    game = new Game(undefined, 1337);
  for (const [id, name] of [
    ["host", "Market host"],
    ["friend", "Bea"],
    ["bot-a", "Otto"],
    ["bot-b", "Vesper"],
  ])
    game.join(id, name);
  for (const p of game.state.players) {
    p.ready = true;
    if (p.id.startsWith("bot")) p.bot = true;
  }
  game.state.phase = "PLANNING";
  game.state.round = 1;
  game.state.simulation.speed = "FAST";
  for (const id of [1, 2]) game.state.board[id].owner = "host";
  for (const id of [6, 7]) game.state.board[id].owner = "friend";
  if (auction) {
    game.startAuction(3, null, "encounter");
    game.state.auction!.passed = ["bot-a", "bot-b"];
  }
  await writeFile(
    path.join(directory, "current-game.json"),
    JSON.stringify({
      state: game.state,
      seed: game.seed,
      tokens: { "test-host": "host", "test-friend": "friend" },
    }),
  );
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "apps/server/index.ts"],
    {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(port), SAVE_DIR: directory },
      stdio: "pipe",
    },
  );
  const contexts: BrowserContext[] = [];
  const close = async () => {
    await Promise.all(contexts.map((c) => c.close()));
    if (child.exitCode === null) {
      const exited = new Promise<void>((resolve) =>
        child.once("exit", () => resolve()),
      );
      child.kill("SIGTERM");
      await exited;
    }
    await rm(directory, { recursive: true, force: true });
  };
  try {
    await expect
      .poll(async () => {
        try {
          return (await fetch(`http://127.0.0.1:${port}/api/health`)).status;
        } catch {
          return 0;
        }
      })
      .toBe(200);
    const pages: Page[] = [];
    for (const token of ["test-host", "test-friend"]) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 960 },
      });
      contexts.push(context);
      await context.addInitScript((t) => {
        localStorage.setItem("empire-token", t);
        localStorage.setItem(
          "empire-name",
          t === "test-host" ? "Market host" : "Bea",
        );
      }, token);
      const page = await context.newPage();
      pages.push(page);
      await page.goto(`http://127.0.0.1:${port}/`);
      await expect(
        page.getByRole("heading", {
          name: auction ? "Property auction" : "Game paused",
          exact: true,
        }),
      ).toBeVisible();
    }
    await pages[0].getByRole("button", { name: "Resume", exact: true }).click();
    return { host: pages[0], friend: pages[1], close };
  } catch (e) {
    await close();
    throw e;
  }
}

test("two people negotiate, counter, accept a contract, borrow and release collateral through the real UI", async ({
  browser,
}) => {
  const { host, friend, close } = await table(browser, 3022);
  const errors: string[] = [];
  for (const p of [host, friend])
    p.on("pageerror", (e) => errors.push(e.message));
  try {
    await host
      .getByRole("button", { name: "Trade & bank", exact: true })
      .click();
    const desk = host.getByRole("dialog", {
      name: "Trade & bank",
      exact: true,
    });
    await desk.getByRole("button", { name: "Make a trade offer" }).click();
    await desk.getByLabel("Trade with").selectOption("friend");
    await desk.getByLabel("Your cash offer").fill("100");
    await desk.getByLabel(/Dockside Works/).check();
    await desk.getByLabel(/Foundry Square/).check();
    await desk.getByText("Add an optional contract", { exact: true }).click();
    await desk.getByLabel("Contract type").selectOption("payment");
    await desk.getByLabel("Future payment amount").fill("30");
    await desk.getByRole("button", { name: "Add contract to offer" }).click();
    await desk.getByRole("button", { name: "Send offer", exact: true }).click();
    await expect(
      desk.getByText("Offer sent. You can keep playing while they decide."),
    ).toBeVisible();
    await friend.getByRole("button", { name: /Trade & bank/ }).click();
    const theirs = friend.getByRole("dialog", {
      name: "Trade & bank",
      exact: true,
    });
    await theirs
      .getByRole("button", { name: "Counteroffer", exact: true })
      .click();
    await theirs.getByLabel("Their cash offer").fill("120");
    await theirs
      .getByRole("button", { name: "Send offer", exact: true })
      .click();
    await expect(
      desk.getByRole("heading", { name: "Offer from Bea", exact: true }),
    ).toBeVisible();
    await expect(desk.locator(".offer-card")).toHaveCSS("opacity", "1");
    await host.screenshot({
      path: "artifacts/trade.png",
      fullPage: true,
      animations: "disabled",
    });
    await desk
      .getByRole("button", { name: "Accept offer", exact: true })
      .click();
    await expect(desk.locator(".offer-card")).toHaveCount(0);
    await desk.getByRole("tab", { name: "Contracts", exact: true }).click();
    await expect(
      desk.getByText("Market host pays Bea $30 after round 3.", {
        exact: true,
      }),
    ).toBeVisible();
    await desk.getByRole("tab", { name: "Bank", exact: true }).click();
    await desk.getByLabel("Pledge Ocean Exchange").check();
    await desk.getByLabel("Amount to borrow").fill("100");
    await desk
      .getByRole("button", { name: "Borrow $100", exact: true })
      .click();
    await expect(
      desk.getByRole("heading", { name: "$100 bank balance", exact: true }),
    ).toBeVisible();
    await host.screenshot({
      path: "artifacts/bank.png",
      fullPage: true,
      animations: "disabled",
    });
    await desk
      .getByRole("button", {
        name: "Repay all & release collateral",
        exact: true,
      })
      .click();
    await expect(
      desk.getByText("No outstanding bank loans.", { exact: true }),
    ).toBeVisible();
    await expect(desk.getByLabel("Pledge Ocean Exchange")).toBeVisible();
    await host.keyboard.press("Escape");
    await host
      .getByRole("button", { name: "My properties", exact: true })
      .click();
    await expect(
      host.getByRole("button", { name: /Foundry Square/ }),
    ).toBeVisible();
    await expect(
      host.getByRole("button", { name: /Dockside Works/ }),
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await close();
  }
});

test("live auction animates bids, highlights its property and awards one binding winning bid", async ({
  browser,
}) => {
  const { host, friend, close } = await table(browser, 3023, true);
  try {
    await expect(
      host.getByRole("heading", { name: "Property auction", exact: true }),
    ).toBeVisible();
    await host.getByLabel("Your bid").fill("100");
    await host.getByRole("button", { name: "Bid $100", exact: true }).click();
    await expect(
      friend.getByText("Market host leads", { exact: true }),
    ).toBeVisible();
    await friend.getByLabel("Your bid").fill("150");
    await friend.getByRole("button", { name: "Bid $150", exact: true }).click();
    await expect(host.getByText("Bea leads", { exact: true })).toBeVisible();
    await host
      .getByRole("button", { name: "Find auction", exact: true })
      .click();
    await host.screenshot({
      path: "artifacts/auction.png",
      fullPage: true,
      animations: "disabled",
    });
    await host
      .getByRole("button", { name: "Pass this auction", exact: true })
      .click();
    await expect(
      friend.getByText("Bea wins the auction", { exact: true }),
    ).toBeVisible();
    await friend
      .getByRole("button", { name: "My properties", exact: true })
      .click();
    await expect(
      friend.getByRole("button", { name: /Ferry Terminal/ }),
    ).toBeVisible();
    await expect(friend.locator(".your-balance")).toContainText("$1,650");
  } finally {
    await close();
  }
});
