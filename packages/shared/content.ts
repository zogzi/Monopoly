export const cardKinds = [
  "shield",
  "builder",
  "express",
  "grant",
  "market",
  "alibi",
] as const;
export type CardKind = (typeof cardKinds)[number];
export type Card = { id: string; kind: CardKind | "hidden" };
export const cards: Record<CardKind, { name: string; description: string }> = {
  shield: { name: "Rent Shield", description: "Block your next rent payment." },
  builder: {
    name: "Contractor Favor",
    description: "Save up to $150 on your next building level.",
  },
  express: {
    name: "Express Pass",
    description: "Move 3 extra spaces on your next roll.",
  },
  grant: {
    name: "Emergency Grant",
    description: "Receive $120, including during a cash shortfall.",
  },
  market: {
    name: "Market Coupon",
    description: "Save up to $140 on your next property purchase.",
  },
  alibi: { name: "Alibi", description: "Leave custody without paying bail." },
};
export const eventIds = [
  "festival",
  "builders",
  "harvest",
  "market",
  "harbor",
  "quiet",
] as const;
export type EventId = (typeof eventIds)[number];
export const cityEvents: Record<EventId, { name: string; effect: string }> = {
  festival: {
    name: "Midnight Carnival",
    effect: "Old Town and Neon Mile earn 20% more rent.",
  },
  builders: {
    name: "Builders’ Eve",
    effect: "Building levels cost 20% less this round.",
  },
  harvest: {
    name: "Harvest Moon",
    effect: "Passing HQ pays $300 instead of $200.",
  },
  market: { name: "Night Market", effect: "Unowned properties cost 15% less." },
  harbor: {
    name: "Ghost Fleet Arrives",
    effect: "Harbor Row and Innovation Park earn 25% more rent.",
  },
  quiet: {
    name: "Quiet Streets",
    effect: "All rents are 10% lower this round.",
  },
};
export type Reward = {
  cash?: number;
  draw?: number;
  shield?: number;
  buildCredit?: number;
  purchaseCredit?: number;
  moveBonus?: number;
  illegal?: boolean;
};
export type EncounterOption = { label: string; detail: string; reward: Reward };
export const encounters: { title: string; options: EncounterOption[] }[] = [
  {
    title: "A lantern merchant flags you down.",
    options: [
      {
        label: "Take $40",
        detail: "A small delivery fee, paid immediately.",
        reward: { cash: 40 },
      },
      {
        label: "Take a surprise card",
        detail: "Save a tactical advantage for later.",
        reward: { draw: 1 },
      },
    ],
  },
  {
    title: "A contractor offers an after-hours deal.",
    options: [
      {
        label: "Pay $60 for building credit",
        detail: "Save $140 on a future building level.",
        reward: { cash: -60, buildCredit: 140 },
      },
      {
        label: "Take the safe $25",
        detail: "A finder’s fee with no conditions.",
        reward: { cash: 25 },
      },
    ],
  },
  {
    title: "A stranger sells sealed envelopes.",
    options: [
      {
        label: "Pay $40 for two cards",
        detail: "Two random tactical cards. You need two free hand slots.",
        reward: { cash: -40, draw: 2 },
      },
      {
        label: "Keep your cash",
        detail: "Receive $20 for helping at the stall.",
        reward: { cash: 20 },
      },
    ],
  },
  {
    title: "A ghost offers to watch your back.",
    options: [
      {
        label: "Take rent protection",
        detail: "Block one future rent payment.",
        reward: { shield: 1 },
      },
      {
        label: "Take $55 instead",
        detail: "Useful now, but the next rent is yours to pay.",
        reward: { cash: 55 },
      },
    ],
  },
  {
    title: "The night market has a private sale.",
    options: [
      {
        label: "Pay $45 for a coupon",
        detail: "Save $120 on your next property purchase.",
        reward: { cash: -45, purchaseCredit: 120 },
      },
      {
        label: "Take a surprise card",
        detail: "A random tactical card for your hand.",
        reward: { draw: 1 },
      },
    ],
  },
  {
    title: "A courier has one spare seat.",
    options: [
      {
        label: "Book the express route",
        detail: "Move 3 extra spaces on your next roll.",
        reward: { moveBonus: 3 },
      },
      {
        label: "Deliver a parcel for $45",
        detail: "Cash now, ordinary movement later.",
        reward: { cash: 45 },
      },
    ],
  },
  {
    title: "The museum needs a night-time sponsor.",
    options: [
      {
        label: "Sponsor for $50",
        detail: "Receive a card and protect one rent payment.",
        reward: { cash: -50, draw: 1, shield: 1 },
      },
      {
        label: "Take a $30 guiding job",
        detail: "No risk and no spending required.",
        reward: { cash: 30 },
      },
    ],
  },
  {
    title: "A trader offers you a choice of favors.",
    options: [
      {
        label: "Secure $100 building credit",
        detail: "Use it when you control enough district properties.",
        reward: { buildCredit: 100 },
      },
      {
        label: "Secure a $90 purchase coupon",
        detail: "Use it on your next unowned property.",
        reward: { purchaseCredit: 90 },
      },
    ],
  },
  {
    title: "A city inspector finds an overpayment.",
    options: [
      {
        label: "Take a $70 refund",
        detail: "Immediate cash for your next decision.",
        reward: { cash: 70 },
      },
      {
        label: "Take a favor instead",
        detail: "Receive a tactical card and $15.",
        reward: { cash: 15, draw: 1 },
      },
    ],
  },
  {
    title: "Two street performers invite you in.",
    options: [
      {
        label: "Help the magic show",
        detail: "Protect one future rent payment.",
        reward: { shield: 1 },
      },
      {
        label: "Work the ticket booth",
        detail: "Earn $50 now.",
        reward: { cash: 50 },
      },
    ],
  },
  {
    title: "A builder is clearing surplus supplies.",
    options: [
      {
        label: "Pay $75 for supplies",
        detail: "Save $160 on a future building level.",
        reward: { cash: -75, buildCredit: 160 },
      },
      {
        label: "Sell the spare parts",
        detail: "Earn $35, paid immediately.",
        reward: { cash: 35 },
      },
    ],
  },
  {
    title: "A masked patron leaves a gift.",
    options: [
      {
        label: "Open the small box",
        detail: "One random tactical card.",
        reward: { draw: 1 },
      },
      {
        label: "Take the travel voucher",
        detail: "Two extra spaces on your next roll and $25.",
        reward: { moveBonus: 2, cash: 25 },
      },
    ],
  },
  {
    title: "A smuggler needs a discreet delivery.",
    options: [
      {
        label: "Take the legal job: $40",
        detail: "No risk. Help at the warehouse.",
        reward: { cash: 40 },
      },
      {
        label: "Smuggle the parcel: $180",
        detail: "40% chance of arrest: two turns in custody or $200 bail.",
        reward: { illegal: true },
      },
    ],
  },
  {
    title: "A masked dealer offers a forged permit.",
    options: [
      {
        label: "Walk away with $25",
        detail: "Report the offer and receive a small reward.",
        reward: { cash: 25 },
      },
      {
        label: "Use the forgery: $180",
        detail: "40% chance of arrest: two turns in custody or $200 bail.",
        reward: { illegal: true },
      },
    ],
  },
] satisfies { title: string; options: EncounterOption[] }[];
export const serviceIds = ["broker", "contractor", "courier"] as const;
export type ServiceId = (typeof serviceIds)[number];
export const services = {
  broker: {
    name: "The card broker",
    person: "Vesper",
    description: "Buy a card of your choice for $100.",
  },
  contractor: {
    name: "The contractor",
    person: "Dex",
    description: "Pay $80 for $140 building credit.",
  },
  courier: {
    name: "The courier",
    person: "Moxie",
    description: "Pay $60 to move 3 extra spaces next roll.",
  },
};
