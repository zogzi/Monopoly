import type { Clause, Contract } from "../../../../packages/shared/economy";
import { districts, type State } from "../../../../packages/shared/index";
import { money } from "./TurnPanel";
export function clauseText(c: Clause, s: State, from: string, to: string) {
  const giver =
    s.players.find((p) => p.id === (c.giver === "from" ? from : to))?.name ??
    "Player";
  if (c.kind === "payment")
    return `${giver} pays ${money(c.amount)} after round ${s.round + c.rounds}.`;
  if (c.kind === "loan")
    return `${giver} lends ${money(c.principal)} now; receives ${money(c.amount)} after round ${s.round + c.rounds}.`;
  if (c.kind === "revenue")
    return `${giver} shares ${c.percent}% of ${s.board[c.tile].name} rent through round ${s.round + c.rounds}.`;
  if (c.kind === "immunity")
    return `${giver} waives rent on ${c.uses} visits in ${districts[c.district].name}.`;
  return `${giver} grants the right to buy ${s.board[c.tile].name} for ${money(c.amount)} through round ${s.round + c.rounds}.`;
}
export function contractText(c: Contract, s: State) {
  const name = (id: string) =>
    s.players.find((p) => p.id === id)?.name ?? "Player";
  if ("payer" in c)
    return `${name(c.payer)} pays ${name(c.payee)} ${money(c.amount)} after round ${c.dueRound}.`;
  if (c.kind === "revenue")
    return `${name(c.owner)} shares ${c.percent}% of ${s.board[c.tile].name} rent with ${name(c.beneficiary)} through round ${c.expiresRound}.`;
  if (c.kind === "immunity")
    return `${name(c.beneficiary)} has ${c.remaining} rent-free visits to ${name(c.owner)}’s properties in ${districts[c.district].name}.`;
  return `${name(c.beneficiary)} may buy ${s.board[c.tile].name} from ${name(c.owner)} for ${money(c.amount)} through round ${c.expiresRound}.`;
}
