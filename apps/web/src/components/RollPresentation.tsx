import {
  useEffect,
  useRef,
  useState,
  useMemo,
  useLayoutEffect,
  useCallback,
  type RefObject,
} from "react";
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
function Die({
  value,
  x,
  index,
  progress,
  reduced,
}: {
  value: number;
  x: number;
  index: number;
  progress: RefObject<{ value: number }>;
  reduced: boolean;
}) {
  const ref = useRef<THREE.Group>(null),
    spots = useRef<THREE.InstancedMesh>(null);
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
  useLayoutEffect(() => {
    if (!spots.current) return;
    const face = new THREE.Object3D(),
      pip = new THREE.Object3D(),
      matrix = new THREE.Matrix4();
    let i = 0;
    for (const [n, at, rotation] of faces) {
      face.position.set(...at);
      face.rotation.set(...rotation);
      face.updateMatrix();
      for (const [a, b] of pips[n]) {
        pip.position.set(a, b, 0);
        pip.updateMatrix();
        matrix.multiplyMatrices(face.matrix, pip.matrix);
        spots.current.setMatrixAt(i++, matrix);
      }
    }
    spots.current.instanceMatrix.needsUpdate = true;
  }, [value]);
  useFrame(() => {
    if (!ref.current) return;
    const t = reduced ? 1 : progress.current.value,
      left = 1 - t,
      side = index ? 1 : -1;
    ref.current.position.set(
      x + side * 3.6 * left ** 3,
      0.9 +
        2.2 * Math.max(0, 1 - t * 3) ** 2 +
        Math.abs(Math.sin(t * Math.PI * 3.4)) * left * 1.4,
      0.8 * left * Math.sin(t * Math.PI * 2 + index),
    );
    ref.current.rotation.set(
      left ** 1.35 * Math.PI * (7 + index),
      left ** 1.5 * Math.PI * (5 + index),
      side * left ** 1.6 * Math.PI * 2,
    );
  });
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
      <instancedMesh
        ref={spots}
        args={[undefined, undefined, 21]}
        frustumCulled={false}
      >
        <circleGeometry args={[0.105, 16]} />
        <meshBasicMaterial color="#30223c" />
      </instancedMesh>
    </group>
  );
}
function DiceScene({
  roll,
  onStarted,
  onSettled,
  reduced,
}: {
  roll: NonNullable<State["lastRoll"]>;
  onStarted: () => void;
  onSettled: () => void;
  reduced: boolean;
}) {
  const progress = useRef({ value: 0 }),
    started = useRef(false),
    settled = useRef(false);
  useFrame(({ gl }, dt) => {
    if (!started.current) {
      started.current = true;
      onStarted();
      window.dispatchEvent(new Event("zmonopoly-dice-animation"));
    }
    progress.current.value = reduced
      ? 1
      : Math.min(1, progress.current.value + Math.min(dt, 0.05) / 1.9);
    gl.domElement.dataset.rollProgress = progress.current.value.toFixed(3);
    if (progress.current.value >= 1 && !settled.current) {
      settled.current = true;
      onSettled();
    }
  }, -1);
  return (
    <>
      <ambientLight intensity={1.7} />
      <directionalLight
        position={[-3, 8, 5]}
        intensity={3}
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <Die
        value={roll.dice[0]}
        x={-1.2}
        index={0}
        progress={progress}
        reduced={reduced}
      />
      <Die
        value={roll.dice[1]}
        x={1.2}
        index={1}
        progress={progress}
        reduced={reduced}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial opacity={0.2} />
      </mesh>
    </>
  );
}
export default function RollPresentation({
  s,
  id,
  onActiveChange,
}: {
  s: State;
  id: string | null;
  onActiveChange?: (active: boolean) => void;
}) {
  const previous = useRef<number | null>(null),
    [roll, setRoll] = useState<State["lastRoll"]>(null);
  const [stage, setStage] = useState("loading");
  const reduced = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const started = useCallback(() => setStage("rolling"), []),
    settled = useCallback(() => setStage("settled"), []);
  useEffect(() => {
    onActiveChange?.(!!roll);
  }, [!!roll, onActiveChange]);
  useEffect(() => () => onActiveChange?.(false), [onActiveChange]);
  useEffect(() => {
    const latest = s.lastRoll;
    if (!latest || latest.id === previous.current) return;
    previous.current = latest.id;
    if (!id) return;
    const manualLocal =
      latest.playerId === id && !(s.simulation.autoplay && s.host === id);
    if (!manualLocal) return;
    setStage("loading");
    setRoll(latest);
  }, [s.lastRoll, id, s.simulation.speed, s.simulation.autoplay, s.host]);
  useEffect(() => {
    if (!roll) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRoll(null);
      if (event.key === "Tab") event.preventDefault();
    };
    document.addEventListener("keydown", key);
    const timer = setTimeout(
      () => setRoll(null),
      stage === "settled" ? 1600 : 12000,
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", key);
    };
  }, [roll, stage]);
  if (!roll) return null;
  const player = s.players.find((p) => p.id === roll.playerId);
  const sum = roll.dice[0] + roll.dice[1];
  return (
    <div
      className="roll-overlay"
      data-stage={stage}
      role="dialog"
      aria-label="Dice roll"
      aria-modal="true"
    >
      <div className="roll-heading">
        <p>{player?.name ?? "A player"} rolls</p>
        <h2>
          {stage === "settled"
            ? `${roll.dice[0]} + ${roll.dice[1]} = ${sum}`
            : "Rolling dice…"}
        </h2>
      </div>
      <div className="roll-canvas">
        <Canvas
          shadows
          camera={{ position: [5, 7, 10], fov: 38 }}
          dpr={[1, 1.5]}
        >
          <DiceScene
            key={roll.id}
            roll={roll}
            reduced={reduced}
            onStarted={started}
            onSettled={settled}
          />
        </Canvas>
      </div>
      <button autoFocus className="primary" onClick={() => setRoll(null)}>
        Continue
      </button>
      <p className="roll-note">
        {stage === "settled"
          ? `Move ${sum + (roll.bonus ?? 0)} spaces`
          : "You can skip the animation at any time"}
        {roll.bonus ? ` (+${roll.bonus} bonus)` : ""}.
      </p>
    </div>
  );
}
