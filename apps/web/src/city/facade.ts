import type { Block } from "./Instances";

export type FacadeParts = { boxes: Block[]; lights: Block[]; glows: Block[] };
export type WindowStyle = {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  facing?: number;
  lit?: boolean;
  tint?: string;
  frame?: string;
  shutters?: boolean;
  bars?: boolean;
  seed?: number;
  tile?: number;
};
/** Framed panes and soft wall spill share the existing city batches. No light per window. */
export function facadeWindow(parts: FacadeParts, w: WindowStyle) {
  const facing = w.facing ?? 0,
    sin = Math.sin(facing),
    cos = Math.cos(facing);
  const add = (
    list: Block[],
    dx: number,
    dy: number,
    depth: number,
    size: Block["size"],
    color: string,
  ) =>
    list.push({
      at: [
        w.x + dx * cos + depth * sin,
        w.y + dy,
        w.z - dx * sin + depth * cos,
      ],
      size,
      color,
      rotation: facing,
      tile: w.tile,
    });
  const lit = w.lit ?? (w.seed ?? 0) % 5 !== 0;
  const trim = w.frame ?? "#c6ac9f",
    tint = w.tint ?? "#ffd296";
  add(parts.boxes, 0, 0, 0, [w.width + 0.08, w.height + 0.08, 0.05], "#352b46");
  add(
    lit ? parts.lights : parts.boxes,
    0,
    0,
    0.031,
    [w.width, w.height, 0.015],
    lit ? tint : "#4b4968",
  );
  for (const side of [-1, 1]) {
    add(
      parts.boxes,
      side * (w.width / 2 + 0.022),
      0,
      0.05,
      [0.035, w.height + 0.1, 0.045],
      trim,
    );
    add(
      parts.boxes,
      0,
      side * (w.height / 2 + 0.023),
      0.05,
      [w.width + 0.1, 0.035, 0.045],
      trim,
    );
    if (w.shutters) {
      add(
        parts.boxes,
        side * (w.width / 2 + 0.085),
        0,
        0.025,
        [0.085, w.height + 0.04, 0.035],
        (w.seed ?? 0) % 2 ? "#825e78" : "#66748b",
      );
      for (const y of [-0.06, 0.04])
        add(
          parts.boxes,
          side * (w.width / 2 + 0.085),
          y,
          0.047,
          [0.07, 0.012, 0.008],
          "#b1a0ae",
        );
    }
  }
  add(parts.boxes, 0, 0, 0.056, [0.018, w.height, 0.025], "#705966");
  add(parts.boxes, 0, 0.015, 0.056, [w.width, 0.016, 0.025], "#705966");
  add(
    parts.boxes,
    0,
    -w.height / 2 - 0.045,
    0.065,
    [w.width + 0.15, 0.045, 0.13],
    trim,
  );
  if (lit) {
    // Curtains and an inner ledge suggest an occupied room instead of a flat neon rectangle.
    if ((w.seed ?? 0) % 3 === 1)
      add(
        parts.boxes,
        -w.width * 0.35,
        0,
        0.044,
        [w.width * 0.18, w.height, 0.012],
        "#b98c8b",
      );
    add(parts.glows, 0, 0, 0.087, [w.width * 2.4, w.height * 2.2, 1], tint);
  }
  if (w.bars)
    for (let i = -1; i <= 1; i++)
      add(
        parts.boxes,
        i * w.width * 0.28,
        0,
        0.09,
        [0.025, w.height + 0.04, 0.035],
        "#302b3b",
      );
}

export function groundGlow(
  parts: FacadeParts,
  x: number,
  z: number,
  size: [number, number],
  tint = "#e8a969",
  tile?: number,
  y = 0.35,
) {
  parts.glows.push({
    at: [x, y, z],
    size: [size[0], size[1], 1],
    color: tint,
    rotationX: -Math.PI / 2,
    tile,
  });
}
