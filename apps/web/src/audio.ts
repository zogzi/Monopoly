import { socket, useGame } from "./store";
import type { Command, State } from "../../../packages/shared/index";
import {
  useAudioSettings,
  normalizeAudioSettings,
  AUDIO_STORAGE_KEY,
  type AudioSettings,
} from "./audio/preferences";
import { AudioEngine } from "./audio/synth";
import { GameAudioEvents, commandCue } from "./audio/events";
import { alertCues, type Cue } from "./audio/cues";
export { useAudioSettings } from "./audio/preferences";
const engine = new AudioEngine(useAudioSettings.getState().settings),
  observer = new GameAudioEvents();
useAudioSettings.subscribe(({ settings }) => engine.sync(settings));
export function updateAudioSettings(patch: Partial<AudioSettings>) {
  useAudioSettings.getState().update(patch);
  if (useAudioSettings.getState().settings.enabled) void engine.unlock();
}
export function setAudioEnabled(enabled: boolean) {
  updateAudioSettings({ enabled });
}
export async function previewSound(cue: Cue) {
  if (await engine.unlock()) engine.play({ cue });
}
export function interfaceSound() {
  engine.play({ cue: "click" });
}
// Browsers require a gesture after refresh. Saved levels never start audio on page load.
for (const name of ["pointerdown", "keydown"])
  document.addEventListener(
    name,
    () => {
      void engine.unlock();
    },
    { capture: true },
  );
document.addEventListener(
  "click",
  (event) => {
    const target =
      event.target instanceof Element
        ? event.target.closest("button,summary,[role=button]")
        : null;
    if (
      target &&
      !target.hasAttribute("disabled") &&
      !target.closest("[data-audio-preview]")
    )
      interfaceSound();
  },
  true,
);
document.addEventListener("change", (event) => {
  if (event.target instanceof HTMLSelectElement) interfaceSound();
});
window.addEventListener("storage", (event) => {
  if (event.key !== AUDIO_STORAGE_KEY) return;
  try {
    useAudioSettings.setState({
      settings: normalizeAudioSettings(
        event.newValue ? JSON.parse(event.newValue) : null,
      ),
      saved: !!event.newValue,
    });
  } catch {
    /* Ignore corrupt external preferences. */
  }
});
// Preserve the existing sound-enable event for older integrations and recordings.
window.addEventListener("zmonopoly-sound", ((event: CustomEvent<boolean>) =>
  setAudioEnabled(event.detail)) as EventListener);
window.addEventListener("zmonopoly-joined", () => {
  void previewSound("confirm");
});
window.addEventListener("zmonopoly-dice-animation", (event) =>
  engine.play({
    cue:
      event instanceof CustomEvent && event.detail?.reduced ? "roll" : "dice",
  }),
);
window.addEventListener("zmonopoly-dice-end", () => engine.cancel("dice"));
window.addEventListener("zmonopoly-step", ((event: CustomEvent<string>) => {
  if (!document.hidden)
    engine.play({
      cue: "step",
      remote: event.detail !== useGame.getState().id,
    });
}) as EventListener);
window.addEventListener("zmonopoly-command", ((
  event: CustomEvent<{ type: Command["type"]; ok: boolean }>,
) => {
  if (!event.detail.ok) return;
  const cue = commandCue(event.detail.type);
  if (cue) engine.play({ cue });
}) as EventListener);
useGame.subscribe((state, before) => {
  if (state.error && state.error !== before.error)
    engine.play({ cue: "error" });
});
socket.on("disconnect", () => observer.reset());
let remoteAt = -Infinity;
socket.on("GAME_SNAPSHOT", (s: State) => {
  const events = observer.consume(s, useGame.getState().id);
  const now = performance.now(),
    fast = s.simulation.speed === "FAST";
  let remoteCount = 0,
    offset = 0;
  for (const event of events) {
    // Local alerts bypass effect throttling so a busy board cannot hide your turn.
    if (!event.remote && alertCues.has(event.cue)) {
      engine.play(event);
      continue;
    }
    if (
      event.remote &&
      (remoteCount >= 2 || now - remoteAt < (fast ? 400 : 120))
    )
      continue;
    if (engine.play(event, offset)) {
      offset += 0.065;
      if (event.remote) remoteCount++;
    }
  }
  if (remoteCount) remoteAt = now;
});
