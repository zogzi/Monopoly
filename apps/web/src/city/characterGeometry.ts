import { character } from "../../../../packages/shared/index";
import type { Block } from "./Instances";
/** Small, cached instance batches preserve each person's silhouette without one draw per body part. */
const cache = new Map<
  string,
  { boxes: Block[]; balls: Block[]; cones: Block[] }
>();
export function characterGeometry(id: string) {
  const cached = cache.get(id);
  if (cached) return cached;
  const c = character(id),
    s = c.style,
    w = s === "flower" ? 0.44 : s === "fur" ? 0.38 : 0.3;
  const boxes: Block[] = [],
    balls: Block[] = [],
    cones: Block[] = [];
  const part = (at: Block["at"], size: Block["size"], color: string) =>
    boxes.push({ at, size, color });
  const ball = (at: Block["at"], r: number, color: string) =>
    balls.push({ at, size: [r * 2, r * 2, r * 2], color });
  const cone = (at: Block["at"], size: Block["size"], color: string) =>
    cones.push({ at, size, color });
  part([-0.12, -0.28, 0], [0.14, 0.3, 0.17], "#30283f");
  part([0.12, -0.28, 0], [0.14, 0.3, 0.17], "#30283f");
  part([0, 0.02, 0], [w, 0.43, 0.25], c.coat);
  part([-w / 2 - 0.06, 0.01, 0], [0.12, 0.34, 0.16], c.coat);
  part([w / 2 + 0.06, 0.01, 0], [0.12, 0.34, 0.16], c.coat);
  ball([0, 0.42, 0], s === "flower" ? 0.27 : 0.23, c.skin);
  ball([0, 0.52, -0.06], 0.23, c.hair);
  part([0, 0.38, 0.19], [0.28, 0.2, 0.08], c.skin);
  for (const x of [-0.085, 0.085])
    part([x, 0.43, 0.24], [0.035, 0.045, 0.025], "#211a32");
  if (s === "pilot") {
    part([0, 0.21, 0.16], [0.39, 0.1, 0.08], "#ffe0a0");
    part([0.21, 0.11, -0.12], [0.35, 0.09, 0.1], "#ffe0a0");
    part([0, 0.51, 0.18], [0.35, 0.08, 0.06], "#4b405a");
  }
  if (s === "tophat") {
    part([0, 0.68, 0], [0.58, 0.07, 0.42], "#2c203f");
    part([0, 0.88, 0], [0.34, 0.38, 0.3], "#2c203f");
    part([0, 0.75, 0.01], [0.35, 0.06, 0.31], "#e9ae47");
    part([0, 0.32, 0.25], [0.25, 0.05, 0.05], "#e2d4c4");
  }
  if (s === "widehat") {
    ball([0, 0.66, 0], 0.48, "#513269");
    balls[balls.length - 1].size[1] = 0.07;
    cone([0, 0.8, 0], [0.54, 0.3, 0.54], "#513269");
    part([0, -0.05, -0.16], [0.45, 0.65, 0.04], "#513269");
  }
  if (s === "flower") {
    ball([0.19, 0.6, 0.11], 0.13, "#ffcd67");
    ball([0.25, 0.53, 0.16], 0.1, "#ffcd67");
    ball([0.16, 0.5, 0.2], 0.1, "#ffcd67");
    ball([0.2, 0.55, 0.23], 0.05, "#f1687e");
  }
  if (s === "afro") {
    for (const n of [-1, 0, 1])
      ball([n * 0.17, 0.68 - Math.abs(n) * 0.05, -0.02], 0.2, c.hair);
    part([0, 0.1, 0.16], [0.1, 0.23, 0.03], "#ffcc63");
  }
  if (s === "fur") {
    ball([-0.16, 0.18, 0], 0.14, "#fff3e9");
    ball([0.16, 0.18, 0], 0.14, "#fff3e9");
    part([0, -0.15, 0], [0.46, 0.25, 0.3], c.coat);
    part([-0.18, 0.45, -0.05], [0.11, 0.38, 0.2], c.hair);
  }
  if (s === "goggles") {
    for (const x of [-0.12, 0.12]) {
      ball([x, 0.51, 0.22], 0.1, "#e9b866");
      ball([x, 0.51, 0.29], 0.065, "#5267a5");
    }
    part([0, 0.01, -0.24], [0.33, 0.4, 0.2], "#745274");
  }
  if (s === "star") {
    part([0, -0.12, 0], [0.46, 0.3, 0.31], c.coat);
    ball([-0.2, 0.44, -0.06], 0.18, c.hair);
    ball([0.2, 0.44, -0.06], 0.18, c.hair);
    cone([0.23, 0.67, 0.08], [0.28, 0.28, 0.2], "#ffce68");
  }
  if (s === "bun") {
    ball([0, 0.78, -0.08], 0.14, c.hair);
    part([0, 0.2, 0.15], [0.08, 0.2, 0.04], "#eee5de");
    part([0, 0.43, 0.255], [0.31, 0.07, 0.025], "#493f5f");
  }
  if (s === "cap") {
    ball([0, 0.61, -0.02], 0.25, "#f1ca4e");
    part([0.1, 0.58, 0.23], [0.42, 0.06, 0.22], "#f1ca4e");
    part([0, 0.06, 0.15], [0.16, 0.16, 0.04], "#fff1c7");
  }
  const result = { boxes, balls, cones };
  cache.set(id, result);
  return result;
}
