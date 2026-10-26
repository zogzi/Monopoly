import { character } from "../../../../packages/shared/index";
export default function Portrait({ id }: { id: string }) {
  const c = character(id),
    s = c.style;
  return (
    <svg viewBox="0 0 64 72" aria-hidden="true">
      <rect width="64" height="72" rx="12" fill={c.color + "25"} />
      <path d="M8 72V57Q9 43 32 43Q55 43 56 57V72" fill={c.coat} />
      <path d="M26 45L32 59L39 45" fill="#ffedd8" />
      <rect x="27" y="36" width="10" height="13" rx="3" fill={c.skin} />
      <ellipse
        cx="32"
        cy="29"
        rx={s === "flower" ? 18 : 14}
        ry="17"
        fill={c.skin}
      />
      <path d="M18 30Q11 7 32 8Q53 7 46 29L40 18Q28 23 20 18Z" fill={c.hair} />
      {s === "afro" && (
        <g fill={c.hair}>
          {[
            [18, 14],
            [29, 9],
            [41, 12],
            [47, 20],
            [14, 23],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="10" />
          ))}
        </g>
      )}
      {s === "tophat" && (
        <g fill="#29213c">
          <rect x="21" y="1" width="23" height="20" rx="3" />
          <rect x="14" y="19" width="37" height="5" rx="2" />
          <rect x="21" y="13" width="23" height="4" fill="#e9ae47" />
        </g>
      )}
      {s === "widehat" && (
        <g fill="#4c305d">
          <ellipse cx="32" cy="21" rx="27" ry="6" />
          <path d="M18 21L23 5H41L47 21Z" />
        </g>
      )}
      {s === "bun" && <circle cx="36" cy="7" r="8" fill={c.hair} />}
      {s === "cap" && (
        <g fill="#f0cc4c">
          <path d="M16 22Q17 2 35 7Q49 9 47 23Z" />
          <rect x="31" y="21" width="26" height="5" rx="2" />
        </g>
      )}
      {s === "pilot" && <path d="M18 45L47 52L39 59L16 51Z" fill="#f2d882" />}
      {s === "fur" && (
        <path
          d="M10 48L25 42L32 53L40 42L55 49L48 60L32 56L16 60Z"
          fill="#fbf4ef"
        />
      )}
      {s === "goggles" && (
        <g fill="#263651" stroke="#e8ba6d" strokeWidth="3">
          <circle cx="23" cy="23" r="8" />
          <circle cx="41" cy="23" r="8" />
          <path d="M30 23H34" />
        </g>
      )}
      {s === "star" && (
        <>
          <path
            d="M15 23Q4 36 13 57L22 52L20 21M45 21L45 53L54 57Q61 34 45 21"
            fill={c.hair}
          />
          <path
            d="M45 12L48 17L54 17L50 21L52 27L46 24L41 27L42 21L38 17L44 17Z"
            fill="#ffce68"
          />
        </>
      )}
      {s === "flower" && (
        <g fill="#ffce68">
          <circle cx="43" cy="17" r="7" />
          <circle cx="48" cy="22" r="6" />
          <circle cx="40" cy="25" r="6" />
          <circle cx="43" cy="22" r="3" fill="#f37879" />
        </g>
      )}
      <g fill="#29213c">
        <circle cx="26" cy="30" r="1.8" />
        <circle cx="38" cy="30" r="1.8" />
      </g>
      <path
        d="M28 38Q32 41 37 37"
        fill="none"
        stroke="#793b3d"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {s === "tophat" && (
        <path
          d="M24 35Q29 31 32 35Q36 31 41 35Q37 41 32 37Q27 41 24 35"
          fill="#dbd3c7"
        />
      )}
      {s === "bun" && (
        <g fill="none" stroke="#413657" strokeWidth="1.3">
          <circle cx="25" cy="30" r="5" />
          <circle cx="39" cy="30" r="5" />
          <path d="M30 30H34" />
        </g>
      )}
    </svg>
  );
}
