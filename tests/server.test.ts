import { test, expect } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { connect as connectTcp, type Socket as TcpSocket } from "node:net";
import { io, type Socket } from "socket.io-client";
import type { State } from "../packages/shared/index";
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
test("15 real clients, validation, authorization, reconnect and disk restoration", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "empire-integration-"));
  const port = 3018;
  const url = `http://127.0.0.1:${port}`;
  let process: ChildProcess | undefined;
  const clients: Socket[] = [];
  let unfinishedHttp: TcpSocket | undefined;
  async function start() {
    process = spawn(
      globalThis.process.execPath,
      ["--import", "tsx", "apps/server/index.ts"],
      {
        cwd: globalThis.process.cwd(),
        env: {
          ...globalThis.process.env,
          PORT: String(port),
          SAVE_DIR: directory,
        },
        stdio: "pipe",
      },
    );
    let output = "";
    process.stderr?.on("data", (chunk) => (output += chunk));
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(url + "/api/health")).ok) return;
      } catch {}
      if (process.exitCode !== null) throw Error(output);
      await delay(50);
    }
    throw Error("Server did not become ready.");
  }
  async function stop() {
    if (!process) return;
    if (process.exitCode !== null) {
      process = undefined;
      return;
    }
    const done = new Promise<void>((resolve) =>
      process!.once("exit", () => resolve()),
    );
    process.kill("SIGTERM");
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        done,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            process?.kill("SIGKILL");
            reject(
              Error("Graceful shutdown exceeded 2 seconds with live clients."),
            );
          }, 2000);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
    process = undefined;
  }
  async function connect() {
    const socket = io(url, { transports: ["websocket"], forceNew: true });
    clients.push(socket);
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", () => resolve());
      socket.once("connect_error", reject);
    });
    return socket;
  }
  const emit = (socket: Socket, event: string, payload: unknown) =>
    new Promise<{ ok: boolean; id: string; token: string }>((resolve, reject) =>
      socket
        .timeout(2500)
        .emit(
          event,
          payload,
          (
            error: Error | null,
            result: { ok: boolean; id: string; token: string },
          ) => (error ? reject(error) : resolve(result)),
        ),
    );
  try {
    await start();
    let snapshot: State | undefined;
    const seats: { socket: Socket; id: string; token: string; ok: boolean }[] =
      [];
    for (let i = 0; i < 15; i++) {
      const socket = await connect();
      socket.on("GAME_SNAPSHOT", (state) => (snapshot = state));
      const result = await emit(socket, "JOIN_GAME", {
        name: `Friend ${i}`,
        figure: i % 2 ? "vesper" : "moxie",
      });
      expect(result.ok).toBe(true);
      seats.push({ socket, ...result });
    }
    const extra = await connect();
    expect((await emit(extra, "JOIN_GAME", { name: "Sixteen" })).ok).toBe(
      false,
    );
    expect((await emit(seats[1].socket, "COMMAND", { type: "START" })).ok).toBe(
      false,
    );
    for (const seat of seats)
      expect((await emit(seat.socket, "COMMAND", { type: "READY" })).ok).toBe(
        true,
      );
    expect((await emit(seats[0].socket, "COMMAND", { type: "START" })).ok).toBe(
      true,
    );
    expect(
      (await emit(seats[1].socket, "COMMAND", { type: "ADD_BOT" })).ok,
    ).toBe(false);
    expect(
      (
        await emit(seats[1].socket, "COMMAND", {
          type: "CHAT",
          text: "removed",
        })
      ).ok,
    ).toBe(false);
    const oldId = seats[3].id;
    seats[3].socket.disconnect();
    const replacement = await connect();
    expect(
      (
        await emit(replacement, "JOIN_GAME", {
          name: "Friend 3",
          token: seats[3].token,
        })
      ).id,
    ).toBe(oldId);
    expect(
      (await emit(replacement, "COMMAND", { type: "BUY", cash: 100000 })).ok,
    ).toBe(false);
    expect(
      (
        await emit(replacement, "COMMAND", {
          type: "REACTION",
          emoji: "👀",
        })
      ).ok,
    ).toBe(true);
    await delay(100);
    expect(snapshot?.players).toHaveLength(15);
    expect(JSON.stringify(snapshot)).not.toContain("seed");
    expect(JSON.stringify(snapshot)).not.toContain(seats[0].token);
    expect(
      (
        await emit(seats[0].socket, "COMMAND", {
          type: "SIMULATION",
          autoplay: true,
          speed: "FAST",
        })
      ).ok,
    ).toBe(true);
    const nextHost = snapshot?.players.find(
      (p) => p.id !== seats[0].id && p.connected && !p.bot,
    )?.id;
    seats[0].socket.disconnect();
    await delay(75);
    expect(snapshot?.host).toBe(nextHost);
    expect(snapshot?.simulation.autoplay).toBe(false);
    // A browser can leave an HTTP connection open while a game is shutting down.
    unfinishedHttp = connectTcp(port, "127.0.0.1");
    await new Promise<void>((resolve) =>
      unfinishedHttp!.once("connect", resolve),
    );
    unfinishedHttp.write("GET /api/health HTTP/1.1\r\nHost: localhost\r\n");
    const httpClosed = new Promise<void>((resolve) =>
      unfinishedHttp!.once("close", resolve),
    );
    await stop();
    await httpClosed;
    expect(unfinishedHttp.destroyed).toBe(true);
    expect(clients.every((s) => !s.connected)).toBe(true);
    clients.forEach((s) => s.disconnect());
    const saved = JSON.parse(
      await readFile(path.join(directory, "current-game.json"), "utf8"),
    );
    expect(saved.state.reactions[oldId].emoji).toBe("👀");
    expect(saved.state.chat).toBeUndefined();
    await start();
    const restored = await connect();
    let restoredState: State | undefined;
    restored.on("GAME_SNAPSHOT", (s) => (restoredState = s));
    const result = await emit(restored, "JOIN_GAME", {
      name: "Friend 0",
      token: seats[0].token,
    });
    expect(result.id).toBe(seats[0].id);
    await delay(50);
    expect(restoredState?.paused).toBe(true);
    expect(restoredState?.players).toHaveLength(15);
    expect(restoredState?.pausedTimers?.decision).toBe(
      Math.max(0, saved.state.deadline - saved.writtenAt),
    );
    expect(restoredState?.pausedTimers?.turn).toBe(
      Math.max(0, saved.state.turnDeadline - saved.writtenAt),
    );
  } finally {
    unfinishedHttp?.destroy();
    clients.forEach((s) => s.disconnect());
    await stop();
    await rm(directory, { recursive: true, force: true });
  }
}, 20000);
