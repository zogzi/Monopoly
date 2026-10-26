import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Player, Tile } from "../../../../packages/shared/index";
import CharacterModel from "./CharacterModel";
export function Token({
  player,
  board,
  index,
  total,
  movement,
  reaction,
  instant = false,
  showLabel = false,
  isCurrent = false,
  isLocal = false,
  onInspect,
  custodyAt,
  hidden = false,
}: {
  player: Player;
  board: Tile[];
  index: number;
  total: number;
  movement: number[];
  instant?: boolean;
  showLabel?: boolean;
  isCurrent?: boolean;
  isLocal?: boolean;
  onInspect: (id: string) => void;
  custodyAt?: [number, number];
  hidden?: boolean;
  reaction?: { emoji: string; until: number };
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null),
    motion = useRef({ walking: 0 });
  const spawn = useRef<[number, number, number]>([
    board[player.position].x,
    0.8,
    board[player.position].z,
  ]);
  const queue = useRef<number[]>([]);
  const last = useRef(player.position);
  const target = useMemo(() => new THREE.Vector3(), []);
  const reducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  useFrame((state, dt) => {
    if (!ref.current) return;
    if (last.current !== player.position) {
      if (
        movement.length &&
        movement[movement.length - 1] === player.position
      ) {
        const from = movement.lastIndexOf(last.current);
        queue.current.push(...movement.slice(from >= 0 ? from + 1 : 1));
      } else queue.current = [player.position];
      last.current = player.position;
    }
    const tile = board[queue.current[0] ?? player.position],
      a = (index / total) * Math.PI * 2,
      r = total > 1 ? (total > 4 ? 0.75 : 0.45) : 0;
    target.set(
      custodyAt ? custodyAt[0] : tile.x + Math.sin(a) * r,
      0.8,
      custodyAt ? custodyAt[1] : tile.z + Math.cos(a) * r,
    );
    const reduced = instant || reducedMotion;
    ref.current.visible = !hidden;
    if (custodyAt) {
      queue.current = [];
      ref.current.position.set(custodyAt[0], 0.8, custodyAt[1]);
    } else if (reduced) {
      queue.current = [];
      ref.current.position.set(
        board[player.position].x + Math.sin(a) * r,
        0.8,
        board[player.position].z + Math.cos(a) * r,
      );
    } else {
      ref.current.position.lerp(target, 1 - Math.exp(-dt * 9));
      if (
        ref.current.position.distanceTo(target) < 0.09 &&
        queue.current.length
      )
        queue.current.shift();
    }
    const distance = ref.current.position.distanceTo(target);
    const moving =
      !reduced && !custodyAt && (queue.current.length > 0 || distance > 0.13);
    motion.current.walking = reduced
      ? 0
      : THREE.MathUtils.damp(motion.current.walking, moving ? 1 : 0, 12, dt);
    if (motion.current.walking < 0.001) motion.current.walking = 0;
    if (body.current) {
      body.current.position.y = reduced
        ? 0
        : Math.abs(Math.sin(state.clock.elapsedTime * 11)) *
          0.07 *
          motion.current.walking;
      body.current.rotation.z = reduced
        ? 0
        : Math.sin(state.clock.elapsedTime * 5.5) *
          0.035 *
          motion.current.walking;
      if (moving) {
        const heading = Math.atan2(
          target.x - ref.current.position.x,
          target.z - ref.current.position.z,
        );
        const difference = Math.atan2(
          Math.sin(heading - body.current.rotation.y),
          Math.cos(heading - body.current.rotation.y),
        );
        body.current.rotation.y += difference * (1 - Math.exp(-dt * 12));
      }
    }
  });
  return (
    <group
      ref={ref}
      position={spawn.current}
      onClick={(event) => {
        event.stopPropagation();
        onInspect(player.id);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <group ref={body}>
        <CharacterModel id={player.token} motion={motion} />
      </group>
      {(isCurrent || isLocal) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.38, 0]}>
          <ringGeometry
            args={[isCurrent ? 0.44 : 0.37, isCurrent ? 0.58 : 0.46, 32]}
          />
          <meshBasicMaterial
            color={isCurrent ? "#ffd37b" : "#d1dcff"}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {isCurrent && (
        <mesh position={[0, 1.3, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.16, 0.3, 4]} />
          <meshBasicMaterial color="#ffe0a1" />
        </mesh>
      )}
      <mesh position={[0, -0.43, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.08, 16]} />
        <meshStandardMaterial color={player.color} />
      </mesh>
      {(showLabel || hovered) && (
        <Html center position={[0, 1.1, 0]}>
          <span className="token-label" style={{ borderColor: player.color }}>
            {reaction && reaction.until > Date.now()
              ? reaction.emoji + " "
              : ""}
            {isLocal ? "You" : player.name}
            {custodyAt ? " · In custody" : isCurrent ? " · Current turn" : ""}
          </span>
        </Html>
      )}
    </group>
  );
}
