import type { State, Player } from "../../../../packages/shared/index";
import { cards, cityEvents } from "../../../../packages/shared/content";
import { command } from "../store";
export default function Tactics({ s, me }: { s: State; me?: Player }) {
  const myTurn = s.players[s.current]?.id === me?.id;
  const playable =
    me &&
    !me.eliminated &&
    !s.paused &&
    ((s.phase === "PLANNING" && !s.planningReady.includes(me.id)) ||
      (myTurn &&
        [
          "ROLL",
          "PURCHASE_DECISION",
          "TURN_END",
          "FINANCIAL_CRISIS",
          "ENCOUNTER",
          "DETENTION",
        ].includes(s.phase)));
  return (
    <>
      {s.cityEvent && (
        <section className="city-event">
          <h3>{cityEvents[s.cityEvent].name}</h3>
          <p>{cityEvents[s.cityEvent].effect}</p>
          {s.nextCityEvent && (
            <p className="event-forecast">
              Next round: <b>{cityEvents[s.nextCityEvent].name}</b>
              <br />
              {cityEvents[s.nextCityEvent].effect}
            </p>
          )}
        </section>
      )}
      {me && s.phase !== "LOBBY" && (
        <section className="card-hand">
          <h3>Your cards ({me.cards.length}/4)</h3>
          {me.cards.length === 0 && (
            <p>Surprise choices can give you more cards.</p>
          )}
          {me.cards.map((card) =>
            card.kind === "hidden" ? null : (
              <div className="hand-card" key={card.id}>
                <button
                  disabled={
                    !playable ||
                    (card.kind === "alibi" && !me.detention) ||
                    (card.kind === "express" &&
                      !["PLANNING", "ROLL"].includes(s.phase)) ||
                    (card.kind === "shield" && me.shield >= 2) ||
                    (card.kind === "builder" && me.buildCredit >= 150) ||
                    (card.kind === "market" && me.purchaseCredit >= 140)
                  }
                  onClick={() => command("USE_CARD", { id: card.id })}
                >
                  <b>{cards[card.kind].name}</b>
                  <span>{cards[card.kind].description}</span>
                </button>
                <button
                  className="discard-card"
                  disabled={!playable}
                  onClick={() => command("DISCARD_CARD", { id: card.id })}
                >
                  Discard
                </button>
              </div>
            ),
          )}
          <p>Use cards during planning or your turn.</p>
          {(me.shield > 0 ||
            me.buildCredit > 0 ||
            me.purchaseCredit > 0 ||
            me.moveBonus > 0) && (
            <div className="active-bonuses">
              {me.shield > 0 && <span>{me.shield} rent shield(s)</span>}
              {me.buildCredit > 0 && (
                <span>${me.buildCredit} building credit</span>
              )}
              {me.purchaseCredit > 0 && (
                <span>${me.purchaseCredit} purchase coupon</span>
              )}
              {me.moveBonus > 0 && (
                <span>Next roll: +{me.moveBonus} spaces</span>
              )}
            </div>
          )}
        </section>
      )}
    </>
  );
}
