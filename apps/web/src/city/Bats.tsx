import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PRISON_CENTER } from "./prisonLayout";

export function batFlight(index: number, seconds: number) {
  const t = seconds * (0.2 + (index % 3) * 0.016) + index * 1.91;
  const moon = index % 4 === 0,
    prison = !moon && index % 6 === 5;
  const cx = prison ? PRISON_CENTER[0] : moon ? -5 : 0;
  const cz = prison ? PRISON_CENTER[1] : moon ? -19.5 : -0.6;
  const rx = prison ? 3.4 : moon ? 3 : 5.9,
    rz = prison ? 2.2 : moon ? 1.2 : 4.7;
  return {
    x: cx + Math.sin(t) * rx,
    y: (prison ? 4.8 : moon ? 9.6 : 5.4) + Math.sin(t * 1.7 + index) * 0.65,
    z: cz + Math.cos(t) * rz,
    yaw: Math.atan2(Math.cos(t) * rx, -Math.sin(t) * rz),
    bank: Math.sin(t + index) * 0.18,
    scale: 0.36 + (index % 4) * 0.035,
  };
}
export function batGeometry() {
  const positions: number[] = [],
    weights: number[] = [],
    colors: number[] = [];
  const color = new THREE.Color();
  const polygon = (
    points: [number, number][],
    tint: string,
    wing: boolean,
    depth = 0,
  ) => {
    const outline = points.map(([x, y]) => new THREE.Vector2(x, y));
    color.set(tint);
    for (const face of THREE.ShapeUtils.triangulateShape(outline, []))
      for (const id of face) {
        const p = outline[id];
        positions.push(p.x, depth, p.y);
        weights.push(wing ? Math.abs(p.x) : 0);
        colors.push(color.r, color.g, color.b);
      }
  };
  const wing: [number, number][] = [
    [0, -0.1],
    [-0.17, 0.12],
    [-0.35, 0.32],
    [-0.56, 0.46],
    [-1.02, 0.27],
    [-0.89, 0.07],
    [-0.77, 0.02],
    [-0.68, 0.13],
    [-0.54, -0.13],
    [-0.4, 0.025],
    [-0.23, -0.17],
  ];
  for (const side of [-1, 1]) {
    polygon(
      wing.map(([x, y]) => [x * side, y]),
      "#604365",
      true,
    );
    polygon(
      [
        [-0.13 * side, 0.1],
        [-1.02 * side, 0.27],
        [-0.94 * side, 0.26],
      ],
      "#9b718a",
      true,
      0.007,
    );
    polygon(
      [
        [-0.12 * side, 0.12],
        [-0.13 * side, 0.34],
        [-0.025 * side, 0.21],
      ],
      "#30213c",
      false,
      0.015,
    );
    polygon(
      [
        [side * 0.035, 0.16],
        [side * 0.075, 0.16],
        [side * 0.054, 0.205],
      ],
      "#f2b975",
      false,
      0.035,
    );
  }
  polygon(
    [
      [-0.09, -0.15],
      [-0.14, 0.1],
      [-0.08, 0.22],
      [0.08, 0.22],
      [0.14, 0.1],
      [0.09, -0.15],
      [0, -0.24],
    ],
    "#2d2039",
    false,
    0.02,
  );
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("aWing", new THREE.Float32BufferAttribute(weights, 1));
  geometry.setAttribute("aTint", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute(
    "aPhase",
    new THREE.InstancedBufferAttribute(
      Float32Array.from({ length: 20 }, (_, i) => i * 2.1),
      1,
    ),
  );
  return geometry;
}
export default function Bats({
  reduced,
  quality,
}: {
  reduced: boolean;
  quality: string;
}) {
  const ref = useRef<THREE.InstancedMesh>(null),
    time = useRef(0);
  const geometry = useMemo(() => batGeometry(), []),
    object = useMemo(() => new THREE.Object3D(), []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const count = quality === "LOW" ? 6 : quality === "HIGH" ? 20 : 14;
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    if (!reduced) time.current += Math.min(dt, 0.05);
    uniforms.uTime.value = reduced ? 0 : time.current;
    for (let i = 0; i < count; i++) {
      const p = batFlight(i, reduced ? 0 : time.current);
      object.position.set(p.x, p.y, p.z);
      object.rotation.set(-0.08, p.yaw, p.bank);
      object.scale.setScalar(p.scale);
      object.updateMatrix();
      ref.current.setMatrixAt(i, object.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      name="halloween-bat-colony"
      ref={ref}
      args={[geometry, undefined, count]}
      frustumCulled={false}
      raycast={() => {}}
    >
      <shaderMaterial
        uniforms={uniforms}
        side={THREE.DoubleSide}
        vertexShader={`attribute float aWing;attribute vec3 aTint;attribute float aPhase;uniform float uTime;varying vec3 tint;void main(){vec3 p=position;p.y+=sin(uTime*10.+aPhase)*aWing*.42;p.z+=cos(uTime*10.+aPhase)*aWing*.08;tint=aTint;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.);}`}
        fragmentShader={`varying vec3 tint;void main(){gl_FragColor=vec4(tint,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}
      />
    </instancedMesh>
  );
}
