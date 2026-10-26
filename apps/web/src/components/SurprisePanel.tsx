import type { State, Player } from "../../../../packages/shared/index";
import { encounters } from "../../../../packages/shared/content";
import { encounterError } from "../../../../packages/game-core/engagement";
import { command } from "../store";
export default function SurprisePanel({ s, me }: { s: State; me: Player }) {
  if (s.phase !== "ENCOUNTER" || s.encounter?.playerId !== me.id) return null;
  const encounter = encounters[s.encounter.index];
  return (
    <section className="surprise-card" aria-label="Surprise choice">
      <span className="card-type">City surprise</span>
      <h3>{encounter.title}</h3>
      {encounter.options.map((option, i) => {
        const error = encounterError(me, option);
        return (
          <button
            key={i}
            className="surprise-option"
            disabled={!!error}
            onClick={() => command("CHOOSE_ENCOUNTER", { choice: i })}
          >
            <b>{option.label}</b>
            <span>{option.detail}</span>
            {error && <small>{error}</small>}
          </button>
        );
      })}
      <button
        className="secondary"
        onClick={() => command("CHOOSE_ENCOUNTER", { choice: -1 })}
      >
        Skip and end turn
      </button>
    </section>
  );
}
