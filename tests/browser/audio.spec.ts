import { test, expect, type Page } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Game } from "../../packages/game-core/index";
async function meter(page: Page, action: () => Promise<unknown>) {
  await page.waitForTimeout(750);
  await page.evaluate(() => {
    (window as unknown as { readings: number[] }).readings.length = 0;
  });
  await action();
  await page.waitForTimeout(650);
  return page.evaluate(() =>
    Math.max(0, ...(window as unknown as { readings: number[] }).readings),
  );
}
async function level(page: Page, label: string, value: number) {
  const slider = page.getByRole("slider", { name: label, exact: true });
  await slider.fill(String(value));
  await expect(slider).toHaveValue(String(value));
}
test("audio mixes real signals, mutes cleanly, persists per browser and leaves ownership visible on the map", async ({
  page,
  browser,
}) => {
  const directory = await mkdtemp(path.join(tmpdir(), "zmonopoly-audio-")),
    game = new Game(undefined, 1337);
  game.join("host", "Audio player", "moxie");
  for (let i = 0; i < 3; i++) game.action("host", { type: "ADD_BOT" });
  game.state.phase = "PLANNING";
  game.state.round = 2;
  for (const tile of [1, 2, 3]) game.state.board[tile].owner = "host";
  for (const tile of [6, 7, 8])
    game.state.board[tile].owner = game.state.players[1].id;
  for (const tile of [11, 12])
    game.state.board[tile].owner = game.state.players[2].id;
  await writeFile(
    path.join(directory, "current-game.json"),
    JSON.stringify({
      state: game.state,
      seed: game.seed,
      tokens: { "audio-seat": "host" },
    }),
  );
  const child = spawn(process.execPath, ["build/server.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: "3025", SAVE_DIR: directory },
    stdio: "ignore",
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const other = await browser.newContext();
  try {
    await expect
      .poll(async () => {
        try {
          return (await fetch("http://127.0.0.1:3025/api/health")).status;
        } catch {
          return 0;
        }
      })
      .toBe(200);
    await page.addInitScript(() => {
      localStorage.setItem("empire-token", "audio-seat");
      localStorage.setItem("empire-name", "Audio player");
      const probe = window as unknown as { readings: number[] };
      probe.readings = [];
      const connect = AudioNode.prototype.connect as unknown as (
        this: AudioNode,
        target: AudioNode | AudioParam,
        ...ports: number[]
      ) => AudioNode | undefined;
      AudioNode.prototype.connect = function (
        this: AudioNode,
        target: AudioNode | AudioParam,
        ...args: number[]
      ) {
        const result = connect.call(this, target, ...args);
        if (target === this.context.destination) {
          const analyser = this.context.createAnalyser(),
            samples = new Float32Array(1024);
          analyser.fftSize = 1024;
          connect.call(this, analyser);
          setInterval(() => {
            if (this.context.state !== "running") {
              probe.readings.push(0);
              return;
            }
            analyser.getFloatTimeDomainData(samples);
            probe.readings.push(
              Math.sqrt(
                samples.reduce((sum, n) => sum + n * n, 0) / samples.length,
              ),
            );
            if (probe.readings.length > 2000) probe.readings.shift();
          }, 10);
        }
        return result;
      } as typeof AudioNode.prototype.connect;
    });
    await page.goto("http://127.0.0.1:3025/");
    await expect(
      page.locator('.ownership-pin[data-owner-id="host"]'),
    ).toHaveCount(3);
    await expect
      .poll(async () => {
        const layer = await page.locator(".ownership-layer").boundingBox();
        const canvas = await page.locator(".city-area canvas").boundingBox();
        return layer && canvas
          ? Math.abs(layer.x - canvas.x) + Math.abs(layer.y - canvas.y)
          : 1000;
      })
      .toBeLessThan(2);
    await expect(
      page.getByRole("combobox", { name: "Graphics quality" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    const settings = page.getByRole("dialog", {
      name: "Settings",
      exact: true,
    });
    await settings
      .getByRole("checkbox", { name: "Sound enabled", exact: true })
      .check();
    await settings
      .getByRole("checkbox", { name: "Interface clicks", exact: true })
      .uncheck();
    await level(page, "Master volume", 100);
    await level(page, "Game effects volume", 0);
    await level(page, "Alert volume", 100);
    const silentEffects = await meter(page, () =>
      settings
        .getByRole("button", { name: "Test effects", exact: true })
        .click(),
    );
    expect(silentEffects).toBeLessThan(0.000001);
    const alertSignal = await meter(page, () =>
      settings.getByRole("button", { name: "Test alert", exact: true }).click(),
    );
    expect(alertSignal).toBeGreaterThan(0.0001);
    await level(page, "Game effects volume", 80);
    await level(page, "Alert volume", 0);
    const effectsSignal = await meter(page, () =>
      settings
        .getByRole("button", { name: "Test effects", exact: true })
        .click(),
    );
    expect(effectsSignal).toBeGreaterThan(0.0001);
    expect(
      await meter(page, () =>
        settings
          .getByRole("button", { name: "Test alert", exact: true })
          .click(),
      ),
    ).toBeLessThan(0.000001);
    await level(page, "Master volume", 0);
    expect(
      await meter(page, () =>
        settings
          .getByRole("button", { name: "Test effects", exact: true })
          .click(),
      ),
    ).toBeLessThan(0.000001);
    await level(page, "Master volume", 28);
    await level(page, "Game effects volume", 42);
    await level(page, "Alert volume", 66);
    await settings
      .getByRole("checkbox", { name: "Movement sounds", exact: true })
      .uncheck();
    await settings
      .getByRole("checkbox", { name: "Other players’ actions", exact: true })
      .uncheck();
    await page.screenshot({
      path: "artifacts/audio-settings.png",
      fullPage: true,
    });
    const independent = await other.newPage();
    await independent.goto("http://127.0.0.1:3025/");
    await independent
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    await expect(
      independent.getByRole("slider", { name: "Master volume", exact: true }),
    ).toHaveValue("80");
    // The exact dice animation event creates scheduled future rattles. Muting must cancel them.
    await page.evaluate(() =>
      window.dispatchEvent(new Event("zmonopoly-dice-animation")),
    );
    await page.waitForTimeout(160);
    await settings
      .getByRole("checkbox", { name: "Sound enabled", exact: true })
      .uncheck();
    await page.waitForTimeout(150);
    expect(
      await meter(page, async () => {
        await page.waitForTimeout(1300);
      }),
    ).toBeLessThan(0.000001);
    await settings
      .getByRole("checkbox", { name: "Sound enabled", exact: true })
      .check();
    expect(
      await meter(page, () =>
        settings
          .getByRole("button", { name: "Test alert", exact: true })
          .click(),
      ),
    ).toBeGreaterThan(0.00001);
    // With all cues finished, the engine remains silent; no wind/ambient loop runs.
    expect(await meter(page, async () => {})).toBeLessThan(0.000001);
    await settings
      .getByRole("checkbox", { name: "Sound enabled", exact: true })
      .uncheck();
    await page.reload();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(
      page.getByRole("slider", { name: "Master volume", exact: true }),
    ).toHaveValue("28");
    await expect(
      page.getByRole("slider", { name: "Game effects volume", exact: true }),
    ).toHaveValue("42");
    await expect(
      page.getByRole("slider", { name: "Alert volume", exact: true }),
    ).toHaveValue("66");
    for (const label of [
      "Sound enabled",
      "Movement sounds",
      "Interface clicks",
      "Other players’ actions",
    ])
      await expect(
        page.getByRole("checkbox", { name: label, exact: true }),
      ).not.toBeChecked();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(
      page.getByRole("link", { name: /Dockside Works · Owner Audio player/ }),
    ).toBeVisible();
    await page.waitForTimeout(200);
    const pins = await page.locator(".ownership-pin").all();
    for (const name of ["Contractor", "Courier"]) {
      const npc = await page
        .getByRole("button", { name, exact: true })
        .boundingBox();
      if (!npc) throw Error(`Missing map service: ${name}`);
      for (const pin of pins) {
        const p = await pin.boundingBox();
        if (p)
          expect(
            p.x < npc.x + npc.width &&
              p.x + p.width > npc.x &&
              p.y < npc.y + npc.height &&
              p.y + p.height > npc.y,
          ).toBe(false);
      }
    }
    await page.screenshot({
      path: "artifacts/ownership-map.png",
      fullPage: true,
    });
    await page
      .getByRole("link", { name: /Dockside Works · Owner Audio player/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Dockside Works", exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
    console.log("Actual audio output RMS:", {
      silentEffects,
      alertSignal,
      effectsSignal,
    });
  } finally {
    await other.close();
    await page.close();
    if (child.exitCode === null) {
      const ended = new Promise<void>((resolve) =>
        child.once("exit", () => resolve()),
      );
      child.kill("SIGTERM");
      await ended;
    }
    await rm(directory, { recursive: true, force: true });
  }
});
