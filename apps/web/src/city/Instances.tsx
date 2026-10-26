import { useLayoutEffect, useRef, type RefObject } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
export type Block = {
  at: [number, number, number];
  size: [number, number, number];
  color: string;
  rotation?: number;
  rotationZ?: number;
  tile?: number;
  glow?: boolean;
};
const roofShape = new THREE.Shape()
  .moveTo(-0.5, -0.5)
  .lineTo(0, 0.5)
  .lineTo(0.5, -0.5)
  .closePath();
/** One draw call and one shared geometry/material for all boxes, with per-instance colors. */
export default function Instances({
  items,
  onSelect,
  onHover,
  shadows = false,
  shape = "box",
  unlit = false,
  meshRef,
}: {
  items: Block[];
  onSelect?: (id: number) => void;
  onHover?: (id: number | null) => void;
  shadows?: boolean;
  shape?: "box" | "cone" | "sphere" | "gable";
  unlit?: boolean;
  meshRef?: RefObject<THREE.InstancedMesh | null>;
}) {
  const localRef = useRef<THREE.InstancedMesh>(null);
  const ref = meshRef ?? localRef;
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const object = new THREE.Object3D(),
      color = new THREE.Color();
    items.forEach((item, i) => {
      object.position.set(...item.at);
      object.scale.set(...item.size);
      object.rotation.set(0, item.rotation ?? 0, item.rotationZ ?? 0);
      object.updateMatrix();
      mesh.setMatrixAt(i, object.matrix);
      mesh.setColorAt(i, color.set(item.color));
    });
    mesh.count = items.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  const click = (event: ThreeEvent<MouseEvent>) => {
    const tile = items[event.instanceId ?? -1]?.tile;
    if (tile !== undefined) {
      event.stopPropagation();
      onSelect?.(tile);
    }
  };
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, Math.max(1, items.length)]}
      onClick={onSelect ? click : undefined}
      onPointerMove={
        onHover
          ? (e) => {
              const tile = items[e.instanceId ?? -1]?.tile;
              if (tile !== undefined) {
                e.stopPropagation();
                onHover(tile);
              }
            }
          : undefined
      }
      onPointerOut={onHover ? () => onHover(null) : undefined}
      castShadow={shadows}
      receiveShadow
    >
      {shape === "box" ? (
        <boxGeometry />
      ) : shape === "cone" ? (
        <coneGeometry args={[0.5, 1, 4]} />
      ) : shape === "gable" ? (
        <extrudeGeometry
          args={[roofShape, { depth: 1, bevelEnabled: false, steps: 1 }]}
          onUpdate={(geometry) => {
            if (!geometry.userData.centered) {
              geometry.translate(0, 0, -0.5);
              geometry.userData.centered = true;
            }
          }}
        />
      ) : (
        <sphereGeometry args={[0.5, 12, 8]} />
      )}
      {unlit ? (
        <meshBasicMaterial />
      ) : (
        <meshStandardMaterial roughness={0.72} />
      )}
    </instancedMesh>
  );
}
