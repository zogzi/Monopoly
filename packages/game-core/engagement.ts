import {
  cardKinds,
  encounters,
  type CardKind,
  type EncounterOption,
  type ServiceId,
  type EventId,
} from "../shared/content";
import type { State, Player } from "../shared/index";
export function drawCards(
  s: State,
  p: Player,
  count: number,
  random: () => number,
) {
  if (p.cards.length + count > 4)
    throw Error("Your hand is full. Use a card first.");
  for (let i = 0; i < count; i++)
    p.cards.push({
      id: `card-${s.version}-${p.id}-${p.cards.length}-${i}`,
      kind: cardKinds[Math.floor(random() * cardKinds.length)],
    });
}
export function encounterError(
  p: Player,
  option: EncounterOption,
): string | null {
  const r = option.reward;
  if (p.cash + (r.cash ?? 0) < 0) return "Not enough cash.";
  if (p.cards.length + (r.draw ?? 0) > 4)
    return "Not enough space in your hand.";
  if (r.shield && p.shield >= 2) return "You already have two rent shields.";
  if (r.buildCredit && p.buildCredit >= r.buildCredit)
    return "You already have this much building credit.";
  if (r.purchaseCredit && p.purchaseCredit >= r.purchaseCredit)
    return "You already have this much purchase credit.";
  if (r.moveBonus && p.moveBonus >= r.moveBonus)
    return "Your next roll already has this bonus.";
  return null;
}
export function applyEncounter(
  s: State,
  p: Player,
  index: number,
  choice: number,
  random: () => number,
) {
  const option = encounters[index]?.options[choice];
  if (!option) throw Error("Choose one of the two offers.");
  const error = encounterError(p, option);
  if (error) throw Error(error);
  const r = option.reward;
  if (r.illegal) {
    p.cash += 180;
    if (random() < 0.4) p.detention = { turns: 2, bail: 200 };
    return p.detention
      ? "Caught on an illegal delivery: taken into custody."
      : "The illegal delivery paid $180. You avoided arrest.";
  }
  p.cash += r.cash ?? 0;
  p.shield = Math.min(2, p.shield + (r.shield ?? 0));
  p.buildCredit = Math.max(p.buildCredit, r.buildCredit ?? 0);
  p.purchaseCredit = Math.max(p.purchaseCredit, r.purchaseCredit ?? 0);
  p.moveBonus = Math.max(p.moveBonus, r.moveBonus ?? 0);
  if (r.draw) drawCards(s, p, r.draw, random);
  return option.label;
}
export function useCard(s: State, p: Player, id: string) {
  const index = p.cards.findIndex((card) => card.id === id);
  if (index < 0) throw Error("That card is no longer in your hand.");
  const kind = p.cards[index].kind;
  if (kind === "hidden") throw Error("That is not your card.");
  if (kind === "shield") {
    if (p.shield >= 2) throw Error("You already have two rent shields.");
    p.shield++;
  }
  if (kind === "builder") {
    if (p.buildCredit >= 150) throw Error("You already have building credit.");
    p.buildCredit = 150;
  }
  if (kind === "market") {
    if (p.purchaseCredit >= 140)
      throw Error("You already have a purchase coupon.");
    p.purchaseCredit = 140;
  }
  if (kind === "express") {
    if (!["PLANNING", "ROLL"].includes(s.phase))
      throw Error("Use Express Pass before rolling.");
    if (p.moveBonus >= 3)
      throw Error("Your next roll already has extra movement.");
    p.moveBonus = 3;
  }
  if (kind === "grant") p.cash += 120;
  if (kind === "alibi") {
    if (!p.detention) throw Error("Save Alibi for when you are in custody.");
    p.detention = null;
    p.position = 0;
  }
  p.cards.splice(index, 1);
  return kind;
}
export function visitService(
  s: State,
  p: Player,
  service: ServiceId,
  card: CardKind | undefined,
) {
  if (p.serviceRound === s.round)
    throw Error("You can use one city service per round.");
  const price = service === "broker" ? 100 : service === "contractor" ? 80 : 60;
  if (p.cash < price) throw Error("Not enough cash for this service.");
  if (service === "broker") {
    if (!card || card === "grant")
      throw Error("Choose a tactical card. Cash grants are not sold.");
    if (p.cards.length >= 4) throw Error("Your hand is full.");
    p.cards.push({ id: `service-${s.version}-${p.id}`, kind: card });
  }
  if (service === "contractor") {
    if (p.buildCredit >= 140) throw Error("You already have building credit.");
    p.buildCredit = 140;
  }
  if (service === "courier") {
    if (p.moveBonus >= 3) throw Error("Your next roll already has this bonus.");
    p.moveBonus = 3;
  }
  p.cash -= price;
  p.serviceRound = s.round;
}
export function eventRevenue(event: EventId | null, district: number) {
  if (event === "festival" && [1, 2].includes(district)) return 1.2;
  if (event === "harbor" && [0, 3].includes(district)) return 1.25;
  return event === "quiet" ? 0.9 : 1;
}
export function snapshotFor(s: State, id?: string): State {
  return {
    ...s,
    players: s.players.map((p) =>
      p.id === id
        ? p
        : {
            ...p,
            cards: p.cards.map((card) => ({
              id: card.id,
              kind: "hidden" as const,
            })),
          },
    ),
  };
}
