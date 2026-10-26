import {
  controlled,
  developmentCost,
  estimated,
  revenue,
} from "../../../../packages/game-core/index";
import { eventRevenue } from "../../../../packages/game-core/engagement";
import { purchaseCost } from "../../../../packages/game-core/properties";
import { developmentError } from "../../../../packages/game-core/properties";
import {
  districts,
  type State,
  type Tile,
} from "../../../../packages/shared/index";
import { command } from "../store";
import { money } from "./TurnPanel";
const levels = ["Empty lot", "Shop", "Business center", "Tower", "Landmark"];
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
  const count = controlled(s, tile.owner || "", tile.district),
    me = s.players.find((p) => p.id === id),
    owner = s.players.find((p) => p.id === tile.owner);
  const error = me ? developmentError(s, me, tile) : null;
  const buyable = ["property", "transit", "utility"].includes(tile.type);
  const locationText = {
    hq: "Pass here to receive $200.",
    opportunity: "Land here to receive a $100 grant.",
    tax: "Land here to pay $120 in city fees.",
    civic: "Land here to receive a $50 award.",
  };
  return (
    <>
      <button className="back" onClick={onBack}>
        Back to play
      </button>
      <p
        className="district-name"
        style={
          {
            "--district": districts[tile.district].color,
          } as React.CSSProperties
        }
      >
        {districts[tile.district].name}
      </p>
      <h2>{tile.name}</h2>
      {buyable && (
        <>
          <div className="stat">
            <span>Owner</span>
            <b>{owner?.name || "Not owned"}</b>
          </div>
          <div className="stat">
            <span>Building</span>
            <b>
              {tile.type === "property"
                ? levels[tile.level]
                : tile.type === "transit"
                  ? "Station"
                  : tile.type === "utility"
                    ? "Utility"
                    : "City location"}
            </b>
          </div>
          <div className="stat">
            <span>{tile.owner ? "Original price" : "Purchase price"}</span>
            <b>{money(tile.owner ? tile.price : purchaseCost(s, tile, me))}</b>
          </div>
          <div className="stat">
            <span>Rent per visit</span>
            <b>{money(revenue(s, tile))}</b>
          </div>
        </>
      )}
      {!buyable && (
        <p>{locationText[tile.type as keyof typeof locationText]}</p>
      )}
      {tile.owner === id && tile.type === "property" && (
        <>
          <button
            className="primary"
            disabled={s.phase !== "PLANNING" || !!error}
            onClick={() => command("DEVELOP", { tile: tile.id })}
          >
            Build for {money(developmentCost(tile, s, me))}
          </button>
          <p>
            {s.phase !== "PLANNING"
              ? "You can build at the start of each round."
              : error || "Building increases the rent paid by visitors."}
          </p>
          {tile.level > 0 && (
            <button
              className="secondary"
              disabled={!["PLANNING", "FINANCIAL_CRISIS"].includes(s.phase)}
              onClick={() => command("SELL", { tile: tile.id })}
            >
              Sell one level for {money(developmentCost(tile) * 0.5)}
            </button>
          )}
        </>
      )}
      {buyable && (
        <>
          <details>
            <summary>How rent is calculated</summary>
            <p className="formula">
              Base rent {money(tile.base)} × Building{" "}
              {(1 + tile.level * 0.6).toFixed(1)}
              {count >= 2 ? " × District bonus 1.10" : ""} × City event{" "}
              {eventRevenue(s.cityEvent, tile.district).toFixed(2)} ={" "}
              {money(revenue(s, tile))}
            </p>
            <p>
              Own 2 properties in a district for 10% more rent. Own 3 to build.
              Own all 4 to build landmarks.
            </p>
          </details>
          <details>
            <summary>Property value</summary>
            <p>
              {money(estimated(tile))}: purchase price plus development
              investment.
            </p>
          </details>
        </>
      )}
    </>
  );
}
