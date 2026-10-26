export type Cue =
  | "click"
  | "confirm"
  | "error"
  | "dice"
  | "roll"
  | "step"
  | "route"
  | "purchase"
  | "build"
  | "sell"
  | "income"
  | "expense"
  | "card"
  | "surprise"
  | "service"
  | "bid"
  | "auction"
  | "auctionWin"
  | "offer"
  | "trade"
  | "contract"
  | "loan"
  | "repay"
  | "arrest"
  | "release"
  | "serve"
  | "round"
  | "turn"
  | "crisis"
  | "recovery"
  | "win"
  | "lose"
  | "pause"
  | "resume"
  | "start";
export type Channel = "effects" | "alerts";
export type SoundEvent = { cue: Cue; remote?: boolean };
export const alertCues = new Set<Cue>([
  "turn",
  "arrest",
  "crisis",
  "win",
  "lose",
  "error",
]);
export type Note = {
  hz: number;
  at: number;
  length: number;
  gain: number;
  wave?: OscillatorType;
};
export type Hit = { at: number; length: number; gain: number; cutoff: number };
export function score(cue: Cue): { notes: Note[]; hits: Hit[] } {
  const notes: Note[] = [],
    hits: Hit[] = [];
  const line = (
    hz: number[],
    spacing = 0.065,
    length = 0.18,
    gain = 0.055,
    wave: OscillatorType = "sine",
  ) =>
    hz.forEach((f, i) =>
      notes.push({ hz: f, at: i * spacing, length, gain, wave }),
    );
  const hit = (at: number, length: number, gain: number, cutoff: number) =>
    hits.push({ at, length, gain, cutoff });
  switch (cue) {
    case "click":
      line([740], 0, 0.035, 0.018);
      break;
    case "confirm":
      line([440, 554], 0.055, 0.12, 0.035);
      break;
    case "error":
      line([220, 174], 0.11, 0.22, 0.06, "triangle");
      break;
    case "dice":
      for (let i = 0; i < 13; i++) {
        hit(i * 0.105, 0.055, 0.13, 1500 + (i % 3) * 300);
        notes.push({
          hz: 135 + (i % 3) * 42,
          at: i * 0.105,
          length: 0.055,
          gain: 0.035,
          wave: "triangle",
        });
      }
      notes.push({ hz: 440, at: 1.82, length: 0.23, gain: 0.05 });
      break;
    case "roll":
      hit(0, 0.055, 0.1, 1400);
      hit(0.08, 0.055, 0.08, 1800);
      line([150, 220], 0.08, 0.075, 0.03, "triangle");
      break;
    case "step":
      hit(0, 0.05, 0.075, 650);
      line([125], 0, 0.045, 0.025, "triangle");
      break;
    case "route":
      line([330, 440, 554], 0.055, 0.13, 0.04);
      break;
    case "purchase":
      line([523, 659, 784], 0.075, 0.32);
      break;
    case "build":
      hit(0, 0.12, 0.12, 600);
      hit(0.16, 0.08, 0.09, 900);
      line([262, 392, 523], 0.12, 0.28, 0.05, "triangle");
      break;
    case "sell":
      line([659, 523, 392], 0.065, 0.18, 0.04);
      break;
    case "income":
      line([659, 880], 0.075, 0.2, 0.045);
      break;
    case "expense":
      line([392, 294], 0.08, 0.17, 0.045);
      break;
    case "card":
      hit(0, 0.09, 0.06, 2400);
      line([440, 659, 880], 0.06, 0.18, 0.04);
      break;
    case "surprise":
      line([330, 415, 659, 554], 0.075, 0.22, 0.04);
      break;
    case "service":
      line([349, 440, 698], 0.07, 0.23, 0.045, "triangle");
      break;
    case "bid":
      line([587, 784], 0.06, 0.13, 0.04);
      break;
    case "auction":
      hit(0, 0.08, 0.13, 450);
      line([294, 440], 0.1, 0.2, 0.045, "triangle");
      break;
    case "auctionWin":
      hit(0, 0.1, 0.15, 450);
      line([523, 659, 784, 1046], 0.09, 0.33);
      break;
    case "offer":
      line([494, 659], 0.12, 0.23, 0.05);
      break;
    case "trade":
      line([392, 523, 659, 784], 0.06, 0.28, 0.05, "triangle");
      break;
    case "contract":
      line([349, 523, 698], 0.07, 0.24, 0.045);
      break;
    case "loan":
      line([220, 330, 440], 0.08, 0.26, 0.045, "triangle");
      break;
    case "repay":
      line([440, 554, 659], 0.07, 0.22, 0.045);
      break;
    case "arrest":
      line([440, 660, 440, 660], 0.16, 0.19, 0.06, "triangle");
      break;
    case "release":
      line([330, 440, 659, 880], 0.08, 0.24, 0.05);
      break;
    case "serve":
      line([294, 247], 0.14, 0.23, 0.045, "triangle");
      break;
    case "round":
      line([262, 330, 392, 523], 0.08, 0.28, 0.045);
      break;
    case "turn":
      line([392, 523, 659], 0.12, 0.36, 0.085);
      break;
    case "crisis":
      line([294, 220, 294], 0.16, 0.28, 0.075, "triangle");
      break;
    case "recovery":
      line([330, 440, 659], 0.09, 0.27, 0.05);
      break;
    case "win":
      line([523, 659, 784, 1046, 1318], 0.14, 0.55, 0.065);
      break;
    case "lose":
      line([392, 330, 247, 196], 0.16, 0.4, 0.055, "triangle");
      break;
    case "pause":
      line([440, 330], 0.1, 0.15, 0.04);
      break;
    case "resume":
      line([330, 440], 0.1, 0.15, 0.04);
      break;
    case "start":
      line([262, 392, 523, 784], 0.1, 0.3, 0.05);
      break;
  }
  return { notes, hits };
}
