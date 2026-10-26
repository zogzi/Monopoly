import { useState } from "react";
import type { State, Player } from "../../../../packages/shared/index";
import {
  services,
  cards,
  type ServiceId,
  type CardKind,
} from "../../../../packages/shared/content";
import { command } from "../store";
import Modal from "./Modal";
export default function CityService({
  service,
  s,
  me,
  onClose,
}: {
  service: ServiceId;
  s: State;
  me?: Player;
  onClose: () => void;
}) {
  const [card, setCard] = useState<CardKind>("shield"),
    info = services[service];
  const available =
    me &&
    !me.eliminated &&
    !s.paused &&
    s.phase === "PLANNING" &&
    !s.planningReady.includes(me.id) &&
    me.serviceRound !== s.round;
  return (
    <Modal title={info.name} onClose={onClose}>
      <p>{info.description}</p>
      <p>One city service per player, per round. Available during planning.</p>
      {service === "broker" && (
        <label>
          Choose a card
          <select
            value={card}
            onChange={(e) => setCard(e.target.value as CardKind)}
          >
            {(["shield", "builder", "express", "market", "alibi"] as const).map(
              (kind) => (
                <option value={kind} key={kind}>
                  {cards[kind].name}
                </option>
              ),
            )}
          </select>
        </label>
      )}
      <button
        className="primary"
        disabled={!available}
        onClick={() => {
          command("VISIT_SERVICE", { service, card });
          onClose();
        }}
      >
        Use this service
      </button>
      {!available && (
        <p>
          {me?.serviceRound === s.round
            ? "You have already used a service this round."
            : "Use this service during planning, before you click Finish planning."}
        </p>
      )}
    </Modal>
  );
}
