import { useAudioSettings, setAudioEnabled } from "../audio";
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
import { modes, type Mode } from "../../../../packages/shared/economy";
import { debt, receivables } from "../../../../packages/game-core/finance";
export default function Overview({
  s,
  me,
  connected,
  onPortfolio,
}: {
  s: State;
  me?: Player;
  connected: boolean;
  onPortfolio: () => void;
}) {
  const [name, setName] = useState(""),
    [figure, setFigure] = useState<Token>("moxie"),
    [joinPreference, setJoinPreference] = useState<boolean | null>(null);
  const savedAudio = useAudioSettings((state) => state.saved),
    audioEnabled = useAudioSettings((state) => state.settings.enabled),
    joinSound = joinPreference ?? (savedAudio ? audioEnabled : true);
  const host = s.host === me?.id;

  if (!me)
    return (
      <>
        <h2>Take your seat.</h2>
        <p>
          Choose your character and join your friends, or practice with bots.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAudioEnabled(joinSound);
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
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={joinSound}
              onChange={(e) => setJoinPreference(e.target.checked)}
            />
            <span>Sound on when I join</span>
          </label>
          <button className="primary" disabled={!connected || !name.trim()}>
            Join game
          </button>
        </form>
        <div className="hint">
          A private table for friends, with bots whenever you want to practice.
          Use Discord to talk.
        </div>
      </>
    );
  if (s.phase === "LOBBY")
    return (
      <>
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
            players
            <br />
            <small>4 needed to start</small>
          </span>
        </div>
        <button
          className={me.ready ? "secondary" : "primary"}
          onClick={() => command("READY")}
        >
          {me.ready ? "Ready (click to undo)" : "I’m ready"}
        </button>
        <label>
          Game mode
          <select
            aria-label="Game mode"
            value={s.mode}
            disabled={!host}
            onChange={(e) =>
              command("SET_MODE", { mode: e.target.value as Mode })
            }
          >
            {Object.entries(modes).map(([id, mode]) => (
              <option key={id} value={id}>
                {mode.name}
              </option>
            ))}
          </select>
        </label>
        <p>{modes[s.mode].detail}</p>
        {host && (
          <button
            className="primary"
            disabled={
              s.players.length < 4 ||
              s.players.some((p) => !p.ready || !p.connected)
            }
            onClick={() => command("START")}
          >
            Start game
          </button>
        )}
        <SimulationControls s={s} host={host} />
        <div className="hint">
          {host ? "You’re the host." : "Waiting for the host to start."}{" "}
          {modes[s.mode].name} · {money(modes[s.mode].cash)} starting cash.
        </div>
      </>
    );
  if (s.phase === "GAME_OVER") {
    const winner = s.players.find((p) => p.id === s.winner);
    return (
      <>
        <h2>
          {winner ? `${winner.name} wins.` : "The city outlasted every empire."}
        </h2>
        <p>
          Final net empire value: cash + property prices + development +
          receivables − debt. Ties follow turn order.
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
              <small className="score-breakdown">
                {money(p.cash)} cash · {money(debt(s, p.id))} debt ·{" "}
                {money(receivables(s, p.id))} receivables
                <br />
                {s.stats[p.id]?.trades ?? 0} trades ·{" "}
                {s.stats[p.id]?.auctions ?? 0} auctions won ·{" "}
                {money(s.stats[p.id]?.rent ?? 0)} rent earned
              </small>
            </div>
          ))}
        {host && (
          <button className="primary" onClick={() => command("RESTART")}>
            Play again
          </button>
        )}
      </>
    );
  }
  return <TurnPanel s={s} me={me} onPortfolio={onPortfolio} />;
}
