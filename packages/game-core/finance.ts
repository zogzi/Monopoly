import type { Player, State } from "../shared/index";
import { shortfall, dueReceivable } from "./payments";

export function bankDebt(s: State, id: string) {
  return s.loans
    .filter((l) => l.borrower === id)
    .reduce((sum, l) => sum + l.balance, 0);
}
export function obligations(s: State, id: string) {
  return s.contracts.reduce(
    (sum, c) =>
      sum +
      ((c.kind === "payment" || c.kind === "loan") && c.payer === id
        ? c.amount
        : 0),
    0,
  );
}
export function receivables(s: State, id: string) {
  return (
    s.arrears.reduce((n, d) => n + dueReceivable(d, id), 0) +
    s.contracts.reduce(
      (sum, c) =>
        sum +
        ((c.kind === "payment" || c.kind === "loan") && c.payee === id
          ? c.amount
          : 0),
      0,
    )
  );
}
export function debt(s: State, id: string) {
  return bankDebt(s, id) + obligations(s, id) + shortfall(s, id);
}
export function credit(s: State, p: Player) {
  const assets = Math.max(
    1,
    Math.max(0, p.cash) +
      s.board
        .filter((t) => t.owner === p.id)
        .reduce((n, t) => n + t.price * (1 + t.level * 0.6), 0),
  );
  const ratio = debt(s, p.id) / assets;
  const grade =
    p.cash < 0 || (s.stats[p.id]?.defaults ?? 0) > 0
      ? "B"
      : ratio > 0.6
        ? "BB"
        : ratio > 0.45
          ? "BBB"
          : ratio > 0.3
            ? "A"
            : ratio > 0.15
              ? "AA"
              : "AAA";
  return {
    grade,
    rate:
      grade === "AAA" || grade === "AA"
        ? 0.05
        : grade === "A" || grade === "BBB"
          ? 0.08
          : 0.12,
  };
}
export function lockedReason(s: State, tile: number): string | null {
  if (s.arrears.some((d) => d.collateral?.includes(tile)))
    return "Secures overdue bank principal. Cover the shortfall first.";
  if (s.loans.some((l) => l.collateral.includes(tile)))
    return "Pledged to the bank. Repay that loan first.";
  if (
    s.contracts.some(
      (c) => (c.kind === "option" || c.kind === "revenue") && c.tile === tile,
    )
  )
    return "An active option or revenue contract covers this property.";
  return null;
}
