import { districts, type State } from "../../../../packages/shared/index";
import { PRISON_CENTER } from "../city/prisonLayout";
export default function CityMap({
  s,
  id,
  onSelect,
  onPrison,
}: {
  s: State;
  id: string | null;
  onSelect: (tile: number) => void;
  onPrison: () => void;
}) {
  const me = s.players.find((p) => p.id === id),
    position = me
      ? me.detention
        ? PRISON_CENTER
        : [s.board[me.position].x, s.board[me.position].z]
      : null;
  return (
    <div className="city-map-card">
      <svg viewBox="-18 -18 49 36" aria-label="City navigation map">
        {s.board.flatMap((t) =>
          t.next.map((n) => (
            <line
              key={`${t.id}-${n}`}
              x1={t.x}
              y1={t.z}
              x2={s.board[n].x}
              y2={s.board[n].z}
              stroke="#c9bad5"
              strokeWidth=".22"
            />
          )),
        )}
        <path d="M12 0H25V-4" fill="none" stroke="#b9a4bf" strokeWidth=".3" />
        {s.board.map((t) => (
          <g
            key={t.id}
            role="link"
            tabIndex={0}
            aria-label={`Locate ${t.name}`}
            onClick={() => onSelect(t.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSelect(t.id);
            }}
          >
            <circle cx={t.x} cy={t.z} r="1.05" fill="transparent" />
            <circle
              cx={t.x}
              cy={t.z}
              r={id && t.owner === id ? 0.68 : 0.48}
              fill={
                t.owner && t.owner === id
                  ? "#d89527"
                  : districts[t.district].color
              }
              stroke="#fffaf2"
              strokeWidth=".12"
            >
              <title>
                {t.name}
                {id && t.owner === id ? " · Yours" : ""}
              </title>
            </circle>
          </g>
        ))}
        <g
          role="link"
          tabIndex={0}
          aria-label="Locate Ravenwatch Prison"
          onClick={onPrison}
          onKeyDown={(e) => {
            if (e.key === "Enter") onPrison();
          }}
        >
          <rect x="21" y="-7" width="8" height="6" rx=".5" fill="#7a648b" />
          <text
            x="25"
            y="-3.2"
            textAnchor="middle"
            fill="#fff6e9"
            fontSize="1.5"
          >
            Prison
          </text>
        </g>
        <text x="0" y=".7" textAnchor="middle" fontSize="1.6" fill="#6b477d">
          City
        </text>
        <text x="0" y="15.5" textAnchor="middle" fontSize="1.3" fill="#6b477d">
          HQ
        </text>
        {position && (
          <g pointerEvents="none">
            <circle
              cx={position[0]}
              cy={position[1]}
              r="1.0"
              fill="none"
              stroke="#372a51"
              strokeWidth=".3"
            />
            <text
              x={position[0]}
              y={position[1] - 1.5}
              textAnchor="middle"
              fontSize="1.5"
              fontWeight="700"
              fill="#372a51"
            >
              You
            </text>
          </g>
        )}
      </svg>
      <small>Click a location to go there. Gold marks your properties.</small>
    </div>
  );
}
