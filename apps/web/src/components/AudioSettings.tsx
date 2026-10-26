import type { ReactNode } from "react";
import Modal from "./Modal";
import { previewSound, updateAudioSettings, useAudioSettings } from "../audio";
export default function AudioSettings({
  onClose,
  quality,
  storm,
  onQuality,
  onStorm,
  practice,
}: {
  onClose: () => void;
  quality: string;
  storm: boolean;
  onQuality: (value: string) => void;
  onStorm: (value: boolean) => void;
  practice?: ReactNode;
}) {
  const settings = useAudioSettings((s) => s.settings);
  return (
    <Modal title="Settings" onClose={onClose} className="audio-settings">
      <div className="display-settings">
        <label>
          Graphics quality
          <select
            aria-label="Graphics quality"
            value={quality}
            onChange={(e) => onQuality(e.target.value)}
          >
            {["AUTO", "LOW", "MEDIUM", "HIGH"].map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        </label>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={storm}
            onChange={(e) => onStorm(e.target.checked)}
          />
          Storm visuals
        </label>
      </div>
      <h3>Audio</h3>
      <p>
        Adjust the game to sit comfortably alongside Discord. Your choices are
        saved in this browser.
      </p>
      <label className="toggle-label">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => updateAudioSettings({ enabled: e.target.checked })}
        />
        Sound enabled
      </label>
      {(
        [
          ["master", "Master volume", "All game audio."],
          [
            "effects",
            "Game effects volume",
            "Dice, movement, cards, purchases and other actions.",
          ],
          [
            "alerts",
            "Alert volume",
            "Your turn, arrests, cash shortfalls and results.",
          ],
        ] as const
      ).map(([key, title, description]) => (
        <label className="audio-slider" key={key}>
          <span>
            {title}
            <output>{settings[key]}%</output>
          </span>
          <input
            type="range"
            aria-label={title}
            min="0"
            max="100"
            step="1"
            value={settings[key]}
            onChange={(e) =>
              updateAudioSettings({ [key]: Number(e.target.value) })
            }
          />
          <small>{description}</small>
        </label>
      ))}
      <div className="audio-previews" data-audio-preview>
        <button
          disabled={!settings.enabled}
          onClick={() => {
            void previewSound("purchase");
          }}
        >
          Test effects
        </button>
        <button
          disabled={!settings.enabled}
          onClick={() => {
            void previewSound("turn");
          }}
        >
          Test alert
        </button>
        <button
          disabled={!settings.enabled || !settings.movement}
          onClick={() => {
            void previewSound("step");
          }}
        >
          Test movement
        </button>
      </div>
      <div className="audio-options">
        {(
          [
            ["movement", "Movement sounds"],
            ["interface", "Interface clicks"],
            ["others", "Other players’ actions"],
          ] as const
        ).map(([key, label]) => (
          <label className="toggle-label" key={key}>
            <input
              type="checkbox"
              checked={settings[key]}
              onChange={(e) => updateAudioSettings({ [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>
      {practice && (
        <details className="practice-settings">
          <summary>Bot controls</summary>
          {practice}
        </details>
      )}
      <button className="primary" onClick={onClose}>
        Done
      </button>
    </Modal>
  );
}
