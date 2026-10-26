import { useMemo, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { State } from "../../../../packages/shared/index";
import Instances, { type Block } from "./Instances";
import CharacterModel from "./CharacterModel";
import WindowGlow from "./WindowGlow";
import { prisonArchitecture } from "./prisonArchitecture";
import {
  PRISON_CENTER,
  PRISON_APPROACH,
  ESCORT_DURATION_MS,
  prisonSlot,
} from "./prisonLayout";
export function custodyPosition(s: State, id: string): [number, number] {
  const index = Math.max(
    0,
    s.players
      .filter((p) => p.detention && !p.eliminated)
      .findIndex((p) => p.id === id),
  );
  return prisonSlot(index);
}
export function escortRoute(board: State["board"], from: number) {
  const queue: { node: number; path: number[] }[] = [
      { node: from, path: [from] },
    ],
    seen = new Set<number>();
  let path = [from];
  while (queue.length) {
    const current = queue.shift()!;
    if (current.node === 10) {
      path = current.path;
      break;
    }
    if (seen.has(current.node)) continue;
    seen.add(current.node);
    for (const next of board[current.node].next)
      queue.push({ node: next, path: [...current.path, next] });
  }
  return [
    ...path.map((id) => new THREE.Vector3(board[id].x, 0.4, board[id].z)),
    ...PRISON_APPROACH.map((point) => new THREE.Vector3(...point)),
  ];
}
function PoliceEscort({
  s,
  reduced,
  onArrived,
}: {
  s: State;
  reduced: boolean;
  onArrived: () => void;
}) {
  const [arrived, setArrived] = useState(false);
  const car = useRef<THREE.Group>(null),
    start = useRef<number | null>(null);
  const player = s.players.find((p) => p.id === s.lastEscort?.playerId);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        escortRoute(s.board, s.lastEscort!.from),
        false,
        "centripetal",
      ),
    [s.lastEscort?.id],
  );
  const target = useMemo(() => new THREE.Vector3(), []);
  const parts = useMemo<Block[]>(
    () => [
      { at: [0, 0, 0], size: [0.75, 0.3, 1.25], color: "#d1d1df" },
      { at: [0, 0.24, 0], size: [0.6, 0.26, 0.55], color: "#343d65" },
      { at: [0, -0.12, 0.42], size: [0.86, 0.18, 0.14], color: "#25283f" },
      { at: [0, -0.12, -0.42], size: [0.86, 0.18, 0.14], color: "#25283f" },
    ],
    [],
  );
  const lights = useMemo<Block[]>(
    () => [
      { at: [-0.16, 0.43, 0], size: [0.28, 0.08, 0.15], color: "#ef8398" },
      { at: [0.16, 0.43, 0], size: [0.28, 0.08, 0.15], color: "#8aaeff" },
    ],
    [],
  );
  useFrame(() => {
    if (!car.current) return;
    start.current ??= performance.now();
    const t = reduced
      ? 1
      : Math.max(
          0,
          Math.min(1, (performance.now() - start.current) / ESCORT_DURATION_MS),
        );
    curve.getPoint(t, car.current.position);
    curve.getPoint(Math.min(1, t + 0.01), target);
    if (t < 1) car.current.lookAt(target);
    car.current.visible = t < 1;
    if (t >= 1 && !arrived) {
      setArrived(true);
      onArrived();
    }
  });
  if (!player?.detention) return null;
  return (
    <group ref={car} name="police-escort">
      <Instances items={parts} />
      <Instances items={lights} unlit />
      <group position={[0, 0.17, 0]} scale={0.55}>
        <CharacterModel id={player.token} />
      </group>
      {!arrived && (
        <Html center position={[0, 1.5, 0]} zIndexRange={[1, 0]}>
          <span className="token-label">Police escort: {player.name}</span>
        </Html>
      )}
    </group>
  );
}
function PrisonGate({ s, reduced }: { s: State; reduced: boolean }) {
  const left = useRef<THREE.Group>(null),
    right = useRef<THREE.Group>(null),
    began = useRef<number | null>(null);
  useEffect(() => {
    began.current = null;
  }, [s.lastEscort?.id]);
  const leaf = useMemo(
    () =>
      [1, -1].map((side) => {
        const parts: Block[] = [];
        for (let i = 0; i < 5; i++)
          parts.push({
            at: [side * (0.09 + i * 0.18), 1.25, 0],
            size: [0.03, 1.65, 0.045],
            color: "#60516a",
          });
        for (const y of [0.45, 1.25, 2.05])
          parts.push({
            at: [side * 0.43, y, 0],
            size: [0.86, 0.045, 0.05],
            color: "#8e7b8e",
          });
        parts.push({
          at: [side * 0.72, 1.25, 0.04],
          size: [0.1, 0.12, 0.04],
          color: "#c9a87c",
        });
        return parts;
      }),
    [],
  );
  useFrame((_, dt) => {
    if (s.lastEscort) began.current ??= performance.now();
    const age =
      began.current === null
        ? Infinity
        : (performance.now() - began.current) / ESCORT_DURATION_MS;
    const open = !reduced && age > 0.55 && age < 1.2;
    if (left.current)
      left.current.rotation.y = THREE.MathUtils.damp(
        left.current.rotation.y,
        open ? -Math.PI * 0.46 : 0,
        8,
        Math.min(dt, 0.05),
      );
    if (right.current)
      right.current.rotation.y = THREE.MathUtils.damp(
        right.current.rotation.y,
        open ? Math.PI * 0.46 : 0,
        8,
        Math.min(dt, 0.05),
      );
  });
  return (
    <group
      name="prison-escort-gate"
      position={[PRISON_CENTER[0], 0, PRISON_CENTER[1] + 2.8]}
    >
      <group ref={left} position={[-0.88, 0, 0]}>
        <Instances items={leaf[0]} />
      </group>
      <group ref={right} position={[0.88, 0, 0]}>
        <Instances items={leaf[1]} />
      </group>
    </group>
  );
}
export default function Prison({
  s,
  reduced,
  quality,
  onEscortArrived,
}: {
  s: State;
  reduced: boolean;
  quality: string;
  onEscortArrived: () => void;
}) {
  const model = useMemo(() => prisonArchitecture(), []);
  return (
    <>
      <Instances items={model.boxes} />
      <Instances items={model.gables} shape="gable" />
      <Instances items={model.spires} shape="cone" />
      <Instances items={model.rounds} shape="sphere" />
      <Instances items={model.lights} unlit />
      {quality !== "LOW" && <WindowGlow items={model.glows} />}
      <PrisonGate s={s} reduced={reduced || s.simulation.speed === "FAST"} />
      <Html
        center
        position={[PRISON_CENTER[0], 4.9, PRISON_CENTER[1] - 2.2]}
        zIndexRange={[1, 0]}
      >
        <span className="map-label">Ravenwatch Prison</span>
      </Html>
      {s.lastEscort && (
        <PoliceEscort
          key={s.lastEscort.id}
          onArrived={onEscortArrived}
          s={s}
          reduced={reduced || s.simulation.speed === "FAST"}
        />
      )}
    </>
  );
}
