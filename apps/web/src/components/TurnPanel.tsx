import type { State, Player } from "../../../../packages/shared/index";
import { command } from "../store";
export const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
export default function TurnPanel({
  s,
  me,
  remaining,
  onPortfolio,
}: {
  s: State;
  me: Player;
  remaining: number;
  onPortfolio: () => void;
}) {
  const current = s.players[s.current],
    mine = current?.id === me.id,
    tile = s.board[me.position];
  return (
    <>
      <span className="eyebrow">
        {s.phase === "PLANNING"
          ? "MAKE YOUR NEXT MOVE"
          : mine
            ? "YOUR TURN"
            : "ON THE CIRCUIT"}
      </span>
      <h2>
        {s.paused
          ? "City on pause."
          : s.phase === "PLANNING"
            ? "Plan. Build. Grow."
            : mine
              ? "Make it count."
              : `${current?.name} is moving.`}
      </h2>
      <p>
        {s.phase === "PLANNING"
          ? "Everyone plans together. Inspect your portfolio and develop the districts you control."
          : mine
            ? `You’re at ${tile.name}.`
            : "Explore the city, talk to your rivals, and prepare for your turn."}
      </p>
      <div className="turn-card">
        <span style={{ color: current?.color }}>◆</span>
        <div>
          <small>
            {s.phase === "PLANNING" ? "PLANNING CLOSES IN" : "CURRENT TURN"}
          </small>
          <strong>
            {s.phase === "PLANNING" ? "All tycoons" : current?.name}
          </strong>
        </div>
        <b>{s.paused ? "Ⅱ" : remaining + "s"}</b>
      </div>
      {mine && s.phase === "ROLL" && (
        <button className="primary roll" onClick={() => command("ROLL")}>
          ⚄ &nbsp; Roll the dice <span>↗</span>
        </button>
      )}
      {mine && s.phase === "ROUTE_CHOICE" && (
        <>
          <h3>Choose your road</h3>
          {s.board[me.position].next.map((n) => (
            <button
              className="route"
              key={n}
              onClick={() => command("ROUTE", { tile: n })}
            >
              <span>{s.board[n].name}</span>
              <small>
                {n >= 40 ? "Inner-city shortcut" : "District road"} →
              </small>
            </button>
          ))}
        </>
      )}
      {mine && s.phase === "PURCHASE_DECISION" && (
        <>
          <h3>{tile.name}</h3>
          <div className="stat">
            <span>Purchase price</span>
            <b>{money(tile.price)}</b>
          </div>
          <div className="stat">
            <span>Base revenue</span>
            <b>{money(tile.base)}</b>
          </div>
          <button
            className="primary"
            disabled={me.cash < tile.price}
            onClick={() => command("BUY")}
          >
            Acquire property · {money(tile.price)}
          </button>
          <button className="secondary" onClick={() => command("DECLINE")}>
            Pass on this property
          </button>
        </>
      )}
      {mine && s.phase === "TURN_END" && (
        <button className="primary" onClick={() => command("END")}>
          End turn →
        </button>
      )}
      {mine && s.phase === "FINANCIAL_CRISIS" && (
        <>
          <div className="crisis">
            Financial crisis · {money(me.cash)}
            <p>
              You have {remaining}s to sell development and cover the shortfall.
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
          <span>{["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][s.dice[0]]}</span>
          <span>{["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][s.dice[1]]}</span>
          <small>SERVER ROLL · {s.dice[0] + s.dice[1]}</small>
        </div>
      )}
      <h3>Up next</h3>
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
