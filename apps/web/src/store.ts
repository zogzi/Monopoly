import { create } from "zustand";
import { io } from "socket.io-client";
import { initialState } from "../../../packages/game-core/index";
import type { State, Token } from "../../../packages/shared/index";
export const socket = io({ autoConnect: false });
export const useGame = create<{
  state: State;
  id: string | null;
  connected: boolean;
  error: string;
  setError: (s: string) => void;
}>((set) => ({
  state: initialState(),
  id: null,
  connected: false,
  error: "",
  setError: (error) => set({ error }),
}));
socket.on("GAME_SNAPSHOT", (state) => useGame.setState({ state }));
socket.on("connect", () => {
  useGame.setState({ connected: true });
  const token = localStorage.getItem("empire-token"),
    name = localStorage.getItem("empire-name");
  if (token && name) join(name, token);
});
socket.on("disconnect", () => useGame.setState({ connected: false }));
export function join(name: string, token?: string, figure: Token = "moxie") {
  socket.emit(
    "JOIN_GAME",
    { name, token, figure },
    (r: { ok: boolean; id?: string; token?: string; error?: string }) => {
      if (r.ok) {
        localStorage.setItem("empire-token", r.token!);
        localStorage.setItem("empire-name", name);
        useGame.setState({ id: r.id!, error: "" });
      } else {
        if (token) {
          localStorage.removeItem("empire-token");
          useGame.setState({ id: null });
        }
        useGame.setState({ error: r.error || "Connection failed." });
      }
    },
  );
}
export function command(type: string, data: Record<string, unknown> = {}) {
  socket.emit(
    "COMMAND",
    { type, ...data },
    (r: { ok: boolean; id?: string; token?: string; error?: string }) => {
      if (!r.ok) useGame.setState({ error: r.error || "Connection failed." });
    },
  );
}
socket.connect();
