export const PRISON_CENTER = [25, -4] as const;
export const ESCORT_DURATION_MS = 5200;
export const PRISON_APPROACH = [
  [15.4, 0.4, 0],
  [20, 0.4, 0],
  [25, 0.4, 0],
  [25, 0.57, -1.45],
  [27.4, 0.57, -2.35],
] as const;
export const PRISON_DROP_OFF = PRISON_APPROACH[PRISON_APPROACH.length - 1];
export function prisonSlot(index: number): [number, number] {
  return [
    PRISON_CENTER[0] - 1.56 + (index % 5) * 0.78,
    PRISON_CENTER[1] + 1 - Math.floor(index / 5) * 0.9,
  ];
}
