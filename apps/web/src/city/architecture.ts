import type { Tile } from "../../../../packages/shared/index";
import type { Block } from "./Instances";
import { facadeWindow, groundGlow } from "./facade";
export const architectureNames = [
  "Dock warehouses",
  "Brick townhouses",
  "Theaters and arenas",
  "Glass research campuses",
  "Art Deco skyscrapers",
  "Garden terraces",
  "Luxury residences",
  "Civic monuments",
];
export type Architecture = {
  boxes: Block[];
  gables: Block[];
  spires: Block[];
  rounds: Block[];
  lights: Block[];
  glows: Block[];
};
export function buildingArchitecture(
  t: Tile,
  x: number,
  z: number,
): Architecture {
  const a: Architecture = {
    boxes: [],
    gables: [],
    spires: [],
    rounds: [],
    lights: [],
    glows: [],
  };
  const variant = ((t.id % 5) + 3) % 4;
  const h = 0.75 + t.level * 0.65;
  const add = (
    list: Block[],
    dx: number,
    y: number,
    dz: number,
    size: Block["size"],
    color: string,
    rotation = 0,
  ) =>
    list.push({ at: [x + dx, y, z + dz], size, color, tile: t.id, rotation });
  const box = (
    dx: number,
    y: number,
    dz: number,
    w: number,
    height: number,
    depth: number,
    color: string,
  ) => add(a.boxes, dx, y, dz, [w, height, depth], color);
  const glow = (
    dx: number,
    y: number,
    dz: number,
    w: number,
    height: number,
    depth: number,
    color = "#ffd49a",
  ) => add(a.lights, dx, y, dz, [w, height, depth], color);
  const roof = (
    y: number,
    w: number,
    depth: number,
    color: string,
    dx = 0,
    dz = 0,
  ) => add(a.gables, dx, y, dz, [w, 0.5, depth], color);
  const sphere = (
    dx: number,
    y: number,
    dz: number,
    scale: Block["size"],
    color: string,
  ) => add(a.rounds, dx, y, dz, scale, color);
  const windows = (
    width: number,
    height: number,
    front: number,
    columns = 3,
  ) => {
    for (let level = 0.95; level < height - 0.1; level += 0.4)
      for (let j = 0; j < columns; j++)
        facadeWindow(a, {
          x: x - width / 2 + (width * (j + 0.5)) / columns,
          y: level,
          z: z + front,
          width: Math.min(0.22, (width / columns) * 0.46),
          height: 0.24,
          seed: t.id + j + Math.round(level * 10),
          tile: t.id,
          shutters: t.district === 1,
        });
  };
  if (t.type === "transit") {
    box(0, 0.5, 0, 1.25, 0.4, 0.8, "#7887aa");
    roof(0.99, 1.5, 0.95, "#6875b0");
    box(0, 0.3, 0.4, 1.45, 0.1, 0.5, "#c0b7d0");
    glow(0, 0.57, 0.41, 0.9, 0.18, 0.02, "#e4d4ff");
    for (const side of [-1, 1]) {
      facadeWindow(a, {
        x: x + side * 0.64,
        y: 0.53,
        z,
        width: 0.24,
        height: 0.18,
        facing: (side * Math.PI) / 2,
        tint: "#ffe1ae",
        seed: t.id,
        tile: t.id,
      });
      box(side * 0.46, 0.28, 0.66, 0.24, 0.12, 0.09, "#504156");
      box(side * 0.64, 0.75, 0.44, 0.025, 0.6, 0.025, "#bba88f");
      glow(side * 0.64, 1.05, 0.44, 0.12, 0.13, 0.12);
    }
    for (const dx of [-0.28, 0, 0.28])
      box(dx, 0.57, 0.43, 0.025, 0.22, 0.03, "#74637f");
    groundGlow(a, x, z + 0.75, [1.1, 0.65], "#e4bc87", t.id);
    return a;
  }
  if (t.type === "utility") {
    box(-0.25, 0.8, 0, 0.65, 1, 0.85, "#6e6f88");
    box(0.35, 1.1, 0, 0.35, 1.7, 0.5, "#9c8eaf");
    glow(-0.25, 0.9, 0.44, 0.45, 0.32, 0.02, "#b9b9ff");
    sphere(0.35, 2, 0, [0.6, 0.4, 0.6], "#a4afd9");
    for (let i = 0; i < 4; i++)
      box(-0.25, 0.55 + i * 0.12, 0.451, 0.45, 0.028, 0.025, "#49516e");
    facadeWindow(a, {
      x: x - 0.59,
      y: 1.03,
      z: z + 0.07,
      width: 0.24,
      height: 0.25,
      facing: -Math.PI / 2,
      tint: "#bbceff",
      seed: t.id,
      tile: t.id,
    });
    box(0.35, 1.72, -0.05, 0.45, 0.08, 0.6, "#b4a7b9");
    return a;
  }
  switch (t.district) {
    case 0: // Waterfront loading bays, sawtooth sheds, a gantry and stacked containers.
      box(0, 0.35 + h / 2, 0, 1.25, h, 1.05, "#a18087");
      roof(0.6 + h, 1.45, 1.25, "#5877a5");
      box(0, 0.55, 0.54, 0.6, 0.55, 0.05, "#414b72");
      for (const side of [-1, 1])
        facadeWindow(a, {
          x: x + side * 0.43,
          y: 0.76,
          z: z + 0.54,
          width: 0.17,
          height: 0.23,
          seed: t.id + side,
          tile: t.id,
        });
      for (let i = 0; i < 4; i++)
        box(0, 0.35 + i * 0.12, 0.575, 0.57, 0.018, 0.025, "#8b879d");
      if (variant === 0) {
        box(-0.6, 1.25 + h, 0, 0.07, 1.3, 0.08, "#ceb079");
        box(0, 1.85 + h, 0, 1.3, 0.07, 0.08, "#ceb079");
        box(0.5, 1.5 + h, 0, 0.035, 0.7, 0.035, "#ddd0ad");
      } else if (variant === 1) {
        box(0.3, h + 0.8, -0.2, 0.35, 0.55, 0.5, "#87a1bd");
        glow(0.3, h + 0.85, 0.06, 0.25, 0.25, 0.02);
      } else if (variant === 2) {
        box(0, 0.55, 0.6, 1.1, 0.12, 0.5, "#92a7c5");
      } else
        for (let i = 0; i < 2; i++)
          box(
            -0.3 + i * 0.6,
            0.4,
            0.7,
            0.5,
            0.2,
            0.23,
            i ? "#db9d75" : "#6c8ea6",
          );
      break;
    case 1: // Narrow brick facades, steep gables, dormers, chimneys and café awnings.
      box(
        0,
        0.3 + h * 0.65,
        0,
        1.08,
        h * 1.3,
        0.94,
        ["#af7e78", "#bc9187", "#917786", "#c0957e"][variant],
      );
      roof(0.6 + h * 1.3, 1.32, 1.18, "#644967");
      windows(0.9, 0.3 + h * 1.3, 0.48, 2);
      box(0, 0.55, 0.49, 0.27, 0.5, 0.035, "#4d3a55");
      box(0.4, 0.9 + h * 1.3, -0.2, 0.15, 0.6, 0.18, "#a7797e");
      if (variant % 2 === 0) {
        box(0, 0.8, 0.64, 1.15, 0.14, 0.42, "#e5baa1");
        for (let i = 0; i < 4; i++)
          box(-0.45 + i * 0.3, 0.79, 0.85, 0.14, 0.14, 0.03, "#a55d73");
      } else {
        box(0.2, 0.6 + h * 1.3, 0.42, 0.35, 0.35, 0.25, "#bf9c9b");
        roof(0.85 + h * 1.3, 0.45, 0.38, "#6d4e70", 0.2, 0.42);
      }
      break;
    case 2: // One circular arena and three theaters with oversized neon marquees.
      if (variant === 2) {
        sphere(0, 0.65, 0, [1.4, 0.85, 1.2], "#976992");
        box(0, 0.35, 0, 1.3, 0.2, 1, "#c58fa6");
        glow(0, 0.55, 0.6, 1.1, 0.12, 0.035, "#ff96bf");
      } else {
        box(0, 0.3 + h / 2, 0, 1.3, h, 1.04, "#856483");
        box(0, 0.65 + h, 0, 1.45, 0.65, 0.22, "#b56b97");
        glow(0, 0.65 + h, 0.12, 1.1, 0.13, 0.025, "#ffc77f");
        box(0, 0.7, 0.62, 1.4, 0.16, 0.46, "#bd7b9b");
        windows(1.05, h, 0.53, 4);
      }
      for (let i = 0; i < 5; i++)
        glow(-0.48 + i * 0.24, 0.8, 0.87, 0.05, 0.06, 0.035, "#ffe7a5");
      break;
    case 3: // Offset glass volumes, cantilevers and elevated laboratory bridges.
      box(-0.28, 0.35 + h * 0.6, 0, 0.68, h * 1.2, 0.85, "#91aacb");
      box(0.38, 0.8 + h * 0.7, -0.05, 0.6, h * 0.9, 0.85, "#b0c5df");
      box(0, 0.7 + h, 0.06, 1.42, 0.13, 1.12, "#d0d6e3");
      for (let y = 0.55; y < h + 0.7; y += 0.3) {
        glow(-0.28, y, 0.44, 0.52, 0.075, 0.018, "#a6c9ff");
        glow(0.38, y + 0.4, 0.39, 0.45, 0.075, 0.018, "#c7b9ff");
      }
      if (variant % 2 === 0) {
        sphere(0.35, 1.3 + h, -0.05, [0.5, 0.17, 0.5], "#b6c8e2");
        box(0.35, 1.55 + h, -0.05, 0.035, 0.4, 0.035, "#cee0ef");
      } else box(-0.2, 1.25 + h, 0, 0.35, 0.45, 0.35, "#6a80ab");
      break;
    case 4: {
      // Financial Art Deco towers: fluted bases, setbacks and a brass spire.
      const height = 1.7 + h + variant * 0.2;
      box(0, height / 2 + 0.3, 0, 1.1, height, 0.95, "#9f97af");
      box(0, height + 0.48, 0, 0.83, 0.35, 0.72, "#bba0ab");
      box(0, height + 0.85, 0, 0.5, 0.45, 0.48, "#c1a77b");
      for (const side of [-1, 1])
        for (const px of [0.22, 0.47])
          box(
            side * px,
            height / 2 + 0.3,
            0.49,
            0.045,
            height,
            0.035,
            "#e0bb7a",
          );
      windows(0.85, height + 0.2, 0.49, 3);
      add(a.spires, 0, height + 1.35, 0, [0.3, 0.75, 0.3], "#e1c18d");
      break;
    }
    case 5: // Stepped eco terraces with accessible roofs, planters and solar panels.
      for (let step = 0; step < 3; step++) {
        const y = 0.35 + (step + 1) * (h * 0.35 + 0.15);
        box(
          -0.12 * step,
          y / 2 + 0.2,
          -0.12 * step,
          1.35 - step * 0.25,
          y,
          0.95 - step * 0.12,
          "#b7afba",
        );
        box(
          -0.12 * step,
          y + 0.27,
          -0.12 * step,
          1.45 - step * 0.25,
          0.09,
          1.05 - step * 0.12,
          "#817d8e",
        );
        sphere(
          0.45 - step * 0.22,
          y + 0.45,
          0.35 - step * 0.14,
          [0.28, 0.24, 0.25],
          "#8f9a88",
        );
      }
      box(-0.25, 1.1 + h, 0, 0.6, 0.055, 0.42, "#4f6287");
      glow(0, 0.6, 0.49, 0.8, 0.22, 0.018);
      break;
    case 6: {
      // Luxury residences: broad balconies, corner glazing and roof amenities.
      const height = 1.35 + h + variant * 0.17;
      box(0, height / 2 + 0.25, 0, 0.88, height, 0.86, "#c8bbce");
      for (let y = 0.55; y < height + 0.2; y += 0.38) {
        box(0, y, 0.09, 1.3, 0.07, 1.18, "#e0cbd0");
        glow(
          0,
          y + 0.17,
          0.44,
          0.75,
          0.19,
          0.018,
          Math.round(y * 10 + t.id) % 3 ? "#ffd5aa" : "#c5d1ff",
        );
        for (const dx of [-0.25, 0, 0.25])
          box(dx, y + 0.17, 0.46, 0.022, 0.2, 0.025, "#89778e");
        box(0, y + 0.31, 0.66, 1.16, 0.025, 0.025, "#a88f9c");
        for (const dx of [-0.54, -0.18, 0.18, 0.54])
          box(dx, y + 0.18, 0.66, 0.018, 0.25, 0.018, "#a88f9c");
      }
      box(0, height + 0.3, 0, 1.2, 0.08, 1.05, "#b5a0bb");
      if (variant % 2 === 0)
        sphere(0, height + 0.36, 0, [0.7, 0.08, 0.45], "#7facc5");
      else {
        glow(0, height + 0.35, 0, 0.5, 0.015, 0.08, "#e7d8cc");
        glow(0, height + 0.35, 0, 0.08, 0.015, 0.5, "#e7d8cc");
      }
      break;
    }
    case 7: // Civic colonnades, classical pediments, domes and a clock-tower variant.
      box(0, 0.4, 0, 1.5, 0.24, 1.2, "#c9b5b6");
      box(0, 0.55 + h / 2, -0.1, 1.15, h, 0.85, "#bba5b6");
      for (let col = 0; col < 4; col++) {
        box(-0.52 + col * 0.35, 0.55 + h / 2, 0.53, 0.12, h, 0.12, "#e2cfbe");
        box(-0.52 + col * 0.35, 0.53 + h, 0.53, 0.21, 0.12, 0.22, "#dfc3b3");
      }
      roof(0.85 + h, 1.55, 1.25, "#9d779c");
      glow(0, 0.9, 0.34, 0.3, 0.4, 0.02);
      if (variant === 1) {
        box(0, 1.2 + h, 0, 0.55, 0.7, 0.55, "#bea5b1");
        sphere(0, 1.25 + h, 0.29, [0.3, 0.3, 0.02], "#ffe0a1");
        add(a.spires, 0, 1.85 + h, 0, [0.8, 0.6, 0.8], "#76547e");
      } else if (variant === 3)
        sphere(0, 1.05 + h, 0, [0.8, 0.65, 0.8], "#d1b68f");
      break;
  }
  // Side and rear facades matter when players orbit the map or inspect a building.
  const sideWindows = (
    halfWidth: number,
    halfDepth: number,
    top: number,
    bottom = 0.72,
    columns = 2,
    tint = "#ffd29b",
    dz = 0,
  ) => {
    for (let y = bottom, row = 0; y < top - 0.13; y += 0.44, row++) {
      for (let col = 0; col < columns; col++) {
        const alongX =
          (col - (columns - 1) / 2) * ((halfWidth * 1.25) / columns);
        facadeWindow(a, {
          x: x + alongX,
          y,
          z: z + dz - halfDepth - 0.012,
          width: 0.18,
          height: 0.24,
          facing: Math.PI,
          seed: t.id + row * 3 + col,
          tint,
          shutters: t.district === 1,
          tile: t.id,
        });
        for (const side of [-1, 1])
          facadeWindow(a, {
            x: x + side * (halfWidth + 0.012),
            y,
            z: z + dz + (col - (columns - 1) / 2) * halfDepth * 0.9,
            width: 0.17,
            height: 0.24,
            facing: (side * Math.PI) / 2,
            seed: t.id + row * 5 + col + side,
            tint,
            shutters: t.district === 1,
            tile: t.id,
          });
      }
    }
  };
  switch (t.district) {
    case 0:
      sideWindows(0.625, 0.525, 0.35 + h, 0.76);
      box(0, 0.34, 0.83, 0.8, 0.08, 0.3, "#ad9395");
      for (const side of [-1, 1])
        box(side * 0.62, 0.43, 0.8, 0.06, 0.24, 0.06, "#cfaa6f");
      break;
    case 1: {
      const top = 0.3 + h * 1.3,
        roofY = 0.6 + h * 1.3;
      sideWindows(0.54, 0.47, top);
      box(0, roofY + 0.255, 0, 0.07, 0.055, 1.23, "#92748e");
      for (const side of [-1, 1])
        box(side * 0.6, top + 0.07, 0, 0.035, 0.04, 1.22, "#a08c9d");
      for (let y = 0.45; y < top; y += 0.22)
        box(0, y, -0.486, 1.07, 0.012, 0.012, "#9e767a");
      facadeWindow(a, {
        x,
        y: roofY,
        z: z + 0.61,
        width: 0.12,
        height: 0.12,
        seed: 1,
        tile: t.id,
        tint: "#ffcf8c",
      });
      box(0.07, 0.59, 0.53, 0.025, 0.045, 0.025, "#eac48b");
      box(0, 0.34, 0.7, 0.44, 0.08, 0.32, "#bba19c");
      box(0, 0.29, 0.82, 0.55, 0.06, 0.2, "#a78e91");
      glow(0, 0.84, 0.54, 0.17, 0.08, 0.02, "#ffe2b2");
      break;
    }
    case 2:
      if (variant !== 2) sideWindows(0.65, 0.52, 0.3 + h, 0.7, 3, "#ffc9ae");
      for (const side of [-1, 1]) {
        box(side * 0.6, 0.65, 0.76, 0.035, 0.55, 0.035, "#e2b79b");
        glow(side * 0.6, 0.95, 0.76, 0.11, 0.15, 0.1, "#ffca88");
      }
      break;
    case 3:
      for (let y = 0.7; y < 0.35 + h * 1.2 - 0.12; y += 0.36)
        facadeWindow(a, {
          x: x - 0.632,
          y,
          z,
          width: 0.35,
          height: 0.19,
          facing: -Math.PI / 2,
          tint: "#b9d3ff",
          seed: t.id,
          tile: t.id,
        });
      for (let y = 1.05 + h * 0.25; y < 0.8 + h * 1.15 - 0.12; y += 0.36)
        facadeWindow(a, {
          x: x + 0.693,
          y,
          z: z - 0.05,
          width: 0.35,
          height: 0.19,
          facing: Math.PI / 2,
          tint: "#c9ceff",
          seed: t.id + 2,
          tile: t.id,
        });
      box(-0.33, 0.56 + h * 1.2, -0.15, 0.32, 0.15, 0.27, "#647391");
      break;
    case 4:
      sideWindows(0.55, 0.475, 2 + h + variant * 0.2, 0.78, 3, "#ffd6a1");
      box(0, 0.35, 0.7, 0.82, 0.08, 0.3, "#cdb7a3");
      for (const dx of [-0.3, 0, 0.3])
        box(dx, 0.57, 0.51, 0.035, 0.45, 0.04, "#cfb184");
      break;
    case 5:
      for (let step = 0; step < 3; step++) {
        const top = 0.35 + (step + 1) * (h * 0.35 + 0.15) + 0.2;
        for (const dx of [-0.3, 0.2])
          facadeWindow(a, {
            x: x + dx - step * 0.12,
            y: top - 0.16,
            z: z + 0.487 - step * 0.18,
            width: 0.2,
            height: 0.18,
            seed: t.id + step,
            tile: t.id,
            frame: "#c8c2b6",
          });
        facadeWindow(a, {
          x: x - 0.69,
          y: top - 0.16,
          z: z - step * 0.12,
          width: 0.24,
          height: 0.18,
          facing: -Math.PI / 2,
          seed: t.id + step + 1,
          tile: t.id,
        });
      }
      break;
    case 6:
      sideWindows(
        0.44,
        0.43,
        0.25 + 1.35 + h + variant * 0.17,
        0.72,
        2,
        "#ffdfb3",
      );
      break;
    case 7:
      sideWindows(0.575, 0.425, 0.55 + h, 0.88, 2, "#ffcd8d", -0.1);
      for (let step = 0; step < 3; step++)
        box(
          0,
          0.26 + step * 0.045,
          0.88 - step * 0.1,
          1.15 - step * 0.12,
          0.05,
          0.3,
          "#cdbab5",
        );
      break;
  }
  // Light at an occupied entrance reaches the pavement; it is a cheap soft decal, not a new GPU light.
  if (t.district !== 3)
    groundGlow(
      a,
      x,
      z + 0.82,
      [0.75, 0.8],
      t.district === 2 ? "#e4a5ad" : "#eab980",
      t.id,
    );
  return a;
}
