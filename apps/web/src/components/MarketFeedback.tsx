import { useEffect, useRef, useState } from "react";
import type { State } from "../../../../packages/shared/index";
import type { MarketEvent } from "../../../../packages/shared/economy";
import { money } from "./TurnPanel";
export default function MarketFeedback({
  s,
  id,
}: {
  s: State;
  id: string | null;
}) {
  const previous = useRef(s.lastMarketEvent?.id),
    previousCash = useRef<number | undefined>(undefined);
  const [event, setEvent] = useState<MarketEvent | null>(null),
    [cash, setCash] = useState<{ change: number; id: number } | null>(null);
  const balance = s.players.find((p) => p.id === id)?.cash;
  useEffect(() => {
    const e = s.lastMarketEvent;
    if (previous.current === e?.id) return;
    previous.current = e?.id;
    if (!e) return;
    setEvent(e);
    const timer = setTimeout(
      () => setEvent(null),
      s.simulation.speed === "FAST" ? 900 : 3200,
    );
    return () => clearTimeout(timer);
  }, [s.lastMarketEvent?.id]);
  useEffect(() => {
    const before = previousCash.current;
    previousCash.current = balance;
    if (
      before === undefined ||
      balance === undefined ||
      before === balance ||
      s.phase === "LOBBY"
    )
      return;
    setCash({ change: balance - before, id: s.version });
    const timer = setTimeout(() => setCash(null), 2200);
    return () => clearTimeout(timer);
  }, [balance]);
  const name = s.players.find((p) => p.id === event?.player)?.name;
  return (
    <div className="market-feedback" aria-live="polite">
      {event && (
        <div key={event.id} className={`market-celebration ${event.kind}`}>
          {event.kind === "auction" && (
            <span className="gavel" aria-hidden="true">
              <i />
              <b />
            </span>
          )}
          <strong>
            {event.kind === "auction"
              ? `${name} wins the auction`
              : event.kind === "trade"
                ? "Trade completed"
                : event.kind === "option"
                  ? "Purchase option exercised"
                  : `${name} secured a bank loan`}
          </strong>
          {event.tile !== undefined && (
            <span>
              {s.board[event.tile].name} · {money(event.amount ?? 0)}
            </span>
          )}
          {event.kind === "loan" && (
            <span>{money(event.amount ?? 0)} · repayable with interest</span>
          )}
        </div>
      )}
      {cash && (
        <div
          key={cash.id}
          className={`cash-change ${cash.change > 0 ? "received" : "spent"}`}
          aria-label="Cash change"
        >
          {cash.change > 0 ? "+" : "−"}
          {money(Math.abs(cash.change))}
        </div>
      )}
    </div>
  );
}
