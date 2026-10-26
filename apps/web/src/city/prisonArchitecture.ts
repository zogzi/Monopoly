import type { Architecture } from "./architecture";
import type { Block } from "./Instances";
import { facadeWindow, groundGlow } from "./facade";
import { PRISON_CENTER } from "./prisonLayout";

export function prisonArchitecture(): Architecture {
  const a: Architecture = {
    boxes: [],
    gables: [],
    spires: [],
    rounds: [],
    lights: [],
    glows: [],
  };
  const [cx, cz] = PRISON_CENTER;
  const add = (
    list: Block[],
    x: number,
    y: number,
    z: number,
    size: Block["size"],
    color: string,
    rotation = 0,
  ) => list.push({ at: [cx + x, y, cz + z], size, color, rotation });
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
  ) => add(a.boxes, x, y, z, [w, h, d], color);
  const lamp = (x: number, y: number, z: number) => {
    box(x, y - 0.15, z, 0.035, 0.5, 0.035, "#49394c");
    box(x, y + 0.2, z, 0.26, 0.055, 0.26, "#443346");
    add(a.lights, x, y + 0.03, z, [0.16, 0.24, 0.16], "#ffce88");
    for (const facing of [0, Math.PI / 2])
      add(a.glows, x, y + 0.03, z, [0.6, 0.7, 1], "#f2ad69", facing);
  };
  // Layered stone quay: a clear stretch of water separates it from the city island.
  box(0, -0.12, 0, 9, 0.9, 7, "#57485f");
  box(0, 0.25, 0, 8.9, 0.15, 6.9, "#8b788b");
  for (let i = 0; i < 9; i++)
    for (const side of [-1, 1]) {
      box(
        -4 + i,
        -0.2,
        side * 3.5,
        0.9,
        0.42,
        0.16,
        i % 2 ? "#65536a" : "#75616f",
      );
      box(
        side * 4.5,
        -0.2,
        -3 + i * 0.75,
        0.16,
        0.42,
        0.66,
        i % 2 ? "#65536a" : "#75616f",
      );
    }
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 7; col++)
      box(
        -2.7 + col * 0.9,
        0.34,
        -1.5 + row * 0.75,
        0.86,
        0.025,
        0.71,
        (row + col) % 2 ? "#716176" : "#77677a",
      );
  // Back cell house and a separate western service wing keep the courtyard visible.
  box(0, 1.67, -2.45, 5.9, 2.68, 1.1, "#776375");
  add(a.gables, 0, 3.34, -2.45, [6.2, 0.65, 1.45], "#3d304e");
  box(0, 3.68, -2.45, 0.08, 0.055, 1.5, "#a38388");
  box(-3.35, 1.37, -0.2, 1.1, 2.08, 3.5, "#6b596e");
  add(a.gables, -3.35, 2.72, -0.2, [1.35, 0.65, 3.7], "#44324f");
  for (let row = 0; row < 2; row++)
    for (let i = 0; i < 6; i++)
      for (const face of [0, Math.PI])
        facadeWindow(a, {
          x: cx - 2.4 + i * 0.96,
          y: 1.13 + row * 1.02,
          z: cz + (face ? -3.02 : -1.88),
          facing: face,
          width: 0.35,
          height: 0.5,
          bars: true,
          seed: i + row * 3,
          frame: "#ad9391",
          tint: "#ffcb82",
        });
  for (let i = 0; i < 3; i++)
    for (const side of [-1, 1])
      facadeWindow(a, {
        x: cx - 3.35 + side * 0.57,
        y: 1.45,
        z: cz - 1.3 + i * 1.1,
        facing: (side * Math.PI) / 2,
        width: 0.34,
        height: 0.48,
        bars: true,
        seed: i + 2,
        frame: "#ac9292",
      });
  // Brick courses, pilasters, drainpipes and chimneys break up the masonry.
  for (let y = 0.55; y < 3; y += 0.32) {
    box(0, y, -1.885, 5.86, 0.018, 0.022, "#927888");
    box(0, y, -3.02, 5.86, 0.018, 0.022, "#604e65");
  }
  for (const x of [-2.95, -0.96, 0.96, 2.95])
    box(x, 1.55, -1.79, 0.13, 2.43, 0.2, "#a28a91");
  for (const x of [-2.1, 1.7]) box(x, 3.55, -2.5, 0.24, 1, 0.28, "#7e6675");
  box(2.75, 1.65, -1.83, 0.045, 2.7, 0.045, "#453c4e");
  // Four watchtowers have their own roofs, glowing observation rooms and parapets.
  for (const x of [-3.7, 3.7])
    for (const z of [-2.7, 2.6]) {
      box(x, 1.63, z, 1.02, 2.6, 1.02, "#8e7685");
      box(x, 2.72, z, 1.24, 0.18, 1.24, "#b39a9b");
      box(x, 3.04, z, 0.82, 0.48, 0.82, "#5d4a61");
      add(a.spires, x, 3.68, z, [1.48, 1.0, 1.48], "#392b4b", Math.PI / 4);
      add(a.spires, x, 4.3, z, [0.08, 0.45, 0.08], "#c1a18d");
      for (const face of [0, Math.PI / 2, Math.PI, -Math.PI / 2])
        facadeWindow(a, {
          x: cx + x + Math.sin(face) * 0.43,
          y: 3.05,
          z: cz + z + Math.cos(face) * 0.43,
          facing: face,
          width: 0.32,
          height: 0.23,
          bars: true,
          seed: 1,
          frame: "#a99194",
          tint: "#ffdfaa",
        });
      for (let i = 0; i < 3; i++) {
        box(x - 0.4 + i * 0.4, 2.99, z + 0.56, 0.21, 0.35, 0.18, "#aa8e94");
        box(x - 0.4 + i * 0.4, 2.99, z - 0.56, 0.21, 0.35, 0.18, "#aa8e94");
      }
    }
  // Right perimeter and front iron fence; leave an actual opening for the escort car.
  box(3.9, 1.15, 0, 0.35, 1.65, 4.25, "#84707e");
  for (const x of [-2.7, 2.7]) {
    box(x, 0.5, 2.8, 3.4, 0.28, 0.28, "#9c848b");
    box(x, 2.05, 2.8, 3.4, 0.055, 0.07, "#8d8195");
    for (let i = 0; i < 12; i++)
      box(x - 1.5 + i * 0.27, 1.3, 2.8, 0.035, 1.5, 0.055, "#4a4056");
  }
  for (const x of [-1.05, 1.05]) {
    box(x, 1.3, 2.8, 0.34, 1.95, 0.5, "#b29a9a");
    lamp(x * 1.4, 2.1, 3.0);
  }
  for (let i = 0; i <= 10; i++) {
    const angle = (i / 10) * Math.PI;
    a.boxes.push({
      at: [cx + Math.cos(angle) * 1.06, 2.14 + Math.sin(angle) * 0.8, cz + 2.8],
      size: [0.29, 0.27, 0.5],
      color: i % 2 ? "#b49a99" : "#9a818e",
      rotationZ: angle - Math.PI / 2,
    });
  }
  box(0, 3.17, 2.8, 2.65, 0.22, 0.58, "#8a6f83");
  add(a.gables, 0, 3.52, 2.8, [2.85, 0.5, 0.85], "#43304e");
  add(a.lights, 0, 3.17, 3.1, [0.36, 0.055, 0.02], "#edc994");
  for (const side of [-1, 1]) {
    box(side * 2.0, 0.55, 0.2, 0.95, 0.12, 0.35, "#594651");
    for (const leg of [-0.32, 0.32])
      box(side * 2 + leg, 0.43, 0.2, 0.05, 0.2, 0.2, "#473d4e");
    groundGlow(
      a,
      cx + side * 1.45,
      cz + 2.3,
      [1.2, 1.5],
      "#edba7b",
      undefined,
      0.37,
    );
  }
  // A longer causeway, rails and bridge lamps make the isolation readable from the map.
  const start = 15.25,
    end = 25,
    length = end - start;
  box((start + end) / 2 - cx, 0.13, -cz, length, 0.16, 1.25, "#82738b");
  for (const side of [-1, 1]) {
    box(
      (start + end) / 2 - cx,
      0.76,
      -cz + side * 0.59,
      length,
      0.055,
      0.055,
      "#ac9ba9",
    );
    for (let x = start + 0.35; x < end; x += 0.8)
      box(x - cx, 0.46, -cz + side * 0.59, 0.045, 0.63, 0.045, "#a491a4");
    for (const x of [17.3, 20.3, 23.3]) {
      lamp(x - cx, 1.13, -cz + side * 0.54);
      groundGlow(a, x, 0, [1.3, 0.95], "#e7b079", undefined, 0.22);
    }
  }
  // Prison-yard parking stripes and ivy hanging from the western stonework.
  for (const x of [2.0, 3.0]) box(x, 0.365, 1.65, 0.025, 0.012, 1.3, "#c6b28b");
  for (let i = 0; i < 9; i++)
    add(
      a.rounds,
      -4.0,
      0.85 + (i % 3) * 0.29,
      -1.25 + Math.floor(i / 3) * 0.6,
      [0.14, 0.24, 0.16],
      i % 2 ? "#756e69" : "#8d897b",
    );
  return a;
}
