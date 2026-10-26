import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
export function Die({ value, x }: { value: number; x: number }) {
  const ref = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    start.current ??= clock.elapsedTime;
    const t = Math.min(1, (clock.elapsedTime - start.current) / 0.9);
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    ref.current.position.y = reduced
      ? 0.8
      : 0.8 + Math.abs(Math.sin(t * Math.PI * 3)) * (1 - t) * 2;
    ref.current.rotation.set(
      reduced ? 0 : (1 - t) * Math.PI * 4,
      reduced ? 0 : (1 - t) * Math.PI * 2,
      0,
    );
  });
  const dotPositions: Record<number, number[][]> = {
    1: [[0, 0]],
    2: [
      [-0.2, -0.2],
      [0.2, 0.2],
    ],
    3: [
      [-0.2, -0.2],
      [0, 0],
      [0.2, 0.2],
    ],
    4: [
      [-0.2, -0.2],
      [0.2, 0.2],
      [-0.2, 0.2],
      [0.2, -0.2],
    ],
    5: [
      [-0.2, -0.2],
      [0.2, 0.2],
      [-0.2, 0.2],
      [0.2, -0.2],
      [0, 0],
    ],
    6: [
      [-0.2, -0.2],
      [0.2, 0.2],
      [-0.2, 0.2],
      [0.2, -0.2],
      [-0.2, 0],
      [0.2, 0],
    ],
  };
  return (
    <group ref={ref} position={[x, 0.8, 0]}>
      <RoundedBox args={[0.75, 0.75, 0.75]} radius={0.1}>
        <meshStandardMaterial color="#f4ecda" />
      </RoundedBox>
      {dotPositions[value].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.38, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.055, 12]} />
          <meshBasicMaterial color="#293b43" />
        </mesh>
      ))}
    </group>
  );
}
