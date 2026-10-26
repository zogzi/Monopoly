import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { State } from "../../../../packages/shared/index";
const pips: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-0.42, -0.42],
    [0.42, 0.42],
  ],
  3: [
    [-0.42, -0.42],
    [0, 0],
    [0.42, 0.42],
  ],
  4: [
    [-0.42, -0.42],
    [-0.42, 0.42],
    [0.42, -0.42],
    [0.42, 0.42],
  ],
  5: [
    [-0.42, -0.42],
    [-0.42, 0.42],
    [0.42, -0.42],
    [0.42, 0.42],
    [0, 0],
  ],
  6: [
    [-0.42, -0.42],
    [-0.42, 0],
    [-0.42, 0.42],
    [0.42, -0.42],
    [0.42, 0],
    [0.42, 0.42],
  ],
};
function Die({ value, x, index }: { value: number; x: number; index: number }) {
  const ref = useRef<THREE.Group>(null),
    start = useRef<number | null>(null);
  const reduced = useRef(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useFrame(({ clock }) => {
    if (!ref.current) return;
    start.current ??= clock.elapsedTime;
    const t = Math.min(1, (clock.elapsedTime - start.current) / 1.45),
      ease = 1 - (1 - t) ** 3;
    ref.current.position.set(
      x,
      0.9 +
        (reduced.current
          ? 0
          : Math.abs(Math.sin(t * Math.PI * 3.5)) * (1 - t) * 3),
      0,
    );
    ref.current.rotation.set(
      reduced.current ? 0 : (1 - ease) * Math.PI * (4 + index * 2),
      reduced.current ? 0 : (1 - ease) * Math.PI * 4,
      0,
    );
  });
  const front = [1, 2, 3, 4, 5, 6].find((n) => n !== value && n !== 7 - value)!;
  const right = [1, 2, 3, 4, 5, 6].find(
    (n) => ![value, 7 - value, front, 7 - front].includes(n),
  )!;
  const faces: [number, [number, number, number], [number, number, number]][] =
    [
      [value, [0, 0.856, 0], [-Math.PI / 2, 0, 0]],
      [7 - value, [0, -0.856, 0], [Math.PI / 2, 0, 0]],
      [front, [0, 0, 0.856], [0, 0, 0]],
      [7 - front, [0, 0, -0.856], [0, Math.PI, 0]],
      [right, [0.856, 0, 0], [0, Math.PI / 2, 0]],
      [7 - right, [-0.856, 0, 0], [0, -Math.PI / 2, 0]],
    ];
  return (
    <group ref={ref} position={[x, 0.9, 0]}>
      <RoundedBox
        args={[1.7, 1.7, 1.7]}
        radius={0.16}
        smoothness={3}
        castShadow
      >
        <meshStandardMaterial
          color={index ? "#e9d6ed" : "#fff1ce"}
          roughness={0.3}
          metalness={0.12}
        />
      </RoundedBox>
      {faces.map(([n, at, rotation], face) => (
        <group key={face} position={at} rotation={rotation}>
          {pips[n].map(([a, b], i) => (
            <mesh key={i} position={[a, b, 0]}>
              <circleGeometry args={[0.105, 16]} />
              <meshBasicMaterial color="#30223c" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
export default function RollPresentation({
  s,
  id,
}: {
  s: State;
  id: string | null;
}) {
  const previous = useRef<number | null>(null),
    [roll, setRoll] = useState<State["lastRoll"]>(null);
  useEffect(() => {
    const latest = s.lastRoll;
    if (!latest || latest.id === previous.current) return;
    previous.current = latest.id;
    if (!id) return;
    const manualLocal =
      latest.playerId === id && !(s.simulation.autoplay && s.host === id);
    if (s.simulation.speed === "FAST" && !manualLocal) return;
    setRoll(latest);
  }, [s.lastRoll, id, s.simulation.speed, s.simulation.autoplay, s.host]);
  useEffect(() => {
    if (!roll) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRoll(null);
      if (event.key === "Tab") event.preventDefault();
    };
    document.addEventListener("keydown", key);
    const timer = setTimeout(() => setRoll(null), 2400);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", key);
    };
  }, [roll]);
  if (!roll) return null;
  const player = s.players.find((p) => p.id === roll.playerId);
  const sum = roll.dice[0] + roll.dice[1];
  return (
    <div
      className="roll-overlay"
      role="dialog"
      aria-label="Dice roll"
      aria-modal="true"
    >
      <div className="roll-heading">
        <p>{player?.name ?? "A player"} rolls</p>
        <h2>
          {roll.dice[0]} + {roll.dice[1]} = {sum}
        </h2>
      </div>
      <div className="roll-canvas">
        <Canvas
          shadows
          camera={{ position: [5, 7, 10], fov: 38 }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={1.7} />
          <directionalLight
            position={[-3, 8, 5]}
            intensity={3}
            castShadow
            shadow-mapSize={[512, 512]}
          />
          <Die key={`${roll.id}-0`} value={roll.dice[0]} x={-1.2} index={0} />
          <Die key={`${roll.id}-1`} value={roll.dice[1]} x={1.2} index={1} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial opacity={0.2} />
          </mesh>
        </Canvas>
      </div>
      <button autoFocus className="primary" onClick={() => setRoll(null)}>
        Continue
      </button>
      <p className="roll-note">
        Move {sum + (roll.bonus ?? 0)} spaces
        {roll.bonus ? ` (+${roll.bonus} bonus)` : ""}.
      </p>
    </div>
  );
}
