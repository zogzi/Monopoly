import { useEffect, useRef, useState } from "react";
import type { State } from "../../../../packages/shared/index";
import Modal from "./Modal";
export default function ArrestNotice({
  s,
  id,
  onPrison,
}: {
  s: State;
  id: string | null;
  onPrison: () => void;
}) {
  const seen = useRef<string | null>(null),
    [visible, setVisible] = useState(false);
  const me = s.players.find((p) => p.id === id);
  useEffect(() => {
    if (!me?.detention || s.phase === "LOBBY" || s.phase === "GAME_OVER") {
      setVisible(false);
      return;
    }
    const key = `${me.id}-${s.lastEscort?.playerId === me.id ? s.lastEscort.id : "restored"}`;
    if (seen.current === key) return;
    seen.current = key;
    if (s.simulation.autoplay && s.host === id) return;
    setVisible(true);
  }, [
    !!me?.detention,
    s.lastEscort?.id,
    me?.id,
    s.phase === "GAME_OVER",
    s.phase === "LOBBY",
  ]);
  if (!visible || !me?.detention) return null;
  return (
    <Modal
      title="You were arrested"
      className="arrest-notice"
      onClose={() => setVisible(false)}
    >
      <div className="arrest-emblem" aria-hidden="true">
        !
      </div>
      <p>
        Your illegal delivery was caught. Police are taking you to{" "}
        <strong>Ravenwatch Prison</strong>, outside the city.
      </p>
      <p>
        On your next turn, pay ${me.detention.bail} bail, play Alibi, or serve{" "}
        {me.detention.turns} turns. Your properties still collect rent.
      </p>
      <button
        className="primary"
        onClick={() => {
          setVisible(false);
          onPrison();
        }}
      >
        View prison
      </button>
      <button className="secondary" onClick={() => setVisible(false)}>
        Continue watching
      </button>
    </Modal>
  );
}
