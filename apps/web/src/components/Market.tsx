import { useState } from "react";
import type { Player, State } from "../../../../packages/shared/index";
import { command } from "../store";
import Modal from "./Modal";
import TradeDesk from "./TradeDesk";
import BankDesk from "./BankDesk";
import { contractText } from "./marketText";
import { money } from "./TurnPanel";
export default function Market({
  s,
  me,
  onClose,
}: {
  s: State;
  me: Player;
  onClose: () => void;
}) {
  const [tab, setTab] = useState("Trades");
  const enabled =
    !s.paused &&
    !me.eliminated &&
    !["LOBBY", "GAME_OVER", "AUCTION"].includes(s.phase) &&
    !(s.phase === "PLANNING" && s.planningReady.includes(me.id));
  const incoming = s.offers.filter((o) => o.to === me.id).length;
  return (
    <Modal title="Trade & bank" onClose={onClose} className="market-modal">
      <div className="market-wallet">
        Your cash <strong>{money(me.cash)}</strong>
      </div>
      <div className="market-tabs" role="tablist" aria-label="Market sections">
        {["Trades", "Bank", "Contracts"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {t}
            {t === "Trades" && incoming ? ` (${incoming})` : ""}
          </button>
        ))}
      </div>
      {!enabled && (
        <p className="market-notice">
          {s.paused
            ? "Resume the game to make deals."
            : s.phase === "AUCTION"
              ? "Finish the auction before making other deals."
              : s.phase === "PLANNING" && s.planningReady.includes(me.id)
                ? "Click Back to planning to make deals."
                : "Deals open when the game starts."}
        </p>
      )}
      {tab === "Trades" && <TradeDesk s={s} me={me} enabled={enabled} />}
      {tab === "Bank" && <BankDesk s={s} me={me} enabled={enabled} />}
      {tab === "Contracts" && (
        <>
          <p>
            Accepted contracts are public and enforced automatically. Future
            payments and loans settle after the stated round, before the next
            planning phase.
          </p>
          {s.contracts.map((c) => (
            <article key={c.id} className="offer-card">
              <h3>
                {
                  {
                    payment: "Future payment",
                    loan: "Private loan",
                    revenue: "Revenue share",
                    immunity: "Rent immunity",
                    option: "Purchase option",
                  }[c.kind]
                }
              </h3>
              <p>{contractText(c, s)}</p>
              {c.kind === "option" && c.beneficiary === me.id && (
                <button
                  className="primary"
                  disabled={!enabled || me.cash < c.amount}
                  onClick={() => command("EXERCISE_OPTION", { id: c.id })}
                >
                  Buy {s.board[c.tile].name} for {money(c.amount)}
                </button>
              )}
            </article>
          ))}
          {!s.contracts.length && (
            <p>
              No active contracts. Add a preset contract to a trade offer to
              negotiate one.
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
