import type { State, Tile } from "../../../../packages/shared/index";
import { buildingArchitecture } from "./architecture";
import { districts } from "../../../../packages/shared/index";
import type { Block } from "./Instances";
export function lotPosition(t: Tile): [number, number] {
  const r = Math.hypot(t.x, t.z) || 1;
  return [t.x + (t.x / r) * 1.1, t.z + (t.z / r) * 1.1];
}
export function cityBlocks(s: State) {
  const parts: Block[] = [];
  const box = (
    at: Block["at"],
    size: Block["size"],
    color: string,
    tile?: number,
    rotation = 0,
  ) => parts.push({ at, size, color, tile, rotation });
  for (const t of s.board) {
    for (const id of t.next) {
      const b = s.board[id],
        distance = Math.hypot(t.x - b.x, t.z - b.z),
        angle = Math.atan2(b.x - t.x, b.z - t.z);
      box(
        [(t.x + b.x) / 2, 0.17, (t.z + b.z) / 2],
        [0.7, 0.04, distance],
        "#45405f",
        undefined,
        angle,
      );
      for (let i = 0; i < Math.floor(distance / 0.7); i++) {
        const f = (i + 0.5) / Math.floor(distance / 0.7);
        box(
          [t.x + (b.x - t.x) * f, 0.195, t.z + (b.z - t.z) * f],
          [0.035, 0.009, 0.27],
          "#bbb1ce",
          undefined,
          angle,
        );
      }
    }
    const [x, z] = lotPosition(t),
      accent = districts[t.district].color,
      owner = s.players.find((p) => p.id === t.owner)?.color;
    box([x, 0.22, z], [1.46, 0.12, 1.46], "#7f7193", t.id);
    box([x, 0.3, z + 0.67], [1.4, 0.04, 0.07], owner || accent, t.id);
  }
  for (const part of parts)
    if (part.color === "#ffca7b" || part.color === "#ffc17a") part.glow = true;
  return parts;
}
export function treeBlocks() {
  const parts: Block[] = [];
  for (let i = 0; i < 48; i++) {
    const a = i * 2.39996,
      r = 6 + ((i * 17) % 37) / 10,
      x = Math.sin(a) * r,
      z = Math.cos(a) * r; // Keep trees clear of the four diagonal inner streets.
    if (Math.abs(Math.abs(x) - Math.abs(z)) < 1.1) continue;
    parts.push(
      { at: [x, 0.43, z], size: [0.09, 0.55, 0.09], color: "#8c6b78" },
      {
        at: [x, 0.85, z],
        size: [0.48 + (i % 3) * 0.08, 0.58, 0.48],
        color: ["#c1754a", "#9b648c", "#cb9550"][i % 3],
        rotation: a,
      },
    );
  }
  return parts;
}

export function districtBuildings(s: State) {
  const result = {
    boxes: [] as Block[],
    gables: [] as Block[],
    spires: [] as Block[],
    rounds: [] as Block[],
    lights: [] as Block[],
  };
  for (const tile of s.board) {
    const [x, z] = lotPosition(tile);
    const model = buildingArchitecture(tile, x, z);
    for (const key of [
      "boxes",
      "gables",
      "spires",
      "rounds",
      "lights",
    ] as const)
      result[key].push(...model[key]);
  }
  return result;
}
