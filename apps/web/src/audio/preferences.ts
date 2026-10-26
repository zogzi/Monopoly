import { create } from "zustand";
export type AudioSettings = {
  enabled: boolean;
  master: number;
  effects: number;
  alerts: number;
  movement: boolean;
  interface: boolean;
  others: boolean;
};
export const AUDIO_STORAGE_KEY = "zmonopoly-audio";
export const defaultAudioSettings: AudioSettings = {
  enabled: false,
  master: 80,
  effects: 80,
  alerts: 100,
  movement: true,
  interface: true,
  others: true,
};
export function normalizeAudioSettings(value: unknown): AudioSettings {
  const result = { ...defaultAudioSettings };
  if (!value || typeof value !== "object") return result;
  for (const key of ["master", "effects", "alerts"] as const) {
    const n = (value as Record<string, unknown>)[key];
    if (typeof n === "number" && Number.isFinite(n))
      result[key] = Math.round(Math.max(0, Math.min(100, n)));
  }
  for (const key of ["enabled", "movement", "interface", "others"] as const) {
    const v = (value as Record<string, unknown>)[key];
    if (typeof v === "boolean") result[key] = v;
  }
  return result;
}
function loadPreferences() {
  try {
    const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
    return {
      settings: normalizeAudioSettings(raw ? JSON.parse(raw) : null),
      saved: !!raw,
    };
  } catch {
    return { settings: { ...defaultAudioSettings }, saved: false };
  }
}
export const useAudioSettings = create<{
  settings: AudioSettings;
  saved: boolean;
  update: (patch: Partial<AudioSettings>) => void;
}>((set) => ({
  ...loadPreferences(),
  update: (patch) =>
    set((state) => {
      const settings = normalizeAudioSettings({ ...state.settings, ...patch });
      try {
        localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings));
      } catch {
        /* Private browsers may disable storage. */
      }
      return { settings, saved: true };
    }),
}));
