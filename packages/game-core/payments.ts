import type { Player, State } from "../shared/index";
import type { DuePayment } from "../shared/economy";

export const shortfall = (s: State, id: string) =>
  s.arrears.filter((d) => d.payer === id).reduce((n, d) => n + d.amount, 0);

/** Cumulative rounding makes several part-payments equal one full revenue-share payment. */
export function receive(s: State, due: DuePayment, amount: number) {
  if (!amount) return;
  let share = 0;
  if (due.rent) {
    const rent = due.rent;
    share =
      Math.floor(((rent.received + amount) * rent.percent) / 100) -
      Math.floor((rent.received * rent.percent) / 100);
    rent.received += amount;
    s.stats[rent.owner].rent += amount;
    if (rent.beneficiary) {
      const beneficiary = s.players.find(
        (p) => p.id === rent.beneficiary && !p.eliminated,
      );
      if (beneficiary) beneficiary.cash += share;
      else share = 0;
    }
  }
  const recipient = s.players.find((p) => p.id === due.payee && !p.eliminated);
  if (recipient) recipient.cash += amount - share;
}

export function charge(
  s: State,
  p: Player,
  amount: number,
  terms: Omit<DuePayment, "payer" | "amount">,
) {
  const funded = Math.min(Math.max(0, p.cash), amount);
  const due: DuePayment = { ...terms, payer: p.id, amount: amount - funded };
  p.cash -= amount;
  receive(s, due, funded);
  if (due.amount) s.arrears.push(due);
  return funded;
}

/** Cash raised during recovery pays existing shortfalls before becoming spendable. */
export function settleArrears(s: State) {
  let progressed: boolean;
  do {
    progressed = false;
    for (const p of s.players.filter((p) => !p.eliminated)) {
      let funded = Math.max(0, shortfall(s, p.id) - Math.max(0, -p.cash));
      if (!funded) continue;
      for (const due of s.arrears.filter((d) => d.payer === p.id && d.amount)) {
        const paid = Math.min(funded, due.amount);
        due.amount -= paid;
        funded -= paid;
        receive(s, due, paid);
        if (paid) progressed = true;
        if (!funded) break;
      }
    }
    s.arrears = s.arrears.filter((d) => d.amount > 0);
  } while (progressed);
}

export function dueReceivable(due: DuePayment, id: string) {
  const rent = due.rent;
  const share = rent?.beneficiary
    ? Math.floor(((rent.received + due.amount) * rent.percent) / 100) -
      Math.floor((rent.received * rent.percent) / 100)
    : 0;
  return (
    (due.payee === id ? due.amount - share : 0) +
    (rent?.beneficiary === id ? share : 0)
  );
}
