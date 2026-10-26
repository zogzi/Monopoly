import { useState } from "react";
import {
  characters,
  character,
  type Token,
  type State,
  type Player,
} from "../../../../packages/shared/index";
import { empire } from "../../../../packages/game-core/index";
import { join, command } from "../store";
import Portrait from "./Portrait";
import SimulationControls from "./SimulationControls";
import TurnPanel, { money } from "./TurnPanel";
export default function Overview({
  s,
  me,
  connected,
  remaining,
  onPortfolio,
}: {
  s: State;
  me?: Player;
  connected: boolean;
  remaining: number;
  onPortfolio: () => void;
}) {
  const [name, setName] = useState(""),
    [figure, setFigure] = useState<Token>("moxie");
  const host = s.host === me?.id;

  if (!me)
    return (
      <>
        <span className="eyebrow">YOUR EMPIRE STARTS HERE</span>
        <h2>Take your seat.</h2>
        <p>
          One city. Up to 15 rivals.
          <br />A thousand ways to build an empire.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            join(name, undefined, figure);
          }}
        >
          <label>
            Your name
            <input
              value={name}
              maxLength={20}
              placeholder="Enter your name"
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>Choose your character</label>
          <div className="token-picker">
            {characters.map((c) => (
              <button
                type="button"
                aria-label={c.name}
                aria-pressed={figure === c.id}
                key={c.id}
                className={figure === c.id ? "chosen" : ""}
                onClick={() => setFigure(c.id)}
              >
                <Portrait id={c.id} />
                <small>{c.name.split(" ")[0]}</small>
              </button>
            ))}
          </div>
          <div className="selected-character">
            <Portrait id={figure} />
            <div>
              <b>{character(figure).name}</b>
              <small>{character(figure).title}</small>
            </div>
          </div>
          <button className="primary" disabled={!connected || !name.trim()}>
            Enter Nova City <span>↗</span>
          </button>
        </form>
        <div className="hint">
          A private table for friends, with bots whenever you want to practice.
          Voice chat stays in Discord.
        </div>
      </>
    );
  if (s.phase === "LOBBY")
    return (
      <>
        <span className="eyebrow">THE CITY IS YOURS TO TAKE</span>
        <h2>Welcome, {me.name}.</h2>
        <p>
          Invite your friends, or add bots to practice solo. Four total seats
          are needed; bots are always ready.
        </p>
        <div className="lobby-count">
          <strong>
            {s.players.length}
            <small> / 15</small>
          </strong>
          <span>
            tycoons at the table
            <br />
            <small>4 minimum to begin</small>
          </span>
        </div>
        <button
          className={me.ready ? "secondary" : "primary"}
          onClick={() => command("READY")}
        >
          {me.ready ? "✓ Ready · click to unready" : "I’m ready →"}
        </button>
        {host && (
          <button
            className="primary"
            disabled={
              s.players.length < 4 ||
              s.players.some((p) => !p.ready || !p.connected)
            }
            onClick={() => command("START")}
          >
            Start the circuit
          </button>
        )}
        <SimulationControls s={s} host={host} />
        <div className="hint">
          {host ? "You’re the host." : "Waiting for the host to start."} Capital
          Race · 12 rounds · $1,800 starting cash.
        </div>
      </>
    );
  if (s.phase === "GAME_OVER") {
    const winner = s.players.find((p) => p.id === s.winner);
    return (
      <>
        <span className="eyebrow">AN EMPIRE, BUILT.</span>
        <h2>{winner?.name} wins.</h2>
        <p>
          Final empire value: cash + property prices + development investment.
          Ties follow turn order.
        </p>
        {[...s.players]
          .sort(
            (a, b) =>
              Number(a.eliminated) - Number(b.eliminated) ||
              empire(s, b) - empire(s, a),
          )
          .map((p, i) => (
            <div className="stat" key={p.id}>
              <span>
                {i + 1}. {p.name}
                {p.eliminated ? " · bankrupt" : ""}
              </span>
              <strong>{money(empire(s, p))}</strong>
            </div>
          ))}
        {host && (
          <button className="primary" onClick={() => command("RESTART")}>
            Rematch ↻
          </button>
        )}
      </>
    );
  }
  return (
    <TurnPanel s={s} me={me} remaining={remaining} onPortfolio={onPortfolio} />
  );
}
