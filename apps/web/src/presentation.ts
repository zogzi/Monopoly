import type { State } from "../../../packages/shared/index";
/** Reuse unchanged objects across full socket snapshots, so cash/turn updates don't rebuild the city. */
function equalRecord(a: object, b: object) {
  const leftRecord = a as Record<string, unknown>,
    rightRecord = b as Record<string, unknown>;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => {
      const left = leftRecord[key],
        right = rightRecord[key];
      return Array.isArray(left) && Array.isArray(right)
        ? left.length === right.length && left.every((v, i) => v === right[i])
        : left === right;
    })
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
