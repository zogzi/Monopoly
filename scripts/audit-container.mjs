import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { get } from "node:http";
import { brotliDecompressSync } from "node:zlib";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { io } from "socket.io-client";
const { version } = JSON.parse(await readFile("package.json", "utf8"));
const execute = promisify(execFile),
  name = `zmonopoly-audit-${Date.now()}`,
  volume = `${name}-save`;
const docker = (...args) => execute("docker", args, { maxBuffer: 1024 * 1024 });
const base = "http://127.0.0.1:3040",
  sockets = [];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function ready() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(base + "/api/health");
      if (r.ok) return r.json();
    } catch {}
    await delay(100);
  }
  throw Error("Container did not become ready");
}
async function start() {
  await docker(
    "run",
    "--detach",
    "--name",
    name,
    "--publish",
    "127.0.0.1:3040:3001",
    "--mount",
    `type=volume,source=${volume},target=/data`,
    "--security-opt",
    "no-new-privileges:true",
    "--cap-drop",
    "ALL",
    `zmonopoly:${version}`,
  );
  return ready();
}
async function seat(token) {
  const socket = io(base, {
    transports: ["websocket"],
    autoConnect: false,
    reconnection: false,
  });
  sockets.push(socket);
  let state;
  socket.on("GAME_SNAPSHOT", (s) => (state = s));
  socket.connect();
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
  const command = (event, payload) =>
    new Promise((resolve, reject) =>
      socket
        .timeout(3000)
        .emit(event, payload, (error, result) =>
          error
            ? reject(error)
            : result.ok
              ? resolve(result)
              : reject(Error(result.error)),
        ),
    );
  const joined = await command("JOIN_GAME", { name: "Hosting audit", token });
  return { socket, joined, command, state: () => state };
}
try {
  await docker("volume", "create", volume);
  const health = await start();
  assert.equal(health.version, version);
  const uid = (
    await docker(
      "exec",
      name,
      "node",
      "-e",
      "process.stdout.write(String(process.getuid()))",
    )
  ).stdout.trim();
  assert.notEqual(uid, "0");
  const source = (await fetch(base)).text();
  const html = await source,
    asset = html.match(/src="([^\"]+\.js)"/)?.[1];
  assert(asset);
  const compressed = await new Promise((resolve, reject) =>
    get(base + asset, { headers: { "Accept-Encoding": "br" } }, (r) => {
      const chunks = [];
      r.on("data", (b) => chunks.push(b));
      r.on("end", () =>
        resolve({ headers: r.headers, body: Buffer.concat(chunks) }),
      );
    }).on("error", reject),
  );
  assert.equal(compressed.headers["content-encoding"], "br");
  assert.match(compressed.headers["cache-control"], /immutable/);
  const text = brotliDecompressSync(compressed.body);
  assert(text.length > compressed.body.length);
  assert.equal((await fetch(base)).headers.get("cache-control"), "no-cache");
  const first = await seat();
  for (let i = 0; i < 3; i++)
    await first.command("COMMAND", { type: "ADD_BOT" });
  await first.command("COMMAND", { type: "READY" });
  await first.command("COMMAND", { type: "START" });
  await delay(200);
  assert.equal(first.state().players.length, 4);
  assert.notEqual(first.state().phase, "PLANNING");
  assert.notEqual(first.state().phase, "LOBBY");
  const timeBeforeStop = first.state().deadline - Date.now();
  const stopAt = Date.now();
  await docker("stop", "--time", "5", name);
  const shutdownMs = Date.now() - stopAt;
  assert.equal(
    (
      await docker("inspect", "--format", "{{.State.ExitCode}}", name)
    ).stdout.trim(),
    "0",
  );
  first.socket.disconnect();
  await docker("rm", name);
  await start();
  const restored = await seat(first.joined.token);
  await delay(100);
  assert.equal(restored.joined.id, first.joined.id);
  assert.equal(restored.state().players.length, 4);
  assert.equal(restored.state().paused, true);
  const remaining = restored.state().pausedTimers.decision;
  assert(
    remaining > timeBeforeStop - 3000 && remaining <= timeBeforeStop + 1000,
  );
  await restored.command("COMMAND", { type: "RESUME" });
  await delay(100);
  assert(restored.state().deadline - Date.now() <= remaining + 100);
  const report = {
    version: health.version,
    productionContainer: true,
    uid: Number(uid),
    staticEncoding: compressed.headers["content-encoding"],
    hashedAssetCache: compressed.headers["cache-control"],
    entryJavaScriptBytes: text.length,
    entryJavaScriptTransferredBytes: compressed.body.length,
    gracefulShutdownWithClientMs: shutdownMs,
    recreatedContainerRestoredSeats: restored.state().players.length,
    reconnectRetainedIdentity: true,
    restoredGamePaused: true,
    restoredTimerPreserved: true,
  };
  await mkdir("artifacts", { recursive: true });
  await writeFile(
    "artifacts/hosting-audit.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
} finally {
  sockets.forEach((s) => s.disconnect());
  await docker("rm", "--force", name).catch(() => {});
  await docker("volume", "rm", volume).catch(() => {});
}
