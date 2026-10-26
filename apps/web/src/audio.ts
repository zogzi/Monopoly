import { socket } from "./store";
let context: AudioContext | undefined;
let enabled = false;
let previous = 0;
window.addEventListener("empire-sound", ((event: CustomEvent<boolean>) => {
  enabled = event.detail;
  if (enabled) {
    context ??= new AudioContext();
    void context.resume();
    tone(523);
  }
}) as EventListener);
function tone(frequency: number) {
  if (!enabled || !context) return;
  const oscillator = context.createOscillator(),
    gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  gain.gain.setValueAtTime(0.045, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.2);
}
socket.on("GAME_SNAPSHOT", (s: { log: { id: number; text: string }[] }) => {
  const item = s.log[0];
  if (item && item.id !== previous) {
    if (previous)
      tone(
        item.text.includes("acquired")
          ? 660
          : item.text.includes("developed")
            ? 784
            : item.text.includes("rolled")
              ? 330
              : 440,
      );
    previous = item.id;
  }
});
