import { useState } from "react";
import type { Player, State } from "../../../../packages/shared/index";
import type {
  OfferDraft,
  TradeOffer,
} from "../../../../packages/shared/economy";
import { lockedReason } from "../../../../packages/game-core/finance";
import { command } from "../store";
import ClauseEditor from "./ClauseEditor";
import { clauseText } from "./marketText";
import { money } from "./TurnPanel";
const blank = (to: string): OfferDraft => ({
  to,
  give: { cash: 0, tiles: [] },
  take: { cash: 0, tiles: [] },
  clauses: [],
});
export default function TradeDesk({
  s,
  me,
  enabled,
}: {
  s: State;
  me: Player;
  enabled: boolean;
}) {
  const others = s.players.filter((p) => !p.eliminated && p.id !== me.id);
  const [draft, setDraft] = useState<OfferDraft>(() =>
    blank(others[0]?.id ?? ""),
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const target = s.players.find((p) => p.id === draft.to);
  const update = (side: "give" | "take", cash: number) =>
    setDraft((d) => ({ ...d, [side]: { ...d[side], cash } }));
  const toggle = (side: "give" | "take", id: number) =>
    setDraft((d) => ({
      ...d,
      [side]: {
        ...d[side],
        tiles: d[side].tiles.includes(id)
          ? d[side].tiles.filter((n) => n !== id)
          : [...d[side].tiles, id],
      },
    }));
  const counter = (o: TradeOffer) => {
    setDraft({
      to: o.from,
      give: o.take,
      take: o.give,
      clauses: o.clauses.map((c) => ({
        ...c,
        giver: c.giver === "from" ? "to" : "from",
      })),
      counter: o.id,
    });
    setSending(true);
    setSent(false);
  };
  const mine = s.offers.filter((o) => o.from === me.id || o.to === me.id);
  return (
    <>
      <p>
        Trade cash and several properties at once. You can negotiate in Discord
        while anybody takes a turn.
      </p>
      {mine.map((o) => (
        <article className="offer-card" key={o.id}>
          <h3>
            {o.from === me.id
              ? `Offer to ${s.players.find((p) => p.id === o.to)?.name}`
              : `Offer from ${s.players.find((p) => p.id === o.from)?.name}`}
          </h3>
          <div className="trade-columns">
            {(["give", "take"] as const).map((side) => (
              <div key={side}>
                <b>
                  {side === "give"
                    ? s.players.find((p) => p.id === o.from)?.name
                    : s.players.find((p) => p.id === o.to)?.name}{" "}
                  gives
                </b>
                <p>
                  {money(o[side].cash)}
                  {o[side].tiles.length
                    ? " + " +
                      o[side].tiles.map((id) => s.board[id].name).join(", ")
                    : ""}
                </p>
              </div>
            ))}
          </div>
          {o.clauses.map((c, i) => (
            <p key={i}>{clauseText(c, s, o.from, o.to)}</p>
          ))}
          <small>
            Expires after round {o.expiresRound}. Cash and ownership are checked
            again on acceptance.
          </small>
          <div className="market-actions">
            {o.to === me.id ? (
              <>
                <button
                  className="primary"
                  disabled={!enabled}
                  onClick={() => command("ACCEPT_TRADE", { id: o.id })}
                >
                  Accept offer
                </button>
                <button disabled={!enabled} onClick={() => counter(o)}>
                  Counteroffer
                </button>
                <button
                  disabled={!enabled}
                  onClick={() => command("REJECT_TRADE", { id: o.id })}
                >
                  Decline offer
                </button>
              </>
            ) : (
              <button
                disabled={!enabled}
                onClick={() => command("CANCEL_TRADE", { id: o.id })}
              >
                Withdraw offer
              </button>
            )}
          </div>
        </article>
      ))}
      {!sending ? (
        <button
          className="primary"
          disabled={!enabled || !others.length}
          onClick={() => {
            setSending(true);
            setSent(false);
            setDraft(blank(others[0]?.id ?? ""));
          }}
        >
          Make a trade offer
        </button>
      ) : (
        <form
          className="trade-composer"
          onSubmit={(e) => {
            e.preventDefault();
            command("OFFER_TRADE", { offer: draft }, (ok) => {
              if (ok) {
                setSending(false);
                setSent(true);
              }
            });
          }}
        >
          <h3>
            {draft.counter
              ? "Counteroffer · replaces the previous offer"
              : "New trade offer"}
          </h3>
          <label>
            Trade with
            <select
              aria-label="Trade with"
              value={draft.to}
              disabled={!!draft.counter}
              onChange={(e) => setDraft(blank(e.target.value))}
            >
              {others.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.bot ? " · bot" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="trade-columns">
            {(["give", "take"] as const).map((side) => {
              const owner = side === "give" ? me : target;
              return (
                <fieldset key={side}>
                  <legend>
                    {side === "give"
                      ? "You give"
                      : `${target?.name ?? "They"} gives`}
                  </legend>
                  <label>
                    {side === "give" ? "Your cash offer" : "Their cash offer"}
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={draft[side].cash}
                      onChange={(e) => update(side, Number(e.target.value))}
                    />
                  </label>
                  <div className="market-properties">
                    {s.board
                      .filter((t) => t.owner === owner?.id)
                      .map((t) => (
                        <label className="property-check" key={t.id}>
                          <input
                            type="checkbox"
                            disabled={!!lockedReason(s, t.id)}
                            checked={draft[side].tiles.includes(t.id)}
                            onChange={() => toggle(side, t.id)}
                          />
                          <span>
                            {t.name}
                            <small>
                              {lockedReason(s, t.id) ||
                                `Level ${t.level} · ${money(t.price)}`}
                            </small>
                          </span>
                        </label>
                      ))}
                  </div>
                </fieldset>
              );
            })}
          </div>
          {draft.clauses.map((c, i) => (
            <div className="contract-preview" key={i}>
              <span>{clauseText(c, s, me.id, draft.to)}</span>
              <button
                type="button"
                aria-label={`Remove contract ${i + 1}`}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    clauses: d.clauses.filter((_, n) => n !== i),
                  }))
                }
              >
                Remove
              </button>
            </div>
          ))}
          {draft.clauses.length < 3 && (
            <ClauseEditor
              s={s}
              onAdd={(c) =>
                setDraft((d) => ({ ...d, clauses: [...d.clauses, c] }))
              }
            />
          )}
          <div className="market-actions">
            <button className="primary" disabled={!enabled || !target}>
              Send offer
            </button>
            <button type="button" onClick={() => setSending(false)}>
              Cancel draft
            </button>
          </div>
        </form>
      )}
      {sent && (
        <p role="status">Offer sent. You can keep playing while they decide.</p>
      )}
      {!mine.length && !sending && (
        <p>
          No open offers. Bots weigh prices, cash and district control before
          responding.
        </p>
      )}
    </>
  );
}
