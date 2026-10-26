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
      <div className="section-kicker">
        PRACTICE LAB <span>AI OPPONENTS</span>
      </div>
      {s.phase === "LOBBY" && (
        <>
          <p>Play solo against bots, or fill empty seats for your friends.</p>
          <div className="button-row">
            <button
              onClick={() => command("ADD_BOT")}
              disabled={s.players.length >= 15}
            >
              + Add bot
            </button>
          </div>
          <div className="bot-list">
            {s.players
              .filter((p) => p.bot)
              .map((p) => (
                <div key={p.id}>
                  <span>CPU · {p.name}</span>
                  <button
                    aria-label={`Remove ${p.name}`}
                    onClick={() => command("REMOVE_BOT", { id: p.id })}
                  >
                    ×
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
          Autoplay my seat<small>Watch the entire match play itself.</small>
        </span>
      </label>
      <label>
        Bot pace
        <select
          aria-label="Bot pace"
          value={s.simulation.speed}
          onChange={(e) =>
            command("SIMULATION", { ...s.simulation, speed: e.target.value })
          }
        >
          <option value="NORMAL">Watch · normal pace</option>
          <option value="FAST">Simulate · fast pace</option>
        </select>
      </label>
    </section>
  );
}
