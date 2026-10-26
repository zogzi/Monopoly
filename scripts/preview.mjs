import { ESCORT_DURATION_MS } from "../apps/web/src/city/prisonLayout.ts";
// Real browser capture of seeded scenarios. No rendering of fake gameplay or external assets.
import { chromium, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Game } from "../packages/game-core/index.ts";
import { encounters } from "../packages/shared/content.ts";
import { GAME_VERSION } from "../packages/shared/version.ts";

const out = path.resolve("artifacts/preview");
await mkdir(out, { recursive: true });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function run(command, args) {
  const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
  let error = "";
  child.stderr.on("data", (b) => (error += b));
  await new Promise((resolve, reject) =>
    child.on("exit", (code) => (code === 0 ? resolve() : reject(Error(error)))),
  );
}
function scenario(kind) {
  const g = new Game(undefined, 1);
  g.join("host", "Alex", "niko");
  for (let i = 0; i < 3; i++) g.action("host", { type: "ADD_BOT" });
  g.state.round = 3;
  g.state.phase = "PLANNING";
  g.state.current = 0;
  g.state.cityEvent = "festival";
  g.state.nextCityEvent = "market";
  g.state.planningReady = g.state.players.filter((p) => p.bot).map((p) => p.id);
  g.state.deadline = Date.now() + 300000;
  g.player("host").cash = 2400;
  g.player("host").cards = [
    { id: "demo-shield", kind: "shield" },
    { id: "demo-alibi", kind: "alibi" },
  ];
  for (const id of [1, 2, 3]) g.state.board[id].owner = "host";
  g.state.board[4].owner = g.state.players[1].id;
  for (const id of [6, 7, 8]) g.state.board[id].owner = g.state.players[2].id;
  for (const id of [26, 27, 28])
    g.state.board[id].owner = g.state.players[3].id;
  if (kind === "auction") {
    g.startAuction(16, null, "encounter");
    g.state.auction.bid = 100;
    g.state.auction.bidder = g.state.players[1].id;
    g.state.auction.passed = [g.state.players[2].id, g.state.players[3].id];
  }
  if (kind === "custody") {
    g.state.phase = "ENCOUNTER";
    g.player("host").position = 10;
    g.state.encounter = {
      playerId: "host",
      index: encounters.findIndex((e) =>
        e.options.some((o) => o.reward.illegal),
      ),
    };
    g.player("host").cards = [{ id: "demo-shield", kind: "shield" }];
  }
  return g;
}
async function launch(kind, port) {
  const directory = await mkdtemp(path.join(tmpdir(), "zmonopoly-preview-")),
    g = scenario(kind);
  await writeFile(
    path.join(directory, "current-game.json"),
    JSON.stringify({
      state: g.state,
      seed: g.seed,
      tokens: { "preview-seat": "host" },
    }),
  );
  const child = spawn(process.execPath, ["build/server.mjs"], {
    env: { ...process.env, PORT: String(port), SAVE_DIR: directory },
    stdio: "ignore",
  });
  await expect
    .poll(
      async () => {
        try {
          return (await fetch(`http://127.0.0.1:${port}/api/health`)).status;
        } catch {
          return 0;
        }
      },
      { timeout: 15000 },
    )
    .toBe(200);
  return async () => {
    if (child.exitCode === null) {
      const ended = new Promise((resolve) => child.once("exit", resolve));
      child.kill("SIGTERM");
      await ended;
    }
    await rm(directory, { recursive: true, force: true });
  };
}
async function audioCapture(context) {
  await context.addInitScript(() => {
    localStorage.setItem("empire-token", "preview-seat");
    localStorage.setItem("empire-name", "Alex");
    const Native = window.AudioContext;
    const connect = AudioNode.prototype.connect;
    window.__previewAudio = [];
    AudioNode.prototype.connect = function (destination, ...args) {
      const result = connect.call(this, destination, ...args);
      if (
        destination === this.context.destination &&
        this.context.__previewDestination
      )
        connect.call(this, this.context.__previewDestination);
      return result;
    };
    window.AudioContext = class extends Native {
      constructor(...args) {
        super(...args);
        this.__previewDestination = this.createMediaStreamDestination();
        const chunks = [],
          recorder = new MediaRecorder(this.__previewDestination.stream, {
            mimeType: "audio/webm;codecs=opus",
          });
        const entry = { recorder, chunks, beganAt: Date.now() };
        window.__previewAudio.push(entry);
        recorder.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data);
        };
        recorder.start(250);
      }
    };
  });
}
async function record(page, name) {
  const session = await page.context().newCDPSession(page);
  let latest,
    frameCount = 0;
  session.on("Page.screencastFrame", (event) => {
    latest = Buffer.from(event.data, "base64");
    void session.send("Page.screencastFrameAck", {
      sessionId: event.sessionId,
    });
  });
  await session.send("Page.startScreencast", {
    format: "jpeg",
    quality: 88,
    maxWidth: 1600,
    maxHeight: 900,
    everyNthFrame: 1,
  });
  for (let i = 0; !latest && i < 100; i++) await pause(30);
  if (!latest) throw Error("No Chromium video frames received.");
  const raw = path.join(out, `${name}-silent.mp4`);
  const encoder = spawn(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "image2pipe",
      "-vcodec",
      "mjpeg",
      "-framerate",
      "24",
      "-i",
      "pipe:0",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      raw,
    ],
    { stdio: ["pipe", "ignore", "pipe"] },
  );
  let errors = "";
  encoder.stderr.on("data", (b) => (errors += b));
  const finished = new Promise((resolve, reject) =>
    encoder.once("exit", (code) =>
      code === 0 ? resolve() : reject(Error(errors)),
    ),
  );
  const start = Date.now();
  const tick = () => {
    const target = Math.floor(((Date.now() - start) * 24) / 1000);
    while (frameCount < target) {
      encoder.stdin.write(latest);
      frameCount++;
    }
  };
  const interval = setInterval(tick, 40);
  return async () => {
    clearInterval(interval);
    tick();
    await session.send("Page.stopScreencast");
    await session.detach();
    encoder.stdin.end();
    await finished;
    const audio = await page.evaluate(async () => {
      const entry = window.__previewAudio?.[0];
      if (!entry) return null;
      await new Promise((resolve) => {
        entry.recorder.onstop = resolve;
        entry.recorder.stop();
      });
      const data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(new Blob(entry.chunks, { type: "audio/webm" }));
      });
      return { beganAt: entry.beganAt, data };
    });
    const target = path.join(out, `${name}.mp4`);
    if (audio) {
      const audioFile = path.join(out, `${name}.webm`);
      await writeFile(
        audioFile,
        Buffer.from(audio.data.split(",")[1], "base64"),
      );
      const delay = Math.max(0, audio.beganAt - start);
      await run("ffmpeg", [
        "-y",
        "-loglevel",
        "error",
        "-i",
        raw,
        "-i",
        audioFile,
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-af",
        `adelay=${delay}:all=1,apad`,
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-t",
        String(frameCount / 24),
        "-movflags",
        "+faststart",
        target,
      ]);
    } else
      await run("ffmpeg", [
        "-y",
        "-loglevel",
        "error",
        "-i",
        raw,
        "-f",
        "lavfi",
        "-i",
        "anullsrc=r=48000:cl=stereo",
        "-shortest",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        target,
      ]);
    console.log(
      `${name}: ${(frameCount / 24).toFixed(1)} seconds, ${audio ? "captured game audio" : "silent"}`,
    );
    return target;
  };
}
async function caption(page, title, text) {
  await page.evaluate(
    ({ title, text }) => {
      let card = document.getElementById("preview-caption");
      if (!card) {
        card = document.createElement("div");
        card.id = "preview-caption";
        card.style.cssText =
          "position:fixed;z-index:200;top:78px;left:355px;right:280px;padding:14px 22px;border:1px solid #d5ae78;border-radius:12px;background:#21182de8;color:#fff4df;pointer-events:none;font-family:Arial,sans-serif;text-align:center;box-shadow:0 10px 35px #140d2040";
        document.body.append(card);
      }
      card.replaceChildren();
      const heading = document.createElement("b");
      heading.textContent = title;
      heading.style.cssText = "display:block;font-size:23px;margin-bottom:7px";
      const sub = document.createElement("span");
      sub.textContent = text;
      sub.style.cssText = "display:block;font-size:16px;line-height:1.5";
      card.append(heading, sub);
    },
    { title, text },
  );
}
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox",
    "--enable-unsafe-swiftshader",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--autoplay-policy=no-user-gesture-required",
  ],
});
const clips = [];
try {
  for (const [i, kind] of ["city", "auction", "custody"].entries()) {
    console.log(`Recording ${kind}…`);
    const closeServer = await launch(kind, 3044 + i),
      context = await browser.newContext({
        viewport: { width: 1600, height: 900 },
        deviceScaleFactor: 1,
      });
    await audioCapture(context);
    try {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => {
        if (!errors.includes(e.stack ?? e.message))
          errors.push(e.stack ?? e.message);
      });
      await page.goto(`http://127.0.0.1:${3044 + i}/`);
      await expect(page.getByText("Alex (you)", { exact: true })).toBeVisible();
      await expect(page.locator("canvas")).toHaveAttribute(
        "data-draw-calls",
        /\d+/,
        { timeout: 15000 },
      );
      await page
        .getByRole("combobox", { name: "Graphics quality" })
        .selectOption("MEDIUM");
      await page.mouse.move(1100, 650);
      const stop = await record(page, kind);
      try {
        await page
          .getByRole("button", { name: "Enable sound", exact: true })
          .click();
        if (kind === "city") {
          await caption(
            page,
            `ZMONOPOLY v${GAME_VERSION}`,
            "Recorded gameplay and audio · seeded demonstration scenarios",
          );
          await pause(2600);
          await page
            .getByRole("button", { name: "Resume", exact: true })
            .click();
          await caption(
            page,
            "A living Halloween city",
            "Bats, glowing windows, moving traffic and a storm over the castle",
          );
          await page.mouse.move(1050, 550);
          await page.mouse.down();
          await page.mouse.move(870, 590, { steps: 35 });
          await page.mouse.up();
          await pause(2500);
          await page
            .getByRole("button", { name: "Properties", exact: true })
            .click();
          await page
            .locator("summary")
            .filter({ hasText: "Harbor Row" })
            .click();
          await page.getByRole("button", { name: /Dockside Works/ }).click();
          await caption(
            page,
            "Build a district",
            "Three district properties unlock development. Buildings change as you invest.",
          );
          await page.getByRole("button", { name: /^Build for / }).click();
          await pause(2500);
          await page
            .getByRole("button", { name: "Back to play", exact: true })
            .click();
          await page
            .getByRole("button", { name: "Finish planning", exact: true })
            .click();
          await caption(
            page,
            "Roll, travel, then choose",
            "Server-generated dice · a route choice · a surprise encounter after landing",
          );
          await page
            .getByRole("button", { name: "Roll dice", exact: true })
            .click();
          await pause(2700);
          await page
            .getByRole("button", { name: /Harbor|Dockside Works/ })
            .filter({ hasText: "Outer road" })
            .click();
          await pause(3000);
          await page
            .getByRole("button", { name: "Find me", exact: true })
            .click();
          await pause(2300);
        } else if (kind === "auction") {
          await page
            .getByRole("button", { name: "Resume", exact: true })
            .click();
          await page
            .getByRole("button", { name: "Find auction", exact: true })
            .click();
          await caption(
            page,
            "Everyone can bid",
            "Declined properties become public auctions. Bids are binding; passes finish them early.",
          );
          await pause(1700);
          await page.getByLabel("Your bid").fill("150");
          await page
            .getByRole("button", { name: "Bid $150", exact: true })
            .click();
          await pause(1700);
          await page.getByLabel("Your bid").fill("450");
          await page
            .getByRole("button", { name: "Bid $450", exact: true })
            .click();
          await expect(
            page.getByText("Alex wins the auction", { exact: true }),
          ).toBeVisible();
          await pause(1900);
          await page.getByRole("button", { name: /Trade & bank/ }).click();
          const desk = page.getByRole("dialog", {
            name: "Trade & bank",
            exact: true,
          });
          await desk.getByRole("tab", { name: "Bank", exact: true }).click();
          await caption(
            page,
            "Borrow against property",
            "Fixed interest, visible maturity and collateral limits. Borrowed money does not inflate your score.",
          );
          await desk.getByLabel("Pledge Ocean Exchange").check();
          await desk.getByLabel("Amount to borrow").fill("100");
          await desk
            .getByRole("button", { name: "Borrow $100", exact: true })
            .click();
          await pause(2200);
          await desk.getByRole("tab", { name: "Trades", exact: true }).click();
          await desk
            .getByRole("button", { name: "Make a trade offer", exact: true })
            .click();
          await desk.getByLabel("Trade with").selectOption("bot-0");
          await desk.getByLabel("Your cash offer").fill("340");
          await desk.getByLabel(/Harbor House/).check();
          await caption(
            page,
            "Make a deal",
            "Private multi-property offers, counteroffers and five server-enforced contract types",
          );
          await pause(1800);
          await desk
            .getByRole("button", { name: "Send offer", exact: true })
            .click();
          await expect(desk.locator(".offer-card")).toHaveCount(0, {
            timeout: 6000,
          });
          await pause(1300);
          await page.keyboard.press("Escape");
          await pause(1500);
        } else {
          await page
            .getByRole("button", { name: "Find me", exact: true })
            .click();
          await caption(
            page,
            "Risk has consequences",
            "An illegal offer discloses a 40% arrest chance. This seeded example is caught.",
          );
          await page
            .getByRole("button", { name: "Resume", exact: true })
            .click();
          await pause(1800);
          await page.locator(".surprise-option").nth(1).click();
          await pause(1400);
          await page
            .getByRole("button", { name: "View prison", exact: true })
            .click();
          await page
            .getByRole("button", { name: "Pause", exact: true })
            .click();
          await pause(ESCORT_DURATION_MS + 250);
          await page
            .getByRole("button", { name: "Find me", exact: true })
            .click();
          await caption(
            page,
            "Escorted to custody",
            "Pay bail, serve two turns or use Alibi. Your properties continue to earn rent.",
          );
          await pause(2500);
          await page
            .getByRole("combobox", { name: "Bot speed" })
            .selectOption("FAST");
          await page
            .getByRole("button", { name: "Resume", exact: true })
            .click();
          await page
            .getByRole("button", { name: "Finish planning", exact: true })
            .click({ timeout: 15000 });
          await page
            .getByRole("button", {
              name: "Pay $200 bail and roll",
              exact: true,
            })
            .click({ timeout: 10000 });
          await pause(1600);
          await caption(
            page,
            "Your next game night",
            "4–15 seats · bots for practice · Discord for conversation · desktop browser",
          );
          await page
            .getByRole("button", { name: "Reset camera", exact: true })
            .click();
          await pause(2800);
        }
        if (errors.length) throw Error(errors.join("\n"));
      } finally {
        clips.push(await stop());
      }
    } finally {
      await context.close();
      await closeServer();
    }
  }
  const list = path.join(out, "clips.txt");
  await writeFile(
    list,
    clips.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join("\n"),
  );
  await run("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    list,
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    "docs/zmonopoly-preview.mp4",
  ]);
  await run("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-ss",
    "4",
    "-i",
    "docs/zmonopoly-preview.mp4",
    "-frames:v",
    "1",
    "-q:v",
    "3",
    "docs/preview-poster.jpg",
  ]);
  console.log(
    `Preview saved (${(await readFile("docs/zmonopoly-preview.mp4")).length} bytes).`,
  );
} finally {
  await browser.close();
}
