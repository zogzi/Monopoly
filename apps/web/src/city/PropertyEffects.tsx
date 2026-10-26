import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { State } from "../../../../packages/shared/index";
import { lotPosition } from "./geometry";
import Instances, { type Block } from "./Instances";
type Change = {
  tile: number;
  level: number;
  building: boolean;
  owner: string | null;
};
function Effect({
  s,
  change,
  reduced,
}: {
  s: State;
  change: Change;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null),
    elapsed = useRef(0);
  const t = s.board[change.tile],
    at = lotPosition(t),
    height = 1.7 + change.level * 0.55;
  const scaffold: Block[] = [];
  if (change.building)
    for (const x of [-0.9, 0.9])
      for (const z of [-0.7, 0.7])
        scaffold.push({
          at: [x, height / 2, z],
          size: [0.04, height, 0.04],
          color: "#ffcc83",
        });
  useFrame((_, dt) => {
    elapsed.current += dt;
    if (group.current && !reduced) {
      group.current.scale.y = Math.min(1, 0.3 + elapsed.current * 1.5);
      group.current.position.y = 0.32 + Math.sin(elapsed.current * 3) * 0.05;
    }
  });
  return (
    <group
      ref={group}
      position={[at[0], 0.32, at[1]]}
      name="property-transition"
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.95, 1.1, 32]} />
        <meshBasicMaterial
          color={change.building ? "#ffd28b" : "#d7b3ff"}
          side={THREE.DoubleSide}
        />
      </mesh>
      {change.building && <Instances items={scaffold} unlit />}
      <Html center position={[0, height + 0.6, 0]} zIndexRange={[1, 0]}>
        <span className="token-label">
          {change.building
            ? `Built level ${change.level}`
            : `Acquired by ${s.players.find((p) => p.id === change.owner)?.name}`}
        </span>
      </Html>
    </group>
  );
}
export default function PropertyEffects({
  s,
  reduced,
}: {
  s: State;
  reduced: boolean;
}) {
  const before = useRef(s.board),
    [changes, setChanges] = useState<Change[]>([]);
  useEffect(() => {
    const previous = before.current;
    before.current = s.board;
    if (s.phase === "LOBBY" || s.simulation.speed === "FAST") {
      setChanges([]);
      return;
    }
    const changed = s.board
      .filter(
        (t, i) =>
          t.level > previous[i].level ||
          (t.owner && t.owner !== previous[i].owner),
      )
      .map((t) => ({
        tile: t.id,
        level: t.level,
        building: t.level > previous[t.id].level,
        owner: t.owner,
      }));
    if (!changed.length) {
      setChanges([]);
      return;
    }
    setChanges(changed.slice(0, 8));
    const timer = setTimeout(() => setChanges([]), 2400);
    return () => clearTimeout(timer);
  }, [s.board]);
  return (
    <>
      {changes.map((change) => (
        <Effect
          key={`${change.tile}-${change.level}-${change.owner}`}
          s={s}
          change={change}
          reduced={reduced}
        />
      ))}
    </>
  );
}
