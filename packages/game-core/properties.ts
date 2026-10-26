import { eventRevenue } from "./engagement";
import type { State, Player, Tile } from "../shared/index";
import { debt, receivables } from "./finance";
export const controlled = (s: State, id: string, district: number) =>
  s.board.filter(
    (t) => t.type === "property" && t.district === district && t.owner === id,
  ).length;
export const developmentCost = (t: Tile, s?: State, p?: Player) =>
  Math.max(
    0,
    Math.round(
      t.price *
        0.6 *
        (s?.cityEvent === "builders" ? 0.8 : 1) *
        (s?.mode === "BLITZ" ? 0.75 : 1),
    ) - (p?.buildCredit ?? 0),
  );
export const purchaseCost = (s: State, t: Tile, p?: Player) =>
  Math.max(
    0,
    Math.round(t.price * (s.cityEvent === "market" ? 0.85 : 1)) -
      (p?.purchaseCredit ?? 0),
  );
export const estimated = (t: Tile) => t.price + t.level * developmentCost(t);
export const empire = (s: State, p: Player) =>
  p.cash +
  s.board
    .filter((t) => t.owner === p.id)
    .reduce((n, t) => n + estimated(t), 0) -
  debt(s, p.id) +
  receivables(s, p.id);
export const revenue = (s: State, t: Tile) =>
  Math.round(
    t.base *
      (1 + t.level * 0.6) *
      (controlled(s, t.owner || "", t.district) >= 2 ? 1.1 : 1) *
      eventRevenue(s.cityEvent, t.district),
  );
export function developmentError(s: State, p: Player, t: Tile): string | null {
  if (t.owner !== p.id || t.type !== "property")
    return "Choose a property you own.";
  const count = controlled(s, p.id, t.district);
  const used = s.board
    .filter((b) => b.district === t.district && b.owner === p.id)
    .reduce((n, b) => n + b.level, 0);
  if (count < 3) return "Own 3 properties in this district to build.";
  if (t.level >= 4) return "This landmark is fully developed.";
  if (t.level === 3 && count < 4)
    return "Own all 4 district properties to build a landmark.";
  if (used >= (count === 4 ? 12 : 6))
    return "This district has no free building capacity.";
  if (p.cash < developmentCost(t, s, p)) return "Not enough cash to build.";
  return null;
}
export function develop(s: State, p: Player, t: Tile) {
  const error = developmentError(s, p, t);
  if (error) throw Error(error);
  p.cash -= developmentCost(t, s, p);
  p.buildCredit = 0;
  t.level++;
}
