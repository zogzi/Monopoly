import { useState } from "react";
import type { Player, State } from "../../../../packages/shared/index";
import type { BankLoan } from "../../../../packages/shared/economy";
import {
  bankDebt,
  credit,
  lockedReason,
  obligations,
  receivables,
} from "../../../../packages/game-core/finance";
import { capacity } from "../../../../packages/game-core/economy";
import { command } from "../store";
import { money } from "./TurnPanel";
function Loan({
  s,
  me,
  loan,
  enabled,
}: {
  s: State;
  me: Player;
  loan: BankLoan;
  enabled: boolean;
}) {
  const [amount, setAmount] = useState(100);
  const room = capacity(s, loan.collateral) - loan.balance;
  return (
    <article className="offer-card">
      <h3>{money(loan.balance)} bank balance</h3>
      <p>
        {Math.round(loan.rate * 100)}% per round · next interest{" "}
        {money(Math.ceil(loan.balance * loan.rate))} · principal due after round{" "}
        {loan.dueRound}
      </p>
      <p>
        Collateral: {loan.collateral.map((id) => s.board[id].name).join(", ")}
      </p>
      <label>
        Payment or additional borrowing
        <input
          type="number"
          min={1}
          max={100000}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </label>
      <div className="market-actions">
        <button
          disabled={
            !enabled || amount < 1 || amount > me.cash || amount > loan.balance
          }
          onClick={() => command("REPAY_LOAN", { id: loan.id, amount })}
        >
          Repay {money(amount)}
        </button>
        <button
          disabled={!enabled || amount < 1 || amount > room}
          onClick={() => command("REFINANCE", { id: loan.id, amount })}
        >
          Borrow {money(amount)} more
        </button>
        <button
          disabled={!enabled || me.cash < loan.balance}
          onClick={() =>
            command("REPAY_LOAN", { id: loan.id, amount: loan.balance })
          }
        >
          Repay all & release collateral
        </button>
      </div>
      <small>
        Available equity: {money(Math.max(0, room))}. Additional borrowing keeps
        the original rate and due round.
      </small>
    </article>
  );
}
export default function BankDesk({
  s,
  me,
  enabled,
}: {
  s: State;
  me: Player;
  enabled: boolean;
}) {
  const [selected, setSelected] = useState<number[]>([]),
    [amount, setAmount] = useState(100);
  const eligible = s.board.filter(
    (t) => t.owner === me.id && !lockedReason(s, t.id),
  );
  const collateral = selected.filter((id) => eligible.some((t) => t.id === id));
  const limit = capacity(s, collateral),
    rating = credit(s, me);
  return (
    <>
      <div className="market-summary">
        <div>
          <small>Credit rating</small>
          <b>{rating.grade}</b>
        </div>
        <div>
          <small>New bank rate</small>
          <b>{Math.round(rating.rate * 100)}% / round</b>
        </div>
        <div>
          <small>Bank debt</small>
          <b>{money(bankDebt(s, me.id))}</b>
        </div>
      </div>
      <p>
        Borrow up to 65% of selected property value. Interest starts after next
        round; principal is due after round {s.round + 3}. Repay early to
        release collateral. Pledged property cannot be traded, auctioned or
        stripped of development.
      </p>
      <div className="stat">
        <span>Private payments owed / receivable</span>
        <b>
          {money(obligations(s, me.id))} / {money(receivables(s, me.id))}
        </b>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          command("BORROW", { amount, collateral }, (ok) => {
            if (ok) setSelected([]);
          });
        }}
      >
        <h3>New secured loan</h3>
        <div className="market-properties">
          {eligible.map((t) => (
            <label className="property-check" key={t.id}>
              <input
                type="checkbox"
                aria-label={`Pledge ${t.name}`}
                checked={collateral.includes(t.id)}
                onChange={() =>
                  setSelected((ids) =>
                    ids.includes(t.id)
                      ? ids.filter((id) => id !== t.id)
                      : [...ids, t.id],
                  )
                }
              />
              <span>
                {t.name}
                <small>Level {t.level}</small>
              </span>
            </label>
          ))}
        </div>
        {!eligible.length && (
          <p>Buy an unpledged property to unlock bank borrowing.</p>
        )}
        <div className="market-fields">
          <label>
            Amount to borrow
            <input
              aria-label="Amount to borrow"
              type="number"
              min={1}
              max={Math.max(1, limit)}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </label>
          <div>
            <small>Collateral borrowing limit</small>
            <h3>{money(limit)}</h3>
          </div>
        </div>
        <button
          className="primary"
          disabled={
            !enabled || amount < 1 || amount > limit || !collateral.length
          }
        >
          Borrow {money(amount)}
        </button>
      </form>
      <h3>Your bank loans</h3>
      {s.loans
        .filter((l) => l.borrower === me.id)
        .map((loan) => (
          <Loan key={loan.id} s={s} me={me} loan={loan} enabled={enabled} />
        ))}
      {!s.loans.some((l) => l.borrower === me.id) && (
        <p>No outstanding bank loans.</p>
      )}
    </>
  );
}
