import { useState } from "react";
import type { Player, State } from "../../../../packages/shared/index";
import { districts } from "../../../../packages/shared/index";
import { estimated } from "../../../../packages/game-core/properties";
import { command } from "../store";
import { useCountdown } from "./useCountdown";
import Portrait from "./Portrait";
import { money } from "./TurnPanel";
export default function AuctionPanel({ s, me }: { s: State; me: Player }) {
  const [amount, setAmount] = useState(10),
    remaining = useCountdown(s.deadline),
    a = s.auction;
  if (!a) return null;
  const tile = s.board[a.tile],
    leader = s.players.find((p) => p.id === a.bidder),
    bid = Math.max(amount, a.bid + 10);
  const passed = a.passed.includes(me.id),
    leading = a.bidder === me.id,
    seller = a.seller === me.id;
  const canAct = !s.paused && !me.eliminated && !passed && !leading && !seller;
  return (
    <section className="auction-panel" aria-label="Live property auction">
      <span className="auction-kicker">Everyone can bid</span>
      <h2>Property auction</h2>
      <h3>{tile.name}</h3>
      <p>
        {districts[tile.district].name} ·{" "}
        {a.seller ? "Emergency sale" : "Declined property"}
      </p>
      <div className="auction-clock">
        {s.paused
          ? "Paused"
          : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
        <small>
          Closes when every rival passes this price, or time runs out.
        </small>
      </div>
      <div className="auction-leading" key={`${a.id}-${a.bid}`}>
        {leader && <Portrait id={leader.token} />}
        <div>
          <small>{leader ? `${leader.name} leads` : "Opening bid"}</small>
          <strong>{money(a.bid || 10)}</strong>
        </div>
      </div>
      <p>
        Estimated value {money(estimated(tile) * 0.9)}–
        {money(estimated(tile) * 1.1)}. Your cash: {money(me.cash)}.
      </p>
      {leading ? (
        <p className="market-notice">
          You hold the highest bid. Your bid is binding.
        </p>
      ) : passed ? (
        <p>You passed at this price. A higher bid lets you respond again.</p>
      ) : seller ? (
        <p>Other players are bidding on your property.</p>
      ) : (
        <>
          <label>
            Your bid
            <input
              type="number"
              min={a.bid + 10}
              max={Math.max(10, me.cash)}
              step={10}
              value={bid}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </label>
          <button
            className="primary"
            disabled={!canAct || bid > me.cash}
            onClick={() => command("BID", { amount: bid })}
          >
            Bid {money(bid)}
          </button>
          <button
            className="secondary"
            disabled={!canAct}
            onClick={() => command("PASS_AUCTION")}
          >
            Pass this auction
          </button>
        </>
      )}
      <div className="auction-responses" aria-label="Auction responses">
        <strong>Waiting for responses</strong>
        {s.players
          .filter(
            (p) => !p.eliminated && p.id !== a.seller && p.id !== a.bidder,
          )
          .map((p) => (
            <span key={p.id}>
              {p.name}: {a.passed.includes(p.id) ? "Passed" : "Can bid or pass"}
            </span>
          ))}
      </div>
      <p>
        Minimum increase $10. A late bid leaves at least one minute to respond.
        Each higher bid reopens responses. The leading bidder cannot end the
        auction.
      </p>
    </section>
  );
}
