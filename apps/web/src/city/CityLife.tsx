import { useMemo, useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Tile } from "../../../../packages/shared/index";
import Instances from "./Instances";
/** Cosmetic loops follow precomputed sidewalk segments, not gameplay or traffic AI. */
export function sidewalkPoint(
  board: Tile[],
  i: number,
  t: number,
): [number, number] {
  const start = board[(i * 7) % 40],
    end = board[(i * 7 + 1) % 40];
  const u = (Math.sin(t * 0.45 + i * 2.1) + 1) * 0.5;
  const dx = end.x - start.x,
    dz = end.z - start.z,
    length = Math.hypot(dx, dz);
  return [
    start.x + dx * u + (dz / length) * 0.55,
    start.z + dz * u - (dx / length) * 0.55,
  ];
}
export default function CityLife({
  board,
  reduced,
  quality,
}: {
  board: Tile[];
  reduced: boolean;
  quality: string;
}) {
  const people = useRef<THREE.InstancedMesh>(null),
    heads = useRef<THREE.InstancedMesh>(null),
    ferry = useRef<THREE.Group>(null);
  const count = quality === "LOW" ? 16 : quality === "HIGH" ? 64 : 40,
    object = useMemo(() => new THREE.Object3D(), []),
    color = useMemo(() => new THREE.Color(), []);
  useLayoutEffect(() => {
    if (!people.current) return;
    for (let i = 0; i < count; i++)
      people.current.setColorAt(
        i,
        color.set(["#e5a376", "#ae91d2", "#b9bece", "#cd7e9f"][i % 4]),
      );
    if (people.current.instanceColor)
      people.current.instanceColor.needsUpdate = true;
  }, [count, color]);
  const boat = useMemo(
    () => [
      {
        at: [0, 0, 0] as [number, number, number],
        size: [1.7, 0.3, 0.8] as [number, number, number],
        color: "#8d7caa",
      },
      {
        at: [-0.1, 0.3, 0] as [number, number, number],
        size: [0.9, 0.4, 0.65] as [number, number, number],
        color: "#c8bdcf",
      },
      {
        at: [0.1, 0.6, 0] as [number, number, number],
        size: [0.12, 0.45, 0.12] as [number, number, number],
        color: "#746185",
      },
    ],
    [],
  );
  useFrame(({ clock }) => {
    const time = reduced ? 0 : clock.elapsedTime;
    if (people.current && heads.current) {
      for (let i = 0; i < count; i++) {
        const [x, z] = sidewalkPoint(board, i, time),
          bob = reduced ? 0 : Math.sin(time * 6 + i) * 0.015;
        object.position.set(x, 0.34 + bob, z);
        object.scale.set(0.1, 0.25, 0.1);
        object.rotation.set(0, i, 0);
        object.updateMatrix();
        people.current.setMatrixAt(i, object.matrix);
        object.position.y = 0.52 + bob;
        object.scale.set(0.13, 0.13, 0.13);
        object.updateMatrix();
        heads.current.setMatrixAt(i, object.matrix);
      }
      people.current.instanceMatrix.needsUpdate = true;
      heads.current.instanceMatrix.needsUpdate = true;
    }
    if (ferry.current) {
      ferry.current.position.set(
        -3.1 + Math.sin(time * 0.1) * 1.5,
        -0.27 + Math.sin(time * 0.9) * 0.035,
        17.1,
      );
      ferry.current.rotation.set(0, 0.12, Math.sin(time * 0.6) * 0.035);
    }
  });
  return (
    <>
      <instancedMesh
        name="district-pedestrians"
        ref={people}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh
        ref={heads}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.5, 6, 5]} />
        <meshStandardMaterial color="#d3a080" />
      </instancedMesh>
      <group ref={ferry} name="harbor-ferry">
        <Instances items={boat} />
        <mesh position={[0, 0.3, 0.333]}>
          <planeGeometry args={[0.6, 0.18]} />
          <meshBasicMaterial color="#ffd89f" />
        </mesh>
      </group>
    </>
  );
}
