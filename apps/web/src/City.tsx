import {
  Canvas,
  useFrame,
  useThree,
  type ThreeElements,
} from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  ContactShadows,
  RoundedBox,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  districts,
  type State,
  type Tile,
  type Player,
} from "../../../packages/shared/index";
function Box({
  position,
  size,
  color,
  ...props
}: Omit<ThreeElements["mesh"], "position" | "color"> & {
  position?: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow {...props}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.65} />
    </mesh>
  );
}
function Road({ a, b, rail = false }: { a: Tile; b: Tile; rail?: boolean }) {
  const length = Math.hypot(a.x - b.x, a.z - b.z);
  return (
    <group
      position={[(a.x + b.x) / 2, 0.14, (a.z + b.z) / 2]}
      rotation={[0, Math.atan2(b.x - a.x, b.z - a.z), 0]}
    >
      <Box
        size={[rail ? 0.18 : 0.65, 0.045, length]}
        color={rail ? "#d4b780" : "#35434b"}
      />
      {!rail &&
        Array.from({ length: Math.floor(length / 0.6) }, (_, i) => (
          <Box
            key={i}
            position={[0, 0.03, -length / 2 + i * 0.6 + 0.3]}
            size={[0.025, 0.01, 0.22]}
            color="#a2a9a2"
          />
        ))}
    </group>
  );
}
function Building({
  tile,
  selected,
  onSelect,
  owner,
}: {
  tile: Tile;
  selected: boolean;
  onSelect: () => void;
  owner?: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const height =
    tile.type === "property"
      ? 0.45 + tile.level * 0.85 + (tile.id % 4) * 0.15
      : tile.type === "utility"
        ? 1.6
        : 0.5;
  useFrame((_, dt) => {
    if (ref.current)
      ref.current.scale.y = THREE.MathUtils.damp(ref.current.scale.y, 1, 5, dt);
  });
  const c = districts[tile.district].color;
  return (
    <group
      position={[tile.x, 0, tile.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <RoundedBox
        args={[1.5, 0.15, 1.5]}
        radius={0.05}
        position={[0, 0.14, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color={selected ? "#f4d69a" : owner || "#8b998d"}
        />
      </RoundedBox>
      <group key={tile.level} ref={ref} scale={[1, 0.1, 1]}>
        <Box
          position={[0, 0.26 + height / 2, 0]}
          size={[1.03, height, 0.95]}
          color={
            tile.type === "property"
              ? ["#d4d5c4", "#b9c7bf", "#c8cec5"][tile.id % 3]
              : "#b8d1cc"
          }
        />
        <Box
          position={[0, 0.28 + height, 0]}
          size={[1.12, 0.12, 1.04]}
          color={c}
        />
        {tile.type === "property" &&
          Array.from(
            { length: Math.max(1, Math.floor(height / 0.3)) },
            (_, i) => (
              <group key={i}>
                {[-0.32, 0, 0.32].map((x, j) => (
                  <Box
                    key={j}
                    position={[x, 0.4 + i * 0.3, 0.485]}
                    size={[0.16, 0.12, 0.018]}
                    color={tile.level > 1 ? "#f4db9d" : "#6f939a"}
                  />
                ))}
                <Box
                  position={[0.525, 0.4 + i * 0.3, 0]}
                  size={[0.02, 0.12, 0.65]}
                  color="#719498"
                />
              </group>
            ),
          )}
        {tile.level >= 3 && (
          <Box
            position={[0.2, height + 0.65, 0]}
            size={[0.035, 0.65, 0.035]}
            color="#d6e3d2"
          />
        )}
        {tile.type === "civic" && (
          <mesh position={[0, height + 0.4, 0]}>
            <coneGeometry args={[0.7, 0.5, 4]} />
            <meshStandardMaterial color="#bfa974" />
          </mesh>
        )}
      </group>
      <Box position={[0, 0.25, 0.65]} size={[1.25, 0.025, 0.1]} color={c} />
      {selected && (
        <Html center position={[0, height + 1, 0]} distanceFactor={25}>
          <div className="map-label">{tile.name}</div>
        </Html>
      )}
    </group>
  );
}
function Trees() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!ref.current || !trunks.current) return;
    const obj = new THREE.Object3D();
    for (let i = 0; i < 64; i++) {
      const a = i * 2.39996,
        r = 6 + ((i * 17) % 37) / 10;
      obj.position.set(Math.sin(a) * r, 0.65, Math.cos(a) * r);
      obj.scale.setScalar(0.35 + (i % 3) * 0.08);
      obj.updateMatrix();
      ref.current.setMatrixAt(i, obj.matrix);
      obj.position.y = 0.3;
      obj.scale.set(0.06, 0.4, 0.06);
      obj.updateMatrix();
      trunks.current.setMatrixAt(i, obj.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    trunks.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <>
      <instancedMesh ref={ref} args={[undefined, undefined, 64]} castShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#547e68" />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, 64]}>
        <cylinderGeometry args={[1, 1, 1, 5]} />
        <meshStandardMaterial color="#8c7457" />
      </instancedMesh>
    </>
  );
}
function TokenModel({ kind, color }: { kind: string; color: string }) {
  const material = (
    <meshStandardMaterial color={color} metalness={0.35} roughness={0.3} />
  );
  if (kind === "car")
    return (
      <group>
        <RoundedBox args={[0.55, 0.2, 0.85]} radius={0.08}>
          {material}
        </RoundedBox>
        <Box
          position={[0, 0.17, 0]}
          size={[0.35, 0.18, 0.35]}
          color="#a9ced0"
        />
        {[-1, 1].flatMap((x) =>
          [-1, 1].map((z) => (
            <mesh
              key={`${x}${z}`}
              position={[x * 0.28, -0.07, z * 0.25]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.11, 0.11, 0.08, 12]} />
              <meshStandardMaterial color="#21333d" />
            </mesh>
          )),
        )}
      </group>
    );
  if (kind === "robot")
    return (
      <group>
        <RoundedBox args={[0.4, 0.4, 0.3]} radius={0.05}>
          {material}
        </RoundedBox>
        <Box position={[0, 0.35, 0]} size={[0.46, 0.28, 0.32]} color={color} />
        {[-1, 1].map((i) => (
          <Box
            key={i}
            position={[i * 0.12, 0.37, 0.17]}
            size={[0.07, 0.07, 0.03]}
            color="#f6edbd"
          />
        ))}
        <Box position={[0, 0.58, 0]} size={[0.04, 0.18, 0.04]} color={color} />
      </group>
    );
  if (kind === "cat")
    return (
      <group>
        <mesh>
          {material}
          <sphereGeometry args={[0.25, 12, 12]} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          {material}
          <sphereGeometry args={[0.23, 12, 12]} />
        </mesh>
        {[-1, 1].map((i) => (
          <mesh key={i} position={[i * 0.16, 0.5, 0]}>
            {material}
            <coneGeometry args={[0.13, 0.25, 3]} />
          </mesh>
        ))}
      </group>
    );
  return (
    <group>
      <mesh rotation={[0, 0, -0.18]}>
        {material}
        <capsuleGeometry args={[0.16, 0.43, 4, 12]} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <coneGeometry args={[0.17, 0.3, 12]} />
        <meshStandardMaterial color="#ede2cc" />
      </mesh>
      <Box position={[0, -0.29, 0]} size={[0.48, 0.08, 0.12]} color={color} />
      <mesh position={[0, -0.4, 0]}>
        <coneGeometry args={[0.1, 0.3, 8]} />
        <meshBasicMaterial color="#eab26d" />
      </mesh>
    </group>
  );
}
function Token({
  player,
  board,
  index,
  total,
  movement,
  reaction,
}: {
  player: Player;
  board: Tile[];
  index: number;
  total: number;
  movement: number[];
  reaction?: { emoji: string; until: number };
}) {
  const ref = useRef<THREE.Group>(null);
  const queue = useRef<number[]>([]);
  const last = useRef(player.position);
  const target = useMemo(() => new THREE.Vector3(), []);
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
      r = total > 1 ? 0.45 : 0;
    target.set(tile.x + Math.sin(a) * r, 0.8, tile.z + Math.cos(a) * r);
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      queue.current = [];
      ref.current.position.set(
        board[player.position].x,
        0.8,
        board[player.position].z,
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
    <group
      ref={ref}
      position={[board[player.position].x, 0.8, board[player.position].z]}
    >
      <TokenModel kind={player.token} color={player.color} />
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
function Traffic() {
  const refs = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    refs.current?.children.forEach((car, i) => {
      const a = clock.elapsedTime * 0.055 + (i * Math.PI) / 4;
      car.position.set(Math.sin(a) * 12, 0.3, Math.cos(a) * 12);
      car.rotation.y = a;
    });
  });
  return (
    <group ref={refs}>
      {Array.from({ length: 8 }, (_, i) => (
        <Box
          key={i}
          size={[0.15, 0.14, 0.35]}
          color={i % 2 ? "#e4bc75" : "#9cc6c6"}
        />
      ))}
    </group>
  );
}
function Die({ value, x }: { value: number; x: number }) {
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
function CameraReset({ reset }: { reset: number }) {
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    camera.position.set(26, 29, 31);
    camera.lookAt(0, 0, 0);
  }, [reset, camera]);
  return null;
}
export default function City({
  state,
  selected,
  onSelect,
  quality,
  reset,
}: {
  state: State;
  selected: number | null;
  onSelect: (id: number) => void;
  quality: string;
  reset: number;
}) {
  return (
    <Canvas
      shadows={quality !== "LOW"}
      dpr={quality === "LOW" ? 0.8 : quality === "MEDIUM" ? 1 : [1, 1.5]}
      camera={{ position: [26, 29, 31], fov: 39 }}
      gl={{ antialias: quality !== "LOW" }}
    >
      <color attach="background" args={["#172a35"]} />
      <fog attach="fog" args={["#172a35", 48, 95]} />
      <ambientLight intensity={1.6} />
      <hemisphereLight args={["#e4efed", "#74806a", 2]} />
      <directionalLight
        position={[-8, 24, 12]}
        intensity={3}
        color="#ffe5bd"
        castShadow={quality !== "LOW"}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <Suspense fallback={null}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#234350" roughness={0.35} />
        </mesh>
        <RoundedBox
          args={[29, 0.65, 29]}
          radius={0.15}
          position={[0, -0.25, 0]}
          receiveShadow
        >
          <meshStandardMaterial color="#73918b" />
        </RoundedBox>
        <RoundedBox
          args={[27.7, 0.08, 27.7]}
          radius={0.025}
          position={[0, 0.1, 0]}
          receiveShadow
        >
          <meshStandardMaterial color="#96a592" />
        </RoundedBox>
        {state.board.flatMap((t) =>
          t.next.map((n) => (
            <Road key={`${t.id}-${n}`} a={t} b={state.board[n]} />
          )),
        )}

        <CameraReset reset={reset} />
        <Trees />
        <Traffic />
        <group position={[0, 0.17, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2.2, 48]} />
            <meshStandardMaterial
              color="#739b9e"
              metalness={0.3}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.1, 0.35, 2, 8]} />
            <meshStandardMaterial color="#d7c5a2" />
          </mesh>
          <mesh position={[0, 2.1, 0]}>
            <octahedronGeometry args={[0.45]} />
            <meshStandardMaterial
              color="#e6c386"
              metalness={0.65}
              roughness={0.3}
            />
          </mesh>
        </group>
        {state.board.map((t) => (
          <Building
            key={t.id}
            tile={t}
            selected={selected === t.id}
            onSelect={() => onSelect(t.id)}
            owner={state.players.find((p) => p.id === t.owner)?.color}
          />
        ))}
        {districts.map((d, i) => {
          const a = ((i * 5 + 2) / 40) * Math.PI * 2;
          return (
            <Html
              key={d.name}
              position={[Math.sin(a) * 15, 0.2, Math.cos(a) * 15]}
              center
              distanceFactor={35}
            >
              <div className="district-label" style={{ color: d.color }}>
                {d.name.toUpperCase()}
              </div>
            </Html>
          );
        })}
        {state.players
          .filter((p) => !p.eliminated)
          .map((p) => {
            const group = state.players.filter(
              (q) => q.position === p.position && !q.eliminated,
            );
            return (
              <Token
                movement={
                  state.players[state.current]?.id === p.id ? state.path : []
                }
                reaction={state.reactions[p.id]}
                key={p.id}
                player={p}
                board={state.board}
                index={group.indexOf(p)}
                total={group.length}
              />
            );
          })}
        {state.dice.length === 2 && (
          <group
            key={state.log.find((l) => l.text.includes("rolled"))?.id}
            position={[0, 0, 3]}
          >
            <Die x={-0.5} value={state.dice[0]} />
            <Die x={0.5} value={state.dice[1]} />
          </group>
        )}
        {quality === "ULTRA" && (
          <ContactShadows opacity={0.3} scale={40} blur={2} far={5} />
        )}
        <OrbitControls
          key={reset}
          makeDefault
          minDistance={15}
          maxDistance={65}
          maxPolarAngle={Math.PI / 2.15}
          minPolarAngle={0.2}
          enableDamping
          target={[0, 0, 0]}
        />
      </Suspense>
    </Canvas>
  );
}
