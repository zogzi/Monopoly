import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { State } from "../../../../packages/shared/index";
import Instances, { type Block } from "./Instances";
import CharacterModel from "./CharacterModel";
export function custodyPosition(s: State, id: string): [number, number] {
  const index = Math.max(
    0,
    s.players
      .filter((p) => p.detention && !p.eliminated)
      .findIndex((p) => p.id === id),
  );
  return [18.4 + (index % 5) * 0.72, -4.2 + Math.floor(index / 5) * 0.85];
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
    new THREE.Vector3(16.4, 0.4, -1),
    new THREE.Vector3(18.4, 0.4, -2),
    new THREE.Vector3(20, 0.4, -2.5),
  ];
}
function PoliceEscort({ s, reduced }: { s: State; reduced: boolean }) {
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
  useFrame(({ clock }) => {
    if (!car.current) return;
    start.current ??= clock.elapsedTime;
    const t = reduced
      ? 1
      : Math.min(1, (clock.elapsedTime - start.current) / 4);
    curve.getPoint(t, car.current.position);
    curve.getPoint(Math.min(1, t + 0.01), target);
    if (t < 1) car.current.lookAt(target);
    car.current.visible = t < 1;
  });
  if (!player?.detention) return null;
  return (
    <group ref={car} name="police-escort">
      <Instances items={parts} />
      <Instances items={lights} unlit />
      <group position={[0, 0.17, 0]} scale={0.55}>
        <CharacterModel id={player.token} />
      </group>
      <Html center position={[0, 1.5, 0]} zIndexRange={[1, 0]}>
        <span className="token-label">Police escort: {player.name}</span>
      </Html>
    </group>
  );
}
export default function Prison({ s, reduced }: { s: State; reduced: boolean }) {
  const blocks = useMemo<Block[]>(() => {
    const p: Block[] = [
      { at: [20, -0.1, -3], size: [6, 0.55, 5], color: "#6c6078" },
      { at: [17, 0.12, -1], size: [5, 0.16, 1.1], color: "#756780" },
      { at: [20, 1.15, -5.1], size: [5.6, 2.4, 0.35], color: "#8d819e" },
      { at: [17.3, 1.15, -3.1], size: [0.3, 2.4, 4.3], color: "#8d819e" },
      { at: [22.7, 1.15, -3.1], size: [0.3, 2.4, 4.3], color: "#8d819e" },
      { at: [20, 2.5, -5], size: [5.9, 0.25, 0.8], color: "#514564" },
    ];
    for (let i = 0; i < 17; i++)
      p.push({
        at: [17.2 + i * 0.35, 1.1, -1.2],
        size: [0.055, 2.2, 0.055],
        color: "#a7a0b7",
      });
    p.push(
      { at: [20, 0.65, -1.2], size: [5.8, 0.045, 0.06], color: "#a7a0b7" },
      { at: [20, 1.9, -1.2], size: [5.8, 0.045, 0.06], color: "#a7a0b7" },
    );
    return p;
  }, []);
  return (
    <>
      <Instances items={blocks} />
      <Html center position={[20, 3, -4.9]} zIndexRange={[1, 0]}>
        <span className="map-label">City holding station</span>
      </Html>
      {s.lastEscort && (
        <PoliceEscort
          key={s.lastEscort.id}
          s={s}
          reduced={reduced || s.simulation.speed === "FAST"}
        />
      )}
    </>
  );
}
