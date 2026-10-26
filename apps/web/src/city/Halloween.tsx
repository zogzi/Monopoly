import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { State } from "../../../../packages/shared/index";
import Instances, { type Block } from "./Instances";
import { lotPosition } from "./geometry";
function Moon() {
  const craters = useMemo<Block[]>(
    () =>
      [
        [-0.8, 0.9, 2.3, 0.32],
        [0.8, -0.7, 2.4, 0.45],
        [0.6, 1.5, 2, 0.25],
        [-1, -0.6, 2.3, 0.22],
      ].map(([x, y, z, r]) => ({
        at: [x, y, z],
        size: [r * 2, r * 2, r * 2],
        color: "#d9b18e",
      })),
    [],
  );
  return (
    <group position={[-5, 10, -21]}>
      <mesh>
        <sphereGeometry args={[2.7, 32, 24]} />
        <meshBasicMaterial color="#ffe0a3" />
      </mesh>
      <Instances items={craters} shape="sphere" unlit />
      <mesh>
        <sphereGeometry args={[2.95, 24, 16]} />
        <meshBasicMaterial
          color="#ffbd8c"
          transparent
          opacity={0.065}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
function Bats({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          0, 0, 0, -1, 0.35, 0, -0.45, -0.18, 0, 0, 0, 0, 0.45, -0.18, 0, 1,
          0.35, 0,
        ],
        3,
      ),
    );
    return g;
  }, []);
  const object = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    for (let i = 0; i < 9; i++) {
      const t = (reduced ? 0 : clock.elapsedTime * 0.13) + i * 0.72;
      object.position.set(
        Math.sin(t) * 6,
        5.5 + Math.sin(t * 2 + i) * 1.7,
        Math.cos(t) * 6 - 2,
      );
      object.rotation.set(0.3, t, 0);
      object.scale.set(
        0.4,
        0.25 +
          Math.abs(Math.sin((reduced ? 0 : clock.elapsedTime) * 7 + i)) * 0.4,
        0.4,
      );
      object.updateMatrix();
      ref.current.setMatrixAt(i, object.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, 9]}>
      <meshBasicMaterial color="#21152f" side={THREE.DoubleSide} />
    </instancedMesh>
  );
}
function CarnivalWheel({ reduced }: { reduced: boolean }) {
  const wheel = useRef<THREE.Group>(null);
  const pieces = useMemo(() => {
    const spokes: Block[] = [],
      cabins: Block[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      spokes.push({
        at: [-Math.sin(angle) * 0.7, Math.cos(angle) * 0.7, 0],
        size: [0.035, 1.4, 0.035],
        rotationZ: angle,
        color: "#a589c8",
      });
      cabins.push({
        at: [-Math.sin(angle) * 1.45, Math.cos(angle) * 1.45, 0],
        size: [0.3, 0.32, 0.3],
        rotationZ: angle,
        color: i % 2 ? "#ed78a6" : "#f2a95f",
      });
    }
    return { spokes, cabins };
  }, []);
  useFrame((_, dt) => {
    if (wheel.current && !reduced) wheel.current.rotation.z += dt * 0.12;
  });
  return (
    <group position={[7.5, 1.8, 0]} rotation={[0, Math.PI / 4, 0]}>
      <mesh position={[0, -0.5, 0]}>
        <coneGeometry args={[0.8, 2.8, 3]} />
        <meshStandardMaterial color="#6e467f" />
      </mesh>
      <group ref={wheel}>
        <mesh>
          <torusGeometry args={[1.45, 0.045, 6, 48]} />
          <meshBasicMaterial color="#f0a967" />
        </mesh>
        <Instances items={pieces.spokes} unlit />
        <Instances items={pieces.cabins} />
      </group>
    </group>
  );
}
export default function Halloween({
  state,
  quality,
  reduced,
}: {
  state: State;
  quality: string;
  reduced: boolean;
}) {
  const data = useMemo(() => {
    const roofs: Block[] = [],
      pumpkins: Block[] = [],
      props: Block[] = [],
      lights: Block[] = [];
    const b = (at: Block["at"], size: Block["size"], color: string) => ({
      at,
      size,
      color,
    });
    for (const t of state.board) {
      const [x, z] = lotPosition(t),
        floors = 1 + t.level * 2 + (t.district === 4 ? 1 : 0),
        height = 0.55 + floors * 0.35;
      if ([1, 5, 6, 7].includes(t.district))
        roofs.push({
          ...b(
            [x, 0.7 + height, z],
            [1.25, 0.8 + t.level * 0.15, 1.25],
            ["#493054", "#514470", "#5e3f72", "#704259"][t.district % 4],
          ),
          rotation: Math.PI / 4,
          tile: t.id,
        });
      if (t.id % 2 === 0) {
        pumpkins.push(
          b([x - 0.65, 0.44, z + 0.55], [0.38, 0.32, 0.38], "#f18b38"),
        );
        props.push(
          b([x - 0.65, 0.64, z + 0.55], [0.055, 0.15, 0.055], "#7d5748"),
        );
        lights.push(
          b([x - 0.7, 0.46, z + 0.73], [0.035, 0.04, 0.02], "#ffe3a1"),
          b([x - 0.6, 0.46, z + 0.73], [0.035, 0.04, 0.02], "#ffe3a1"),
        );
      }
      if (t.id < 40 && t.id % 3 === 0) {
        const r = Math.hypot(t.x, t.z),
          lx = (t.x / r) * 11.1,
          lz = (t.z / r) * 11.1;
        props.push(b([lx, 0.65, lz], [0.055, 1.1, 0.055], "#54435e"));
        lights.push(b([lx, 1.24, lz], [0.19, 0.23, 0.19], "#ffc77e"));
      }
    }
    // Gothic exchange: a proper silhouette with spires, buttresses and stained glass.
    props.push(
      b([0, 1.45, 0], [2.3, 2.6, 1.8], "#6d5b82"),
      b([0, 0.4, 0], [3.8, 0.5, 3], "#78648a"),
    );
    for (const x of [-1.3, 1.3])
      for (const z of [-0.9, 0.9]) {
        props.push(b([x, 1.75, z], [0.65, 3.2, 0.65], "#9c83a8"));
        roofs.push(b([x, 3.9, z], [0.95, 1.4, 0.95], "#422c59"));
        lights.push(b([x, 2.9, z + 0.34], [0.18, 0.5, 0.02], "#ffbc7e"));
      }
    roofs.push({
      ...b([0, 3.3, 0], [2.6, 1.5, 2.3], "#422c59"),
      rotation: Math.PI / 4,
    });
    props.push(b([0, 2.5, -0.25], [0.8, 2.3, 0.8], "#a28ab6"));
    roofs.push(b([0, 4.25, -0.25], [1.1, 1.4, 1.1], "#422c59"));
    for (const x of [-0.6, 0, 0.6])
      lights.push(
        b([x, 1.8, 0.92], [0.22, 0.8, 0.03], x === 0 ? "#d5a0ff" : "#ffb376"),
      );
    // Cemetery garden and waterfront piers stay clear of playable streets.
    for (let i = 0; i < 12; i++) {
      const x = -4 - (i % 4) * 0.6,
        z = -4 - Math.floor(i / 4) * 0.75;
      props.push(
        b([x, 0.45, z], [0.3, 0.6, 0.16], "#9987a5"),
        b([x, 0.15, z + 0.25], [0.42, 0.1, 0.65], "#73617f"),
      );
    }
    for (let i = 0; i < 4; i++)
      props.push(b([-4 + i * 0.7, 0.08, 15.3], [0.5, 0.12, 2.7], "#816477"));
    return { roofs, pumpkins, props, lights };
  }, [state.board]);
  return (
    <>
      <Moon />
      <Instances items={data.roofs} shape="cone" />
      <Instances items={data.pumpkins} shape="sphere" />
      <Instances items={data.props} />
      <Instances items={data.lights} unlit />
      <Bats reduced={reduced} />
      {quality !== "LOW" && <CarnivalWheel reduced={reduced} />}
      {[17.3, 19.2, 21.2].map((r, i) => (
        <mesh
          key={r}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.65 + i * 0.005, 0]}
        >
          <ringGeometry args={[r, r + 0.03, 96]} />
          <meshBasicMaterial
            color="#aa79be"
            transparent
            opacity={0.25 - i * 0.05}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
