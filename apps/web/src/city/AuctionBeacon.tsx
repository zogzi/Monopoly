import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { State } from "../../../../packages/shared/index";
import { lotPosition } from "./geometry";
export default function AuctionBeacon({
  s,
  reduced,
}: {
  s: State;
  reduced: boolean;
}) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ring.current)
      ring.current.scale.setScalar(
        reduced ? 1 : 1 + Math.sin(clock.elapsedTime * 3) * 0.06,
      );
  });
  if (!s.auction) return null;
  const t = s.board[s.auction.tile],
    at = lotPosition(t);
  return (
    <group position={[at[0], 0.4, at[1]]} name="auction-beacon">
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.05, 1.2, 40]} />
        <meshBasicMaterial
          color="#ffd184"
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
        />
      </mesh>
      <Html center position={[0, 2 + t.level * 0.5, 0]} zIndexRange={[1, 0]}>
        <span className="token-label">Live auction · ${s.auction.bid}</span>
      </Html>
    </group>
  );
}
