import type { State } from "../../../../packages/shared/index";
import { command } from "../store";
export default function SimulationControls({
  s,
  host,
}: {
  s: State;
  host: boolean;
}) {
  if (!host) return null;
  return (
    <section
      className="simulation-controls"
      aria-label="Bot and simulation controls"
    >
      <h3>Bots and practice</h3>
      {s.phase === "LOBBY" && (
        <>
          <p>Play solo against bots, or fill empty seats for your friends.</p>
          <div className="button-row">
            <button
              onClick={() => command("ADD_BOT")}
              disabled={s.players.length >= 15}
            >
              Add a bot
            </button>
          </div>
          <div className="bot-list">
            {s.players
              .filter((p) => p.bot)
              .map((p) => (
                <div key={p.id}>
                  <span>Bot: {p.name}</span>
                  <button
                    aria-label={`Remove ${p.name}`}
                    onClick={() => command("REMOVE_BOT", { id: p.id })}
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
      <label className="toggle-label">
        <input
          type="checkbox"
          checked={s.simulation.autoplay}
          onChange={(e) =>
            command("SIMULATION", {
              ...s.simulation,
              autoplay: e.target.checked,
            })
          }
        />
        <span>
          Play my turns automatically
          <small>Turn this off to take control.</small>
        </span>
      </label>
      <label>
        Bot speed
        <select
          aria-label="Bot speed"
          value={s.simulation.speed}
          onChange={(e) =>
            command("SIMULATION", { ...s.simulation, speed: e.target.value })
          }
        >
          <option value="NORMAL">Normal</option>
          <option value="FAST">Fast</option>
        </select>
      </label>
    </section>
  );
}
