import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
export default function Traffic({ count }: { count: number }) {
  const body = useRef<THREE.InstancedMesh>(null),
    cabin = useRef<THREE.InstancedMesh>(null),
    lights = useRef<THREE.InstancedMesh>(null),
    wheels = useRef<THREE.InstancedMesh>(null);
  const object = useMemo(() => new THREE.Object3D(), []),
    color = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }) => {
    if (!body.current || !cabin.current || !lights.current || !wheels.current)
      return;
    for (let i = 0; i < count; i++) {
      const t = (clock.elapsedTime * 0.6 + (i * 40) / count) % 40,
        id = Math.floor(t),
        a = (id / 40) * Math.PI * 2,
        b = ((id + 1) / 40) * Math.PI * 2,
        f = t - id,
        x = (Math.sin(a) * (1 - f) + Math.sin(b) * f) * 12,
        z = (Math.cos(a) * (1 - f) + Math.cos(b) * f) * 12,
        yaw = Math.atan2(Math.sin(b) - Math.sin(a), Math.cos(b) - Math.cos(a));
      object.rotation.set(0, yaw, 0);
      object.position.set(x, 0.3, z);
      object.scale.set(0.23, 0.17, 0.45);
      object.updateMatrix();
      body.current.setMatrixAt(i, object.matrix);
      body.current.setColorAt(
        i,
        color.set(["#d6a56d", "#8d9bc4", "#bc80a1", "#bbc8c9"][i % 4]),
      );
      object.position.y = 0.43;
      object.scale.set(0.17, 0.12, 0.22);
      object.updateMatrix();
      cabin.current.setMatrixAt(i, object.matrix);
      object.position.set(
        x + Math.sin(yaw) * 0.23,
        0.31,
        z + Math.cos(yaw) * 0.23,
      );
      object.scale.set(0.19, 0.04, 0.025);
      object.updateMatrix();
      lights.current.setMatrixAt(i, object.matrix);
      for (let j = 0; j < 4; j++) {
        const sx = j % 2 ? 0.12 : -0.12,
          sz = j < 2 ? 0.14 : -0.14;
        object.position.set(
          x + Math.cos(yaw) * sx + Math.sin(yaw) * sz,
          0.23,
          z - Math.sin(yaw) * sx + Math.cos(yaw) * sz,
        );
        object.scale.set(0.05, 0.09, 0.1);
        object.updateMatrix();
        wheels.current.setMatrixAt(i * 4 + j, object.matrix);
      }
    }
    for (const ref of [body, cabin, lights, wheels]) {
      ref.current!.instanceMatrix.needsUpdate = true;
    }
    if (body.current.instanceColor)
      body.current.instanceColor.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh
        ref={body}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshStandardMaterial />
      </instancedMesh>
      <instancedMesh
        ref={cabin}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshStandardMaterial color="#53647c" />
      </instancedMesh>
      <instancedMesh
        ref={lights}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshBasicMaterial color="#ffe3ac" />
      </instancedMesh>
      <instancedMesh
        ref={wheels}
        args={[undefined, undefined, count * 4]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshStandardMaterial color="#262438" />
      </instancedMesh>
    </>
  );
}
