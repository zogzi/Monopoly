import { useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { State } from "../../../../packages/shared/index";
import { districts } from "../../../../packages/shared/index";
import {
  purchaseCost,
  revenue,
} from "../../../../packages/game-core/properties";
import { lotPosition } from "./geometry";
import { buildingArchitecture } from "./architecture";
import Instances, { type Block } from "./Instances";
import { serviceLocations } from "./ServiceCharacters";
export type LabelBox = { x: number; y: number; w: number; h: number };
export function placeOwnershipLabel(
  x: number,
  y: number,
  w: number,
  h: number,
  width: number,
  height: number,
  used: LabelBox[],
): LabelBox {
  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n));
  let best = { x: 0, y: 0, w, h },
    bestScore = Infinity;
  for (let ring = 0; ring < 6; ring++)
    for (let direction = 0; direction < 12; direction++) {
      const angle = (direction / 12) * Math.PI * 2;
      const box = {
        x: clamp(x - w / 2 + Math.cos(angle) * ring * 32, 8, width - w - 8),
        y: clamp(y - h - 12 + Math.sin(angle) * ring * 26, 68, height - h - 86),
        w,
        h,
      };
      const overlap = used.reduce(
        (sum, b) =>
          sum +
          Math.max(
            0,
            Math.min(box.x + w + 3, b.x + b.w) - Math.max(box.x - 3, b.x),
          ) *
            Math.max(
              0,
              Math.min(box.y + h + 3, b.y + b.h) - Math.max(box.y - 3, b.y),
            ),
        0,
      );
      const cost =
        overlap * 1000 + Math.hypot(box.x + w / 2 - x, box.y + h + 8 - y);
      if (cost < bestScore) {
        bestScore = cost;
        best = box;
      }
      if (!overlap && ring === 0) return box;
    }
  return best;
}
export default function Ownership({
  s,
  id,
  selected,
  onSelect,
}: {
  s: State;
  id: string | null;
  selected: number | null;
  onSelect: (tile: number) => void;
}) {
  const { camera, size } = useThree();
  const me = s.players.find((player) => player.id === id);
  const labels = useRef(new Map<number, HTMLButtonElement>()),
    lines = useRef(new Map<number, SVGLineElement>()),
    time = useRef(0);
  const point = useMemo(() => new THREE.Vector3(), []),
    overlayDirection = useMemo(() => new THREE.Vector3(), []),
    overlayAnchor = useRef<THREE.Group>(null),
    lastCamera = useMemo(() => new THREE.Matrix4(), []);
  const lots = useMemo(
    () =>
      s.board
        .filter((t) => ["property", "transit", "utility"].includes(t.type))
        .map((tile) => {
          const owner = s.players.find((p) => p.id === tile.owner),
            at = lotPosition(tile),
            model = buildingArchitecture(tile, 0, 0);
          const top = Math.max(
            0.7,
            ...[
              ...model.boxes,
              ...model.gables,
              ...model.spires,
              ...model.rounds,
            ].map((p) => p.at[1] + p.size[1] / 2),
          );
          return { tile, owner, at, top, color: owner?.color ?? "#dbccb6" };
        }),
    [s.board, s.players.map((p) => `${p.id}:${p.name}:${p.color}`).join("|")],
  );
  const flags = useMemo<Block[]>(
    () =>
      lots
        .filter((l) => l.owner)
        .flatMap((l) => [
          {
            at: [l.at[0] + 0.4, l.top + 0.24, l.at[1]],
            size: [0.035, 0.55, 0.035],
            color: "#e7dbc6",
          },
          {
            at: [l.at[0] + 0.59, l.top + 0.45, l.at[1]],
            size: [0.38, 0.25, 0.045],
            color: l.color,
          },
        ]),
    [lots],
  );
  const plots = useMemo<Block[]>(
    () =>
      lots
        .filter((l) => l.owner)
        .flatMap((l) => [
          {
            at: [l.at[0] - 0.83, 0.34, l.at[1]],
            size: [0.09, 0.06, 1.75],
            color: l.color,
          },
          {
            at: [l.at[0] + 0.83, 0.34, l.at[1]],
            size: [0.09, 0.06, 1.75],
            color: l.color,
          },
          {
            at: [l.at[0], 0.34, l.at[1] - 0.83],
            size: [1.75, 0.06, 0.09],
            color: l.color,
          },
          {
            at: [l.at[0], 0.34, l.at[1] + 0.83],
            size: [1.75, 0.06, 0.09],
            color: l.color,
          },
        ]),
    [lots],
  );
  useFrame((_, dt) => {
    if (overlayAnchor.current) {
      camera.getWorldDirection(overlayDirection);
      overlayAnchor.current.position
        .copy(camera.position)
        .addScaledVector(overlayDirection, 5);
    }
    time.current += dt;
    if (time.current < 0.05 && lastCamera.equals(camera.matrixWorld)) return;
    lastCamera.copy(camera.matrixWorld);
    time.current = 0;
    const used: LabelBox[] = [];
    const reserve = (x: number, y: number, z: number, w: number, h: number) => {
      point.set(x, y, z).project(camera);
      if (point.z < -1 || point.z > 1) return;
      used.push({
        x: ((point.x + 1) * size.width) / 2 - w / 2,
        y: ((1 - point.y) * size.height) / 2 - h / 2,
        w,
        h,
      });
    };
    for (const npc of serviceLocations)
      reserve(npc.at[0], npc.at[1] + 1.4, npc.at[2], 120, 40);
    for (const player of s.players)
      if (
        !player.detention &&
        !player.eliminated &&
        (player.id === id ||
          (player.id === s.players[s.current]?.id &&
            !["LOBBY", "PLANNING", "GAME_OVER", "AUCTION"].includes(s.phase)))
      ) {
        const tile = s.board[player.position];
        reserve(tile.x, 1.9, tile.z, 150, 32);
      }
    const projected = lots
      .map((lot) => {
        point.set(lot.at[0], lot.top + 0.7, lot.at[1]).project(camera);
        return {
          lot,
          x: ((point.x + 1) * size.width) / 2,
          y: ((1 - point.y) * size.height) / 2,
          z: point.z,
        };
      })
      .sort(
        (a, b) =>
          Number(b.lot.tile.id === selected) -
            Number(a.lot.tile.id === selected) ||
          Number(b.lot.owner?.id === id) - Number(a.lot.owner?.id === id) ||
          Number(!!b.lot.owner) - Number(!!a.lot.owner) ||
          a.y - b.y,
      );
    for (const p of projected) {
      const element = labels.current.get(p.lot.tile.id),
        line = lines.current.get(p.lot.tile.id);
      if (!element || !line) continue;
      const visible =
        p.z > -1 &&
        p.z < 1 &&
        p.x > -20 &&
        p.x < size.width + 20 &&
        p.y > 30 &&
        p.y < size.height - 40;
      element.style.display = line.style.display = visible ? "" : "none";
      if (!visible) continue;
      const box = placeOwnershipLabel(
        p.x,
        p.y,
        p.lot.owner ? 102 : 62,
        p.lot.owner ? 36 : 24,
        size.width,
        size.height,
        used,
      );
      used.push(box);
      element.style.transform = `translate(${box.x}px,${box.y}px)`;
      line.setAttribute("x1", String(p.x));
      line.setAttribute("y1", String(p.y));
      line.setAttribute("x2", String(box.x + box.w / 2));
      line.setAttribute("y2", String(box.y + box.h));
    }
  });
  return (
    <>
      <Instances items={flags} unlit />
      <Instances items={plots} unlit />
      <group ref={overlayAnchor}>
        <Html
          fullscreen
          calculatePosition={(_object, _camera, viewport) => [
            viewport.width / 2,
            viewport.height / 2,
          ]}
          zIndexRange={[3, 2]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className="ownership-layer"
            aria-label="Property ownership on the map"
          >
            <svg className="ownership-lines" aria-hidden="true">
              {lots.map((l) => (
                <line
                  key={l.tile.id}
                  ref={(node) => {
                    if (node) lines.current.set(l.tile.id, node);
                    else lines.current.delete(l.tile.id);
                  }}
                  stroke={l.color}
                  strokeWidth="1.25"
                />
              ))}
            </svg>
            {lots.map(({ tile, owner, color }) => (
              <button
                key={tile.id}
                ref={(node) => {
                  if (node) labels.current.set(tile.id, node);
                  else labels.current.delete(tile.id);
                }}
                role="link"
                data-owner-id={owner?.id ?? ""}
                data-property-id={tile.id}
                className={`ownership-pin ${owner ? "owned" : "for-sale"} ${owner?.id === id ? "yours" : ""}`}
                style={{ borderColor: color }}
                aria-label={`${tile.name} · ${owner ? `Owner ${owner.name}${owner.id === id ? " (you)" : ""} · Rent $${revenue(s, tile)}` : `For sale $${purchaseCost(s, tile, me)}`}`}
                onClick={() => onSelect(tile.id)}
              >
                {owner ? (
                  <>
                    <small>{tile.name}</small>
                    <b>
                      <i style={{ background: color }} />
                      {owner.id === id ? "You" : owner.name}
                    </b>
                  </>
                ) : (
                  <span>${purchaseCost(s, tile, me)}</span>
                )}
                <span className="ownership-tooltip">
                  <strong>{tile.name}</strong>
                  {districts[tile.district].name}
                  <br />
                  {owner
                    ? `${owner.name}${owner.id === id ? " (you)" : ""} · Rent $${revenue(s, tile)} · Level ${tile.level}`
                    : `City-owned · For sale $${purchaseCost(s, tile, me)}`}
                </span>
              </button>
            ))}
          </div>
        </Html>
      </group>
    </>
  );
}
