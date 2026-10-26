import { useState } from "react";
import type { State } from "../../../../packages/shared/index";
import { command } from "../store";
export default function TableTalk({
  s,
  joined,
}: {
  s: State;
  joined: boolean;
}) {
  const [chat, setChat] = useState("");
  const me = joined;
  return (
    <>
      <div className="social-tabs">
        <b>Table talk</b>
        <span>● LIVE</span>
      </div>
      <div className="messages" aria-live="polite">
        {s.chat.length === 0 ? (
          <div className="chat-empty">
            Good stories start
            <br />
            with a conversation.<span>Say hello to the table.</span>
          </div>
        ) : (
          s.chat.slice(-30).map((m, i) => (
            <div className="message" key={i}>
              <b>{m.name}</b>
              <p>{m.text}</p>
            </div>
          ))
        )}
      </div>
      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (chat.trim()) {
            command("CHAT", { text: chat });
            setChat("");
          }
        }}
      >
        <input
          aria-label="Table chat message"
          disabled={!me}
          maxLength={280}
          placeholder={me ? "Talk to the table…" : "Join to chat…"}
          value={chat}
          onChange={(e) => setChat(e.target.value)}
        />
        <button disabled={!me || !chat.trim()} aria-label="Send message">
          ↗
        </button>
      </form>
      <div className="reactions">
        {["😂", "💀", "🤝", "🔥", "👀", "📈"].map((emoji) => (
          <button
            key={emoji}
            disabled={!me}
            onClick={() => command("REACTION", { emoji })}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
