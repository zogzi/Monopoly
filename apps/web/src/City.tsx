import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { type State } from "../../../packages/shared/index";
import type { ServiceId } from "../../../packages/shared/content";
import ServiceCharacters from "./city/ServiceCharacters";
import Prison, { custodyPosition } from "./city/Prison";
import Traffic from "./city/Traffic";
import Storm from "./city/Storm";
import CityLife from "./city/CityLife";
import RouteMarkers from "./city/RouteMarkers";
import Water from "./city/Water";
import Halloween from "./city/Halloween";
import Instances from "./city/Instances";
import {
  cityBlocks,
  districtBuildings,
  treeBlocks,
  lotPosition,
} from "./city/geometry";
import { Token } from "./city/Token";
import AuctionBeacon from "./city/AuctionBeacon";
import PropertyEffects from "./city/PropertyEffects";
function CameraReset({ reset }: { reset: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const fit = Math.max(1, 1.05 / (size.width / size.height));
    camera.position.set(30 * fit, 32 * fit, 35 * fit);
    camera.lookAt(2, 0, -1);
  }, [reset, camera, size.width, size.height]);
  return null;
}
function FocusCamera({
  focus,
  s,
}: {
  focus: { tile: number; request: number; playerId?: string } | null;
  s: State;
}) {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (!focus) return;
    const p = s.players.find((p) => p.id === focus.playerId);
    const tile = s.board[focus.tile];
    const [x, z] = p?.detention ? custodyPosition(s, p.id) : [tile.x, tile.z];
    camera.position.set(x + 9, 10, z + 13);
    camera.lookAt(x, 0, z);
    const orbit = controls as unknown as {
      target?: THREE.Vector3;
      update?: () => void;
    };
    orbit?.target?.set(x, 0, z);
    orbit?.update?.();
  }, [focus, camera, controls]);
  return null;
}
function AdaptiveResolution({ quality }: { quality: string }) {
  const { setDpr } = useThree();
  const frames = useRef({ time: 0, count: 0, dpr: 1 });
  useEffect(() => {
    const dpr = quality === "LOW" ? 0.75 : quality === "HIGH" ? 1.5 : 1;
    frames.current = { time: 0, count: 0, dpr };
    setDpr(dpr);
  }, [quality, setDpr]);
  useFrame((_, dt) => {
    if (quality !== "AUTO" || dt > 1) return;
    const f = frames.current;
    f.time += dt;
    f.count++;
    if (f.time >= 4) {
      const fps = f.count / f.time,
        next =
          fps < 35
            ? Math.max(0.7, f.dpr - 0.1)
            : fps > 55
              ? Math.min(1.3, f.dpr + 0.05)
              : f.dpr;
      if (next !== f.dpr) {
        f.dpr = next;
        setDpr(next);
      }
      f.time = 0;
      f.count = 0;
    }
  });
  return null;
}
function Scene({
  state,
  selected,
  onSelect,
  quality,
  reset,
  localPlayerId,
  onPlayerSelect,
  storm,
  focus,
  onServiceSelect,
}: {
  state: State;
  selected: number | null;
  onSelect: (id: number) => void;
  quality: string;
  reset: number;
  localPlayerId: string | null;
  onPlayerSelect: (id: string) => void;
  storm: boolean;
  focus: { tile: number; request: number; playerId?: string } | null;
  onServiceSelect: (id: ServiceId) => void;
}) {
  const [escorting, setEscorting] = useState<string | null>(null);
  useEffect(() => {
    if (!state.lastEscort || state.simulation.speed === "FAST") return;
    setEscorting(state.lastEscort.playerId);
    const timer = setTimeout(() => setEscorting(null), 4000);
    return () => clearTimeout(timer);
  }, [state.lastEscort?.id]);
  const [hovered, setHovered] = useState<number | null>(null);
  // Player balances and connection changes don't change city geometry.
  const ownerPalette = state.players.map((p) => `${p.id}:${p.color}`).join("|");
  const blocks = useMemo(() => cityBlocks(state), [state.board, ownerPalette]);
  const buildings = useMemo(() => districtBuildings(state), [state.board]);
  const solid = useMemo(() => blocks.filter((b) => !b.glow), [blocks]);
  const windows = useMemo(() => blocks.filter((b) => b.glow), [blocks]);
  const trees = useMemo(() => treeBlocks(), []);
  const trunks = useMemo(() => trees.filter((_, i) => i % 2 === 0), [trees]);
  const leaves = useMemo(() => trees.filter((_, i) => i % 2 === 1), [trees]);
  const { gl } = useThree();
  const renderSample = useRef(0);
  useEffect(() => {
    gl.domElement.dataset.escorting = escorting ?? "";
  }, [gl, escorting]);
  useFrame(() => {
    if (++renderSample.current % 60 === 0) {
      gl.domElement.dataset.drawCalls = String(gl.info.render.calls);
      gl.domElement.dataset.playerCount = String(state.players.length);
      gl.domElement.dataset.triangles = String(gl.info.render.triangles);
    }
  });
  const shadowKey = state.board.map((t) => `${t.owner}:${t.level}`).join("|");
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
  }, [gl, shadowKey, quality]);
  const target = hovered ?? selected;
  const selectedTile = target === null ? null : state.board[target];
  const selectedAt = selectedTile ? lotPosition(selectedTile) : null;
  const reduced = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  return (
    <>
      <color attach="background" args={["#27213f"]} />
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#d4c0ff", "#52416d", 1.1]} />
      <directionalLight
        position={[-10, 25, 12]}
        intensity={1.7}
        color="#ffe4ca"
        castShadow={quality === "HIGH"}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-19}
        shadow-camera-right={19}
        shadow-camera-top={19}
        shadow-camera-bottom={-19}
        shadow-bias={-0.0008}
      />
      <mesh position={[0, -0.35, 0]} receiveShadow>
        <cylinderGeometry args={[16.2, 16.5, 0.6, 96]} />
        <meshStandardMaterial color="#716083" />
      </mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[16, 16, 0.12, 96]} />
        <meshStandardMaterial color="#665976" />
      </mesh>
      <Water reduced={reduced} />
      <Instances
        items={solid}
        onSelect={onSelect}
        onHover={setHovered}
        shadows={quality === "HIGH"}
      />
      <Instances
        items={windows}
        unlit
        onSelect={onSelect}
        onHover={setHovered}
      />
      <Instances
        items={buildings.boxes}
        onSelect={onSelect}
        onHover={setHovered}
        shadows={quality === "HIGH"}
      />
      <Instances items={buildings.gables} shape="gable" onSelect={onSelect} />
      <Instances items={buildings.spires} shape="cone" onSelect={onSelect} />
      <Instances items={buildings.rounds} shape="sphere" onSelect={onSelect} />
      <Instances items={buildings.lights} unlit onSelect={onSelect} />
      <Instances items={trunks} />
      <Instances items={leaves} shape="sphere" />
      <Halloween state={state} quality={quality} reduced={reduced} />
      <Storm active={storm} quality={quality} reduced={reduced} />
      <CityLife board={state.board} quality={quality} reduced={reduced} />
      <ServiceCharacters onSelect={onServiceSelect} />
      <AuctionBeacon s={state} reduced={reduced} />
      <PropertyEffects s={state} reduced={reduced} />
      <Prison s={state} reduced={reduced} />
      {!reduced && quality !== "LOW" && (
        <Traffic count={quality === "HIGH" ? 12 : 6} />
      )}
      {selectedTile && selectedAt && (
        <group position={[selectedAt[0], 0.32, selectedAt[1]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 1.03, 40]} />
            <meshBasicMaterial color="#ffe6b1" side={THREE.DoubleSide} />
          </mesh>
          <Html center position={[0, 1.8 + selectedTile.level * 0.5, 0]}>
            <div className="map-label">{selectedTile.name}</div>
          </Html>
        </group>
      )}
      <RouteMarkers s={state} id={localPlayerId} />
      {state.players
        .filter((p) => !p.eliminated)
        .map((p) => {
          const group = state.players.filter(
            (q) => q.position === p.position && !q.eliminated,
          );
          return (
            <Token
              instant={state.simulation.speed === "FAST"}
              custodyAt={p.detention ? custodyPosition(state, p.id) : undefined}
              hidden={!!p.detention && escorting === p.id}
              key={p.id}
              showLabel={
                p.id === localPlayerId ||
                p.id === state.players[state.current]?.id
              }
              onInspect={onPlayerSelect}
              isLocal={p.id === localPlayerId}
              isCurrent={
                p.id === state.players[state.current]?.id &&
                !["LOBBY", "PLANNING", "GAME_OVER", "AUCTION"].includes(
                  state.phase,
                )
              }
              player={p}
              board={state.board}
              index={group.indexOf(p)}
              total={group.length}
              movement={
                state.players[state.current]?.id === p.id ? state.path : []
              }
              reaction={state.reactions[p.id]}
            />
          );
        })}
      <CameraReset reset={reset} />
      <FocusCamera focus={focus} s={state} />
      <AdaptiveResolution quality={quality} />
      <OrbitControls
        key={reset}
        makeDefault
        minDistance={18}
        maxDistance={125}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={0.2}
        enableDamping
        target={[2, 0, -1]}
      />
    </>
  );
}
export default memo(function City(props: {
  state: State;
  selected: number | null;
  onSelect: (id: number) => void;
  quality: string;
  reset: number;
  localPlayerId: string | null;
  onPlayerSelect: (id: string) => void;
  storm: boolean;
  focus: { tile: number; request: number; playerId?: string } | null;
  onServiceSelect: (id: ServiceId) => void;
}) {
  return (
    <Canvas
      shadows={props.quality === "HIGH"}
      dpr={1}
      camera={{ position: [26, 29, 31], fov: 41 }}
      gl={{
        antialias: props.quality !== "LOW",
        powerPreference: "high-performance",
      }}
    >
      <Scene {...props} />
    </Canvas>
  );
});
