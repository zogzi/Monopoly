import {
  controlled,
  developmentCost,
  estimated,
  revenue,
} from "../../../../packages/game-core/index";
import {
  districts,
  type State,
  type Tile,
} from "../../../../packages/shared/index";
import { command } from "../store";
import { money } from "./TurnPanel";
export default function PropertyPanel({
  s,
  tile,
  id,
  onBack,
}: {
  s: State;
  tile: Tile;
  id: string | null;
  onBack: () => void;
}) {
  const count = controlled(s, tile.owner || "", tile.district);
  return (
    <>
      <button className="back" onClick={onBack}>
        ← Back to overview
      </button>
      <span
        className="eyebrow"
        style={{ color: districts[tile.district].color }}
      >
        {districts[tile.district].name}
      </span>
      <h2>{tile.name}</h2>
      <div
        className="property-art"
        style={
          {
            "--district": districts[tile.district].color,
          } as React.CSSProperties
        }
      >
        <span>▥</span>
        <b>LEVEL {tile.level}</b>
      </div>
      <div className="stat">
        <span>Owner</span>
        <b>
          {s.players.find((p) => p.id === tile.owner)?.name || "City-owned"}
        </b>
      </div>
      <div className="stat">
        <span>Purchase price</span>
        <b>{money(tile.price)}</b>
      </div>
      <div className="stat">
        <span>Asset value</span>
        <b>{money(estimated(tile))}</b>
      </div>
      <div className="stat">
        <span>Revenue per visit</span>
        <b>{money(revenue(s, tile))}</b>
      </div>
      <div className="formula">
        Base {money(tile.base)} × Development{" "}
        {(1 + tile.level * 0.6).toFixed(1)}
        {count >= 2 ? " × Portfolio 1.10" : ""} = {money(revenue(s, tile))}
      </div>
      {tile.owner === id && tile.type === "property" && (
        <>
          <p>
            District control: {count}/4 · Zoning capacity:{" "}
            {count === 4 ? 12 : count >= 3 ? 6 : 0} levels. Three properties
            unlock development, all four unlock landmarks.
          </p>
          <button
            className="primary"
            disabled={s.phase !== "PLANNING"}
            onClick={() => command("DEVELOP", { tile: tile.id })}
          >
            Develop · {money(developmentCost(tile))}
          </button>
          <button
            className="secondary"
            disabled={
              !tile.level || !["PLANNING", "FINANCIAL_CRISIS"].includes(s.phase)
            }
            onClick={() => command("SELL", { tile: tile.id })}
          >
            Sell level · +{money(developmentCost(tile) * 0.5)}
          </button>
        </>
      )}
    </>
  );
}
