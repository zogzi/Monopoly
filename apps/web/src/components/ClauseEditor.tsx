import { useState } from "react";
import type { Clause } from "../../../../packages/shared/economy";
import { districts, type State } from "../../../../packages/shared/index";
export default function ClauseEditor({
  s,
  onAdd,
}: {
  s: State;
  onAdd: (c: Clause) => void;
}) {
  const [kind, setKind] = useState<Clause["kind"]>("payment"),
    [giver, setGiver] = useState<"from" | "to">("from"),
    [amount, setAmount] = useState(200),
    [principal, setPrincipal] = useState(150),
    [rounds, setRounds] = useState(2),
    [tile, setTile] = useState(1),
    [percent, setPercent] = useState(20),
    [district, setDistrict] = useState(0),
    [uses, setUses] = useState(2);
  return (
    <details className="clause-editor">
      <summary>Add an optional contract</summary>
      <p>
        Both players approve these terms with the trade. The server enforces
        them.
      </p>
      <div className="market-fields">
        <label>
          Contract type
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Clause["kind"])}
          >
            <option value="payment">Future payment</option>
            <option value="loan">Private loan</option>
            <option value="revenue">Revenue share</option>
            <option value="immunity">Rent immunity</option>
            <option value="option">Purchase option</option>
          </select>
        </label>
        <label>
          Who grants it?
          <select
            value={giver}
            onChange={(e) => setGiver(e.target.value as "from" | "to")}
          >
            <option value="from">You</option>
            <option value="to">The other player</option>
          </select>
        </label>
        {(kind === "payment" || kind === "loan" || kind === "option") && (
          <label>
            {kind === "option"
              ? "Option purchase price"
              : kind === "loan"
                ? "Total repayment"
                : "Future payment amount"}
            <input
              type="number"
              min={1}
              max={10000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </label>
        )}
        {kind === "loan" && (
          <label>
            Amount lent now
            <input
              type="number"
              min={1}
              max={10000}
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
            />
          </label>
        )}
        {(kind === "option" || kind === "revenue") && (
          <label>
            Contract property
            <select
              value={tile}
              onChange={(e) => setTile(Number(e.target.value))}
            >
              {s.board
                .filter((t) => t.owner)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </label>
        )}
        {kind === "revenue" && (
          <label>
            Rent share (%)
            <input
              type="number"
              min={10}
              max={50}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
            />
          </label>
        )}
        {kind === "immunity" ? (
          <>
            <label>
              Rent-free district
              <select
                value={district}
                onChange={(e) => setDistrict(Number(e.target.value))}
              >
                {districts.map((d, i) => (
                  <option key={d.name} value={i}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Rent-free visits
              <select
                value={uses}
                onChange={(e) => setUses(Number(e.target.value))}
              >
                <option value={1}>1 visit</option>
                <option value={2}>2 visits</option>
              </select>
            </label>
          </>
        ) : (
          <label>
            Rounds from now
            <select
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n} · through round {s.round + n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <button
        type="button"
        onClick={() =>
          onAdd(
            kind === "loan"
              ? { kind, giver, principal, amount, rounds }
              : kind === "payment"
                ? { kind, giver, amount, rounds }
                : kind === "revenue"
                  ? { kind, giver, tile, percent, rounds }
                  : kind === "immunity"
                    ? { kind, giver, district, uses }
                    : { kind, giver, tile, amount, rounds },
          )
        }
      >
        Add contract to offer
      </button>
    </details>
  );
}
