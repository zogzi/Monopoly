import { useEffect } from "react";
import type { State, Player } from "../../../../packages/shared/index";
import { GAME_NAME, GAME_VERSION } from "../../../../packages/shared/version";
import { useCountdown } from "./useCountdown";
export const phasePrompt: Record<string, string> = {
  ROLL: "Roll the dice",
  ROUTE_CHOICE: "Choose a road",
  PURCHASE_DECISION: "Buy or auction the property",
  ENCOUNTER: "Choose a surprise",
  DETENTION: "Choose bail or serve time",
  FINANCIAL_CRISIS: "Cover your cash shortfall",
  TURN_END: "Finish your turn",
};
export function isYourTurn(s: State, id: string | null) {
  return (
    !!id &&
    !["LOBBY", "PLANNING", "GAME_OVER", "AUCTION"].includes(s.phase) &&
    s.players[s.current]?.id === id
  );
}
export default function TurnStatus({
  s,
  me,
  onPlay,
  onPrison,
}: {
  s: State;
  me?: Player;
  onPlay: () => void;
  onPrison: () => void;
}) {
  const remaining = useCountdown(s.deadline),
    mine = isYourTurn(s, me?.id ?? null);
  const action =
    s.phase === "AUCTION"
      ? "Auction open · bid or pass"
      : s.phase === "PLANNING"
        ? "Planning · cards, trades and building"
        : mine
          ? `Your turn · ${phasePrompt[s.phase] ?? "Open Play"}`
          : `${s.players[s.current]?.name ?? "Another player"} is playing`;
  useEffect(() => {
    document.title = `${s.phase === "GAME_OVER" ? "" : me?.detention ? "In prison · " : mine && !s.paused ? "YOUR TURN · " : ""}${GAME_NAME} v${GAME_VERSION}`;
  }, [mine, s.paused, !!me?.detention, s.phase]);
  if (!me || ["LOBBY", "GAME_OVER"].includes(s.phase)) return null;
  return (
    <div className="persistent-status">
      {me.detention && (
        <button className="custody-status" onClick={onPrison}>
          <strong>You are in Ravenwatch Prison</strong>
          <span>View prison · {me.detention.turns} turns remaining</span>
        </button>
      )}
      <button
        className={`decision-status ${mine && !s.paused ? "your-turn" : ""}`}
        onClick={onPlay}
        aria-label="Open current turn"
        data-your-turn={mine && !s.paused}
      >
        <strong role="status">{s.paused ? "Game paused" : action}</strong>
        <span>
          {s.paused
            ? "Resume to continue"
            : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")} remaining · Open Play`}
        </span>
      </button>
    </div>
  );
}
