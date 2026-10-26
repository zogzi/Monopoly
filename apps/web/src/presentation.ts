import type { State } from "../../../packages/shared/index";
/** Reuse unchanged objects across full socket snapshots, so cash/turn updates don't rebuild the city. */
function equalRecord(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((v, i) => equalRecord(v, b[i]))
    );
  const left = a as Record<string, unknown>,
    right = b as Record<string, unknown>,
    keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every(
      (key) => Object.hasOwn(right, key) && equalRecord(left[key], right[key]),
    )
  );
}
export function shareSnapshot(previous: State, next: State): State {
  const board = next.board.map((t, i) =>
    previous.board[i] && equalRecord(previous.board[i], t)
      ? previous.board[i]
      : t,
  );
  const players = next.players.map((p) => {
    const old = previous.players.find((q) => q.id === p.id);
    return old && equalRecord(old, p) ? old : p;
  });
  return {
    ...next,
    board:
      board.length === previous.board.length &&
      board.every((t, i) => t === previous.board[i])
        ? previous.board
        : board,
    players:
      players.length === previous.players.length &&
      players.every((p, i) => p === previous.players[i])
        ? previous.players
        : players,
  };
}
