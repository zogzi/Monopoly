import { test, expect } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Game } from "../../packages/game-core/index";
import { encounters } from "../../packages/shared/content";
test("desktop release: storm city, original cast, longer planning, private cards, full bot match and rematch", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await expect(page.locator("header")).toHaveCount(0);
  await expect(page.getByLabel("Game version")).toHaveText("v0.3.0");
  await expect(
    page.getByRole("heading", { name: "ZMONOPOLY", exact: true }),
  ).toBeVisible();
  for (const name of [
    "Moxie Vale",
    "Otto Brass",
    "Vesper Moon",
    "Bruno Bloom",
    "Zuri Volt",
    "Cleo Frost",
    "Dex Dune",
    "Lola Lux",
    "Sage Sterling",
    "Niko Nova",
  ])
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Vesper Moon", exact: true }).click();
  await page.screenshot({ path: "artifacts/characters.png", fullPage: true });
  await page.getByPlaceholder("Enter your name").fill("Alex");
  await page.getByRole("button", { name: "Join game", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Alex." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Mute sound" })).toBeVisible();
  await page.getByRole("button", { name: "Contractor", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "The contractor" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Add a bot", exact: true }).click();
  await page.getByRole("combobox", { name: "Bot speed" }).selectOption("FAST");
  await page.getByRole("button", { name: "I’m ready", exact: true }).click();
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Time to build", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".turn-card")).toContainText(/4:|5:00/);
  await expect(page.getByRole("heading", { name: /Your cards/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Finish planning", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Game paused" }),
  ).toBeVisible();
  await expect(page.getByText("Alex (you)", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Find me", exact: true }).click();
  await page.getByRole("button", { name: "Reset camera" }).click();
  await page.getByRole("button", { name: "Properties", exact: true }).click();
  await page.locator("summary").filter({ hasText: "Harbor Row" }).click();
  await page.getByRole("button", { name: /Dockside Works/ }).click();
  await expect(
    page.getByRole("heading", { name: "Dockside Works" }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-draw-calls",
    /\d+/,
  );
  const calls = Number(
    await page.locator("canvas").getAttribute("data-draw-calls"),
  );
  expect(calls).toBeGreaterThan(0);
  expect(calls).toBeLessThan(130);
  console.log("Four-player storm city draw calls:", calls);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByLabel("Play my turns automatically").click();
  await expect(page.getByLabel("Play my turns automatically")).toBeChecked();
  await expect(page.getByRole("heading", { name: /wins\./ })).toBeVisible({
    timeout: 100000,
  });
  await page.getByRole("button", { name: "Play again", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Alex." }),
  ).toBeVisible();
  await expect(page.locator(".bot-list>div")).toHaveCount(3);
  for (let i = 0; i < 11; i++) {
    await page.getByRole("button", { name: "Add a bot", exact: true }).click();
    await expect(page.locator(".bot-list>div")).toHaveCount(4 + i);
  }
  await expect(
    page.getByRole("button", { name: "Add a bot", exact: true }),
  ).toBeDisabled();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-player-count",
    "15",
  );
  const maxCalls = Number(
    await page.locator("canvas").getAttribute("data-draw-calls"),
  );
  expect(maxCalls).toBeGreaterThan(0);
  expect(maxCalls).toBeLessThan(175);
  console.log("Fifteen-player storm city draw calls:", maxCalls);
  await page.screenshot({
    path: "artifacts/fifteen-players.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("a manual roll opens large authoritative 3D dice and can be dismissed", async ({
  page,
}) => {
  const directory = await mkdtemp(path.join(tmpdir(), "zmonopoly-dice-"));
  const child: ChildProcess = spawn(
    process.execPath,
    ["--import", "tsx", "apps/server/index.ts"],
    {
      cwd: process.cwd(),
      env: { ...process.env, PORT: "3020", SAVE_DIR: directory },
      stdio: "pipe",
    },
  );
  try {
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch("http://127.0.0.1:3020/api/health")).ok) break;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    await page.goto("http://127.0.0.1:3020/");
    await page.getByPlaceholder("Enter your name").fill("Dice player");
    await page.getByRole("button", { name: "Join game", exact: true }).click();
    for (let i = 0; i < 3; i++)
      await page
        .getByRole("button", { name: "Add a bot", exact: true })
        .click();
    await page
      .getByRole("combobox", { name: "Bot speed" })
      .selectOption("FAST");
    await page.getByRole("button", { name: "I’m ready", exact: true }).click();
    await page.getByRole("button", { name: "Start game", exact: true }).click();
    await page
      .getByRole("button", { name: "Finish planning", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Roll dice", exact: true })
      .waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("button", { name: "Roll dice", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "Dice roll", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".roll-overlay h2")).toHaveText(
      /^[1-6] \+ [1-6] = (?:[2-9]|1[0-2])$/,
    );
    await expect(page.locator(".roll-overlay canvas")).toBeVisible();
    await page.screenshot({ path: "artifacts/dice.png", fullPage: true });
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("dialog", { name: "Dice roll", exact: true }),
    ).toHaveCount(0);
  } finally {
    await page.close();
    const exited = new Promise<void>((resolve) =>
      child.once("exit", () => resolve()),
    );
    child.kill("SIGTERM");
    await exited;
    await rm(directory, { recursive: true, force: true });
  }
});

test("an illegal deal sends a real police escort to custody, and bail returns control", async ({
  page,
}) => {
  const directory = await mkdtemp(path.join(tmpdir(), "zmonopoly-custody-")),
    g = new Game(undefined, 1);
  g.join("host", "Arrest test", "niko");
  for (let i = 0; i < 3; i++) g.action("host", { type: "ADD_BOT" });
  g.state.phase = "ENCOUNTER";
  g.state.round = 2;
  g.state.current = 0;
  g.state.encounter = {
    index: encounters.findIndex((e) => e.options.some((o) => o.reward.illegal)),
    playerId: "host",
  };
  g.state.deadline = Date.now() + 300000;
  await writeFile(
    path.join(directory, "current-game.json"),
    JSON.stringify({
      state: g.state,
      seed: 1,
      tokens: { "test-only-custody-token": "host" },
    }),
  );
  const child: ChildProcess = spawn(
    process.execPath,
    ["--import", "tsx", "apps/server/index.ts"],
    {
      cwd: process.cwd(),
      env: { ...process.env, PORT: "3021", SAVE_DIR: directory },
      stdio: "pipe",
    },
  );
  try {
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch("http://127.0.0.1:3021/api/health")).ok) break;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    await page.addInitScript(() => {
      localStorage.setItem("empire-token", "test-only-custody-token");
      localStorage.setItem("empire-name", "Arrest test");
    });
    await page.goto("http://127.0.0.1:3021/");
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.getByRole("button", { name: /Smuggle the parcel/ }).click();
    await expect(
      page.locator(".custody-badge").filter({ hasText: "In custody" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-escorting",
      "host",
      { timeout: 3500 },
    );
    await page.screenshot({
      path: "artifacts/police-escort.png",
      fullPage: true,
    });
    await expect(page.locator("canvas")).toHaveAttribute("data-escorting", "", {
      timeout: 7000,
    });
    await page.getByRole("button", { name: "Find me", exact: true }).click();
    await page.screenshot({ path: "artifacts/prison.png", fullPage: true });
    await page
      .getByRole("combobox", { name: "Bot speed" })
      .selectOption("FAST");
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page
      .getByRole("button", { name: "Finish planning", exact: true })
      .click({ timeout: 15000 });
    await expect(
      page.getByRole("button", { name: "Pay $200 bail and roll", exact: true }),
    ).toBeVisible({ timeout: 15000 });
    await page
      .getByRole("button", { name: "Pay $200 bail and roll", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Roll dice", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".custody-badge")).toHaveCount(0);
  } finally {
    await page.close();
    const exited = new Promise<void>((resolve) =>
      child.once("exit", () => resolve()),
    );
    child.kill("SIGTERM");
    await exited;
    await rm(directory, { recursive: true, force: true });
  }
});
