import { socket, useGame } from "./store";
import type { State } from "../../../packages/shared/index";
let context: AudioContext | undefined,
  master: GainNode | undefined,
  ambience: AudioBufferSourceNode | undefined;
let enabled = false,
  previousRoll: number | null = null,
  previousLog = 0,
  previousTurn = "",
  lastCue = 0;
const voices = new Set<AudioScheduledSourceNode>();
let noiseBuffer: AudioBuffer | undefined;
function noiseData() {
  if (!context) return;
  noiseBuffer ??= (() => {
    const buffer = context!.createBuffer(
        1,
        context!.sampleRate * 3,
        context!.sampleRate,
      ),
      data = buffer.getChannelData(0);
    let value = 0;
    for (let i = 0; i < data.length; i++) {
      value = (value + (Math.random() * 2 - 1) * 0.05) / 1.025;
      data[i] = value * 4;
    }
    return buffer;
  })();
  return noiseBuffer;
}
function tone(
  frequency: number,
  delay = 0,
  duration = 0.18,
  volume = 0.08,
  type: OscillatorType = "sine",
) {
  if (!enabled || !context || !master) return;
  const node = context.createOscillator(),
    gain = context.createGain(),
    at = context.currentTime + delay;
  node.type = type;
  node.frequency.setValueAtTime(frequency, at);
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  node.connect(gain);
  gain.connect(master);
  voices.add(node);
  node.start(at);
  node.stop(at + duration + 0.03);
  node.onended = () => {
    voices.delete(node);
    node.disconnect();
    gain.disconnect();
  };
}
function noise(
  delay: number,
  duration: number,
  volume: number,
  cutoff: number,
) {
  if (!enabled || !context || !master) return;
  const buffer = noiseData();
  if (!buffer) return;
  const source = context.createBufferSource(),
    filter = context.createBiquadFilter(),
    gain = context.createGain(),
    at = context.currentTime + delay;
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  voices.add(source);
  source.start(at);
  source.stop(at + duration + 0.05);
  source.onended = () => {
    voices.delete(source);
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
}
function startAmbient() {
  if (!context || !master || ambience) return;
  const source = context.createBufferSource(),
    filter = context.createBiquadFilter(),
    gain = context.createGain();
  source.buffer = noiseData()!;
  source.loop = true;
  filter.type = "lowpass";
  filter.frequency.value = 320;
  gain.gain.value = 0.045;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start();
  source.onended = () => {
    voices.delete(source);
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
  ambience = source;
}
window.addEventListener("zmonopoly-sound", ((event: CustomEvent<boolean>) => {
  enabled = event.detail;
  if (enabled) {
    context ??= new AudioContext();
    master ??= context.createGain();
    master.gain.value = 0.6;
    master.connect(context.destination);
    void context.resume();
    startAmbient();
    tone(440, 0, 0.2, 0.045);
    tone(660, 0.1, 0.3, 0.04);
  } else {
    ambience?.stop();
    ambience = undefined;
    if (context) void context.suspend();
  }
}) as EventListener);
window.addEventListener("zmonopoly-thunder", () => {
  noise(0.12, 2.6, 0.35, 180);
  tone(45, 0.05, 1.6, 0.15, "sine");
});
socket.on("GAME_SNAPSHOT", (s: State) => {
  const roll = s.lastRoll,
    log = s.log[0],
    me = useGame.getState().id,
    current = s.players[s.current];
  const freshRoll = roll && roll.id !== previousRoll;
  const freshLog = log && log.id !== previousLog;
  const turn = s.phase === "ROLL" ? `${s.round}:${current?.id}` : "";
  const freshTurn = turn && turn !== previousTurn;
  const wasInitialized = previousLog > 0;
  if (roll) previousRoll = roll.id;
  if (log) previousLog = log.id;
  if (turn) previousTurn = turn;
  if (!enabled || !wasInitialized || !context) return;
  const fast = s.simulation.speed === "FAST";
  if (context.currentTime - lastCue < (fast ? 0.9 : 0.1)) return;
  if (freshRoll) {
    lastCue = context.currentTime;
    for (let i = 0; i < (fast ? 3 : 8); i++) {
      noise(i * 0.075, 0.07, 0.1, 1700);
      tone(140 + (i % 3) * 45, i * 0.075, 0.075, 0.04, "triangle");
    }
    tone(330, fast ? 0.25 : 0.8, 0.25, 0.06);
    return;
  }
  if (freshTurn && current?.id === me) {
    lastCue = context.currentTime;
    [392, 523, 659].forEach((f, i) => tone(f, i * 0.09, 0.3, 0.06));
    return;
  }
  if (!freshLog) return;
  lastCue = context.currentTime;
  if (log.text.includes("won") && log.text.includes("for $")) {
    noise(0, 0.11, 0.17, 450);
    tone(140, 0, 0.18, 0.08, "triangle");
    [523, 659, 784].forEach((f, i) => tone(f, 0.15 + i * 0.07, 0.4, 0.055));
  } else if (log.text.includes("completed a trade")) {
    [392, 523, 659, 784].forEach((f, i) =>
      tone(f, i * 0.06, 0.3, 0.05, "triangle"),
    );
  } else if (log.text.includes("bid $")) {
    tone(587, 0, 0.12, 0.04);
    tone(784, 0.07, 0.15, 0.035);
  } else if (log.text.includes("borrowed") || log.text.includes("refinanced")) {
    [220, 330, 440].forEach((f, i) =>
      tone(f, i * 0.08, 0.26, 0.045, "triangle"),
    );
  } else if (log.text.includes("acquired"))
    [523, 659, 784].forEach((f, i) => tone(f, i * 0.075, 0.32, 0.065));
  else if (log.text.includes("developed")) {
    noise(0, 0.3, 0.12, 650);
    [262, 392, 523].forEach((f, i) =>
      tone(f, 0.14 + i * 0.08, 0.35, 0.06, "triangle"),
    );
  } else if (log.text.includes("paid")) {
    tone(392, 0, 0.16, 0.05);
    tone(294, 0.1, 0.2, 0.04);
  } else if (log.text.includes("wins"))
    [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.14, 0.7, 0.07));
  else if (log.text.includes("bankrupt")) {
    tone(196, 0, 0.6, 0.06, "triangle");
    tone(147, 0.2, 0.7, 0.06);
  }
});
