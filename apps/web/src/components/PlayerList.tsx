import type { State } from "../../../../packages/shared/index";
import Portrait from "./Portrait";
import { money } from "./TurnPanel";
export default function PlayerList({
  s,
  id,
  onSelect,
}: {
  s: State;
  id: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="players">
      {s.players.map((p) => (
        <button
          key={p.id}
          className={
            "player " +
            (p.id === id ? "you " : "") +
            (p.id === s.players[s.current]?.id &&
            !["LOBBY", "PLANNING", "GAME_OVER"].includes(s.phase)
              ? "current"
              : "")
          }
          onClick={() => onSelect(p.id)}
        >
          <span className="player-token">
            <Portrait id={p.token} />
          </span>
          <span className="player-copy">
            <b>
              {p.name}
              {p.id === id ? " (you)" : ""}
            </b>
            <small>
              {p.bot ? "Bot · " : ""}
              {p.eliminated
                ? "Bankrupt"
                : s.phase === "LOBBY"
                  ? p.ready
                    ? "Ready"
                    : "Not ready"
                  : money(p.cash)}
            </small>
          </span>
          {p.id === s.players[s.current]?.id &&
            !["LOBBY", "PLANNING", "GAME_OVER"].includes(s.phase) && (
              <span className="playing-badge">Playing</span>
            )}
          {p.detention && <span className="custody-badge">In custody</span>}
          <span
            className={p.connected ? "online" : "offline"}
            aria-label={p.connected ? "Connected" : "Disconnected"}
          />
        </button>
      ))}
      {!s.players.length && <p>No players yet.</p>}
    </div>
  );
}
