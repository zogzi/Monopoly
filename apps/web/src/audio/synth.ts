import type { AudioSettings } from "./preferences";
import { alertCues, score, type Cue, type SoundEvent } from "./cues";
const MAX_VOICES = 48;
export class AudioEngine {
  private context?: AudioContext;
  private master?: GainNode;
  private effects?: GainNode;
  private alerts?: GainNode;
  private noise?: AudioBuffer;
  private voices = new Map<
    AudioScheduledSourceNode,
    { gain: GainNode; filter?: BiquadFilterNode; cue: Cue; alert: boolean }
  >();
  private recent = new Map<string, number>();
  constructor(private settings: AudioSettings) {}
  sync(settings: AudioSettings) {
    this.settings = settings;
    const ctx = this.context;
    if (!ctx || !this.master || !this.effects || !this.alerts) return;
    for (const [bus, value] of [
      [this.master, settings.enabled ? (settings.master / 100) * 0.65 : 0],
      [this.effects, settings.effects / 100],
      [this.alerts, settings.alerts / 100],
    ] as const) {
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setTargetAtTime(value, ctx.currentTime, 0.015);
    }
    if (!settings.enabled || settings.master === 0) this.stopVoices();
    if (!settings.enabled)
      void ctx
        .suspend()
        .then(() => {
          if (this.settings.enabled) void this.unlock();
        })
        .catch(() => {});
  }
  async unlock() {
    if (!this.settings.enabled) return false;
    try {
      if (!this.context) {
        const ctx = (this.context = new AudioContext());
        this.master = ctx.createGain();
        this.effects = ctx.createGain();
        this.alerts = ctx.createGain();
        this.effects.connect(this.master);
        this.alerts.connect(this.master);
        this.master.connect(ctx.destination);
        this.sync(this.settings);
      }
      if (this.context.state === "suspended") await this.context.resume();
      return this.context.state === "running";
    } catch {
      return false;
    }
  }
  cancel(cue: Cue) {
    for (const [source, nodes] of this.voices)
      if (nodes.cue === cue) {
        try {
          source.stop();
        } catch {
          /* Source already ended. */
        }
        this.cleanup(source);
      }
  }
  private stopVoices() {
    for (const voice of [...this.voices.keys()]) {
      try {
        voice.stop();
      } catch {
        /* Source already ended. */
      }
      this.cleanup(voice);
    }
    this.recent.clear();
  }
  private cleanup(source: AudioScheduledSourceNode) {
    const nodes = this.voices.get(source);
    if (!nodes) return;
    source.disconnect();
    nodes.gain.disconnect();
    nodes.filter?.disconnect();
    this.voices.delete(source);
  }
  private attach(
    source: AudioScheduledSourceNode,
    gain: GainNode,
    bus: GainNode,
    cue: Cue,
    filter?: BiquadFilterNode,
  ) {
    if (this.voices.size >= MAX_VOICES) {
      const oldest =
        [...this.voices].find(([, nodes]) => !nodes.alert)?.[0] ??
        this.voices.keys().next().value!;
      if (bus !== this.alerts && this.voices.get(oldest)?.alert) {
        source.disconnect();
        gain.disconnect();
        filter?.disconnect();
        return false;
      }
      try {
        oldest.stop();
      } catch {
        /* Source already ended. */
      }
      this.cleanup(oldest);
    }
    if (filter) {
      source.connect(filter);
      filter.connect(gain);
    } else source.connect(gain);
    gain.connect(bus);
    this.voices.set(source, { gain, filter, cue, alert: bus === this.alerts });
    source.onended = () => this.cleanup(source);
    return true;
  }
  play({ cue, remote = false }: SoundEvent, delay = 0) {
    const ctx = this.context,
      s = this.settings;
    if (!s.enabled || !s.master || !ctx || ctx.state !== "running")
      return false;
    if (
      (remote && !s.others) ||
      (cue === "step" && !s.movement) ||
      (cue === "click" && !s.interface)
    )
      return false;
    const alert = !remote && alertCues.has(cue),
      bus = alert ? this.alerts : this.effects;
    if (!bus || !(alert ? s.alerts : s.effects)) return false;
    const key = `${cue}:${remote}`;
    const cooldown = cue === "step" ? 0.12 : cue === "click" ? 0.045 : 0.08;
    if (ctx.currentTime - (this.recent.get(key) ?? -Infinity) < cooldown)
      return false;
    this.recent.set(key, ctx.currentTime);
    const { notes, hits } = score(cue),
      base = ctx.currentTime + delay;
    for (const n of notes) {
      const source = ctx.createOscillator(),
        gain = ctx.createGain(),
        at = base + n.at;
      source.type = n.wave ?? "sine";
      source.frequency.setValueAtTime(n.hz, at);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(
        n.gain,
        at + Math.min(0.008, n.length / 4),
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, at + n.length);
      if (!this.attach(source, gain, bus, cue)) continue;
      source.start(at);
      source.stop(at + n.length + 0.02);
    }
    if (hits.length) {
      this.noise ??= (() => {
        const buffer = ctx.createBuffer(
            1,
            Math.ceil(ctx.sampleRate * 0.35),
            ctx.sampleRate,
          ),
          data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        return buffer;
      })();
      for (const h of hits) {
        const source = ctx.createBufferSource(),
          filter = ctx.createBiquadFilter(),
          gain = ctx.createGain(),
          at = base + h.at;
        source.buffer = this.noise;
        filter.type = "lowpass";
        filter.frequency.value = h.cutoff;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(h.gain, at + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + h.length);
        if (!this.attach(source, gain, bus, cue, filter)) continue;
        source.start(at);
        source.stop(at + h.length + 0.02);
      }
    }
    return true;
  }
}
