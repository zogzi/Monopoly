import type { State, Player } from "../../../../packages/shared/index";
import { character } from "../../../../packages/shared/index";
import { empire } from "../../../../packages/game-core/index";
import Modal from "./Modal";
import Portrait from "./Portrait";
import { money } from "./TurnPanel";
import { credit, debt } from "../../../../packages/game-core/finance";
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
    <Modal title={player.name} onClose={onClose} className="player-profile">
      <div className="profile-hero">
        <Portrait id={c.id} />
        <div>
          <b>{c.name}</b>
          <p>{c.title}</p>
        </div>
      </div>
      <div className="stat">
        <span>Cash</span>
        <b>{money(player.cash)}</b>
      </div>
      <div className="stat">
        <span>Empire value</span>
        <b>{money(empire(s, player))}</b>
      </div>
      <h3>Properties</h3>
      <div className="stat">
        <span>Debt / credit rating</span>
        <b>
          {money(debt(s, player.id))} / {credit(s, player).grade}
        </b>
      </div>
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
            <b>View</b>
          </button>
        ))}
      {!s.board.some((t) => t.owner === player.id) && <p>No properties yet.</p>}
    </Modal>
  );
}
