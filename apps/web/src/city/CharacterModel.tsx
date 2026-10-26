import { memo, useRef, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Instances from "./Instances";
import { characterGeometry } from "./characterGeometry";
export default memo(function CharacterModel({
  id,
  motion,
}: {
  id: string;
  motion?: RefObject<{ walking: number }>;
}) {
  const { boxes, balls, cones } = characterGeometry(id);
  const mesh = useRef<THREE.InstancedMesh>(null),
    object = useMemo(() => new THREE.Object3D(), []);
  const last = useRef(0);
  useFrame(({ clock }) => {
    if (!motion || !mesh.current) return;
    const walking = motion.current.walking;
    if (walking === 0 && last.current === 0) return;
    last.current = walking;
    for (const i of [0, 1, 3, 4]) {
      const part = boxes[i],
        swing =
          Math.sin(clock.elapsedTime * 11) *
          0.65 *
          walking *
          (i === 0 || i === 4 ? 1 : -1);
      const pivot = i < 2 ? -0.13 : 0.17,
        offset = part.at[1] - pivot;
      object.position.set(
        part.at[0],
        pivot + offset * Math.cos(swing),
        part.at[2] + offset * Math.sin(swing),
      );
      object.rotation.set(swing, 0, 0);
      object.scale.set(...part.size);
      object.updateMatrix();
      mesh.current.setMatrixAt(i, object.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group scale={0.85}>
      <Instances items={boxes} meshRef={mesh} />
      <Instances items={balls} shape="sphere" />
      {cones.length > 0 && <Instances items={cones} shape="cone" />}
    </group>
  );
});
