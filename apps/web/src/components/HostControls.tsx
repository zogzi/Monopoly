import type { State } from "../../../../packages/shared/index";
import { command } from "../store";
export default function HostControls({ s, host }: { s: State; host: boolean }) {
  if (!host || s.phase === "LOBBY") return null;
  return (
    <div className="host-controls">
      {s.phase !== "GAME_OVER" && (
        <button onClick={() => command(s.paused ? "RESUME" : "PAUSE")}>
          {s.paused ? "Resume" : "Pause"}
        </button>
      )}
      <button
        disabled={
          ![
            "PLANNING",
            "ROLL",
            "ROUTE_CHOICE",
            "PURCHASE_DECISION",
            "TURN_END",
          ].includes(s.phase)
        }
        onClick={() => command("SKIP")}
      >
        {s.phase === "PLANNING" ? "Start turns" : "Skip turn"}
      </button>
      <button
        onClick={() => {
          if (window.confirm("End this game and return everyone to the lobby?"))
            command("RESTART");
        }}
      >
        New game
      </button>
    </div>
  );
}
