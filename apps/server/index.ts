import Fastify from "fastify";
import { Server } from "socket.io";
import staticPlugin from "@fastify/static";
import { randomUUID, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { Game } from "../../packages/game-core/index";
import {
  commandSchema,
  tokens as tokenOptions,
} from "../../packages/shared/index";
import { z } from "zod";
const root = process.cwd();
const saveDir = path.resolve(process.env.SAVE_DIR || "save");
let game = new Game();
let tokens: Record<string, string> = {};
let restored = false;
try {
  const saved = JSON.parse(
    await readFile(path.join(saveDir, "current-game.json"), "utf8"),
  );
  game = new Game(saved.state, saved.seed);
  tokens = saved.tokens;
  game.state.players.forEach((p) => (p.connected = false));
  if (game.state.phase !== "LOBBY" && game.state.phase !== "GAME_OVER") {
    game.state.paused = true;
    restored = true;
  }
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
}
let writing = Promise.resolve();
function persist() {
  const contents = JSON.stringify({
    state: game.state,
    seed: game.seed,
    tokens,
  });
  writing = writing
    .then(async () => {
      await mkdir(saveDir, { recursive: true });
      await writeFile(path.join(saveDir, "current-game.tmp"), contents, {
        mode: 0o600,
      });
      await rename(
        path.join(saveDir, "current-game.tmp"),
        path.join(saveDir, "current-game.json"),
      );
    })
    .catch((e) => app.log.error(e, "Snapshot save failed"));
}
const app = Fastify({ logger: true });
const io = new Server(app.server, { maxHttpBufferSize: 16384 });
const seats = new Map<string, string>();
const lastAction = new Map<string, { at: number; count: number }>();
function broadcast() {
  io.emit("GAME_SNAPSHOT", game.state);
  persist();
}
const joinSchema = z.object({
  name: z.string().trim().min(1).max(20),
  token: z.string().max(128).optional(),
  figure: z.enum(tokenOptions).default("rocket"),
});
io.on("connection", (socket) => {
  socket.emit("GAME_SNAPSHOT", game.state);
  socket.on("JOIN_GAME", (raw, ack) => {
    if (typeof ack !== "function") return;
    try {
      if (seats.has(socket.id))
        throw Error("This connection already has a seat.");
      const data = joinSchema.parse(raw);
      let id = data.token ? tokens[data.token] : undefined;
      let token = data.token;
      if (id) {
        game.player(id).connected = true;
      } else {
        id = randomUUID();
        token = randomBytes(32).toString("hex");
        game.join(id, data.name, data.figure);
        tokens[token] = id;
      }
      if (
        !game.state.players.some((p) => p.id === game.state.host && p.connected)
      )
        game.state.host = id;
      seats.set(socket.id, id);
      ack({ ok: true, id, token, restored });
      broadcast();
    } catch (e) {
      ack({
        ok: false,
        error:
          e instanceof z.ZodError
            ? "Enter a name of 1–20 characters."
            : e instanceof Error
              ? e.message
              : "Unexpected server error",
      });
    }
  });
  socket.on("COMMAND", (raw, ack) => {
    if (typeof ack !== "function") return;
    try {
      const id = seats.get(socket.id);
      if (!id) throw Error("Join the city first.");
      const now = Date.now(),
        rate = lastAction.get(socket.id);
      if (rate && now - rate.at < 1000) {
        if (++rate.count > 12) throw Error("Slow down for a moment.");
      } else lastAction.set(socket.id, { at: now, count: 1 });
      const action = commandSchema.parse(raw);
      game.action(id, action);
      ack({ ok: true });
      broadcast();
    } catch (e) {
      ack({
        ok: false,
        error:
          e instanceof z.ZodError
            ? "Invalid command."
            : e instanceof Error
              ? e.message
              : "Unexpected server error",
      });
    }
  });
  socket.on("disconnect", () => {
    const id = seats.get(socket.id);
    seats.delete(socket.id);
    lastAction.delete(socket.id);
    if (id && !Array.from(seats.values()).includes(id)) {
      game.player(id).connected = false;
      const host = game.state.players.find((p) => p.connected);
      if (game.state.host === id && host) game.state.host = host.id;
      broadcast();
    }
  });
});
setInterval(() => {
  try {
    if (game.tick()) broadcast();
  } catch (e) {
    app.log.error(e);
    game.state.paused = true;
    broadcast();
  }
}, 250).unref();
app.get("/api/health", async () => ({
  ok: true,
  game: "Empire Circuit",
  phase: game.state.phase,
  players: game.state.players.length,
}));
if (existsSync(path.join(root, "dist"))) {
  await app.register(staticPlugin, { root: path.join(root, "dist") });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith("/api/"))
      return reply.code(404).send({ error: "Not found" });
    return reply.sendFile("index.html");
  });
}
const stop = async () => {
  persist();
  await writing;
  await app.close();
  process.exit(0);
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
await app.listen({ port: Number(process.env.PORT || 3001), host: "0.0.0.0" });
