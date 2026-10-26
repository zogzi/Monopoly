import type { State, Player } from "../../../../packages/shared/index";
import { character } from "../../../../packages/shared/index";
import { empire } from "../../../../packages/game-core/index";
import Portrait from "./Portrait";
import { money } from "./TurnPanel";
export default function PlayerProfile({
  player,
  s,
  onClose,
  onProperty,
}: {
  player: Player;
  s: State;
  onClose: () => void;
  onProperty: (id: number) => void;
}) {
  const c = character(player.token);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal player-profile"
        role="dialog"
        aria-modal="true"
        aria-label={`${player.name} portfolio`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close" autoFocus onClick={onClose}>
          ×
        </button>
        <div className="profile-hero">
          <Portrait id={c.id} />
          <div>
            <span className="eyebrow">
              {player.bot ? "COMPUTER OPPONENT" : "AT THE TABLE"}
            </span>
            <h2>{player.name}</h2>
            <b>{c.name}</b>
            <p>{c.title}</p>
          </div>
        </div>
        <div className="stat">
          <span>Available cash</span>
          <b>{money(player.cash)}</b>
        </div>
        <div className="stat">
          <span>Empire value</span>
          <b>{money(empire(s, player))}</b>
        </div>
        <h3>Property portfolio</h3>
        {s.board
          .filter((t) => t.owner === player.id)
          .map((t) => (
            <button
              key={t.id}
              className="asset"
              onClick={() => {
                onProperty(t.id);
                onClose();
              }}
            >
              <span>
                {t.name}
                <small>Level {t.level}</small>
              </span>
              <b>Inspect →</b>
            </button>
          ))}
        {!s.board.some((t) => t.owner === player.id) && (
          <p>No acquisitions yet. Every empire starts somewhere.</p>
        )}
      </section>
    </div>
  );
}
