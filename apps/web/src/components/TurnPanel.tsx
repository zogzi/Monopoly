import type { State, Player } from "../../../../packages/shared/index";
import { purchaseCost } from "../../../../packages/game-core/properties";
import SurprisePanel from "./SurprisePanel";
import Portrait from "./Portrait";
import { useCountdown } from "./useCountdown";
import { command } from "../store";
import AuctionPanel from "./AuctionPanel";
export const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
export default function TurnPanel({
  s,
  me,
  onPortfolio,
}: {
  s: State;
  me: Player;
  onPortfolio: () => void;
}) {
  const remaining = useCountdown(s.deadline);
  const time = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  const current = s.players[s.current],
    mine = current?.id === me.id,
    tile = s.board[me.position];
  if (s.phase === "AUCTION")
    return <AuctionPanel key={s.auction?.id} s={s} me={me} />;
  return (
    <>
      <h2>
        {s.paused
          ? "Game paused"
          : s.phase === "PLANNING"
            ? "Planning"
            : mine
              ? "Your turn"
              : `${current?.name}’s turn`}
      </h2>
      <p>
        {s.phase === "PLANNING"
          ? s.board.some((t) => t.owner === me.id)
            ? "Build, play cards or trade, then finish planning when you’re done."
            : "You don’t own any properties yet. Play cards, make a trade, or finish planning while others prepare."
          : mine
            ? `You’re at ${tile.name}.`
            : "You can inspect properties while you wait."}
      </p>
      <div className="turn-card">
        {s.phase !== "PLANNING" && current && (
          <span className="turn-portrait">
            <Portrait id={current.token} />
          </span>
        )}
        <div>
          <small>
            {s.phase === "PLANNING" ? "Planning time" : "Current player"}
          </small>
          <strong>{s.phase === "PLANNING" ? "Everyone" : current?.name}</strong>
        </div>
        <b>{s.paused ? "Paused" : time}</b>
      </div>
      {s.phase === "PLANNING" && (
        <>
          <button
            className="primary"
            onClick={() =>
              command(
                s.planningReady.includes(me.id)
                  ? "RESUME_PLANNING"
                  : "FINISH_PLANNING",
              )
            }
          >
            {s.planningReady.includes(me.id)
              ? "Back to planning"
              : "Finish planning"}
          </button>
          <p>
            {s.planningReady.length} of{" "}
            {s.players.filter((p) => !p.eliminated).length} players finished.
            Turns start when everyone is done.
          </p>
        </>
      )}
      {mine && s.phase === "ROLL" && (
        <button className="primary roll" onClick={() => command("ROLL")}>
          Roll dice
        </button>
      )}
      {mine && s.phase === "ROUTE_CHOICE" && (
        <>
          <h3>Choose a route</h3>
          {s.board[me.position].next.map((n) => (
            <button
              className="route"
              key={n}
              onClick={() => command("ROUTE", { tile: n })}
            >
              <span>{s.board[n].name}</span>
              <small>{n >= 40 ? "Shortcut" : "Outer road"}</small>
            </button>
          ))}
        </>
      )}
      {mine && s.phase === "PURCHASE_DECISION" && (
        <>
          <h3>{tile.name}</h3>
          <div className="stat">
            <span>Purchase price</span>
            <b>{money(purchaseCost(s, tile, me))}</b>
          </div>
          <div className="stat">
            <span>Base revenue</span>
            <b>{money(tile.base)}</b>
          </div>
          <button
            className="primary"
            disabled={me.cash < purchaseCost(s, tile, me)}
            onClick={() => command("BUY")}
          >
            Buy for {money(purchaseCost(s, tile, me))}
          </button>
          <button className="secondary" onClick={() => command("DECLINE")}>
            Skip purchase
          </button>
        </>
      )}
      {mine && s.phase === "DETENTION" && me.detention && (
        <section className="surprise-card">
          <h3>You are in custody</h3>
          <p>
            Serve {me.detention.turns} more turn(s), pay bail, or use an Alibi
            card. Your properties still earn rent.
          </p>
          <button
            className="primary"
            disabled={me.cash < me.detention.bail}
            onClick={() => command("PAY_BAIL")}
          >
            Pay ${me.detention.bail} bail and roll
          </button>
          <button className="secondary" onClick={() => command("SERVE_TIME")}>
            Serve one turn
          </button>
        </section>
      )}
      <SurprisePanel s={s} me={me} />
      {mine && s.phase === "TURN_END" && (
        <button className="primary" onClick={() => command("END")}>
          End turn
        </button>
      )}
      {mine && s.phase === "FINANCIAL_CRISIS" && (
        <>
          <div className="crisis">
            Cash shortfall: {money(me.cash)}
            <p>
              You have {time} to sell development, borrow, accept a trade or
              auction an undeveloped property. Open Trade & bank for financing.
              Unresolved crises end in bankruptcy.
            </p>
          </div>
          <button className="secondary" onClick={onPortfolio}>
            Sell development
          </button>
          <button className="danger" onClick={() => command("BANKRUPT")}>
            Declare bankruptcy
          </button>
        </>
      )}
      {s.dice.length === 2 && (
        <div className="dice-result">
          <span>{s.dice[0]}</span>
          <span>{s.dice[1]}</span>
          <small>Total: {s.dice[0] + s.dice[1]}</small>
        </div>
      )}
      <h3>Next players</h3>
      <div className="next-list">
        {s.players
          .slice(s.current + 1)
          .concat(s.players.slice(0, s.current))
          .filter((p) => !p.eliminated)
          .slice(0, 4)
          .map((p, i) => (
            <div key={p.id}>
              <small>0{i + 1}</small>
              <span style={{ color: p.color }}>◆</span>
              {p.name}
              <i className={p.connected ? "online" : "offline"} />
            </div>
          ))}
      </div>
    </>
  );
}
