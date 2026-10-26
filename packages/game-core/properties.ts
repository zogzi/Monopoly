import type { State, Player, Tile } from "../shared/index";
export const controlled = (s: State, id: string, district: number) =>
  s.board.filter(
    (t) => t.type === "property" && t.district === district && t.owner === id,
  ).length;
export const developmentCost = (t: Tile) => Math.round(t.price * 0.6);
export const estimated = (t: Tile) => t.price + t.level * developmentCost(t);
export const empire = (s: State, p: Player) =>
  p.cash +
  s.board.filter((t) => t.owner === p.id).reduce((n, t) => n + estimated(t), 0);
export const revenue = (s: State, t: Tile) =>
  Math.round(
    t.base *
      (1 + t.level * 0.6) *
      (controlled(s, t.owner || "", t.district) >= 2 ? 1.1 : 1),
  );
export function develop(s: State, p: Player, t: Tile) {
  if (t.owner !== p.id || t.type !== "property")
    throw Error("Select a property you own.");
  const count = controlled(s, p.id, t.district);
  const used = s.board
    .filter((b) => b.district === t.district && b.owner === p.id)
    .reduce((n, b) => n + b.level, 0);
  if (
    count < 3 ||
    t.level >= 4 ||
    (t.level === 3 && count < 4) ||
    used >= (count === 4 ? 12 : 6)
  )
    throw Error(
      "Own 3 district properties to build; all 4 for landmarks. Zoning capacity: 6 or 12 levels.",
    );
  const cost = developmentCost(t);
  if (p.cash < cost) throw Error("Not enough cash to develop.");
  p.cash -= cost;
  t.level++;
}
