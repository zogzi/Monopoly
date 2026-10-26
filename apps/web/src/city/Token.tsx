import { useRef, useMemo } from "react";
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
}: {
  player: Player;
  board: Tile[];
  index: number;
  total: number;
  movement: number[];
  instant?: boolean;
  reaction?: { emoji: string; until: number };
}) {
  const ref = useRef<THREE.Group>(null);
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
    target.set(tile.x + Math.sin(a) * r, 0.8, tile.z + Math.cos(a) * r);
    const reduced = instant || reducedMotion;
    if (reduced) {
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
    ref.current.rotation.y = reduced
      ? 0
      : Math.sin(state.clock.elapsedTime * 0.7) * 0.15;
  });
  return (
    <group ref={ref} position={spawn.current}>
      <CharacterModel id={player.token} />
      <mesh position={[0, -0.43, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.08, 16]} />
        <meshStandardMaterial color={player.color} />
      </mesh>
      <Html center position={[0, 0.9, 0]} distanceFactor={35}>
        <span className="token-label" style={{ borderColor: player.color }}>
          {reaction && reaction.until > Date.now() ? reaction.emoji + " " : ""}
          {player.name}
        </span>
      </Html>
    </group>
  );
}
