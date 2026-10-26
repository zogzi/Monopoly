import { character } from "../../../../packages/shared/index";
function Part({
  at,
  size,
  color,
}: {
  at: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={at} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.65} />
    </mesh>
  );
}
function Ball({
  at,
  r,
  color,
}: {
  at: [number, number, number];
  r: number;
  color: string;
}) {
  return (
    <mesh position={at} castShadow>
      <sphereGeometry args={[r, 12, 10]} />
      <meshStandardMaterial color={color} roughness={0.65} />
    </mesh>
  );
}
export default function CharacterModel({ id }: { id: string }) {
  const c = character(id),
    s = c.style,
    w = s === "flower" ? 0.44 : s === "fur" ? 0.38 : 0.3;
  return (
    <group scale={0.85}>
      <Part at={[-0.12, -0.28, 0]} size={[0.14, 0.3, 0.17]} color="#30283f" />
      <Part at={[0.12, -0.28, 0]} size={[0.14, 0.3, 0.17]} color="#30283f" />
      <Part at={[0, 0.02, 0]} size={[w, 0.43, 0.25]} color={c.coat} />
      <Part
        at={[-w / 2 - 0.06, 0.01, 0]}
        size={[0.12, 0.34, 0.16]}
        color={c.coat}
      />
      <Part
        at={[w / 2 + 0.06, 0.01, 0]}
        size={[0.12, 0.34, 0.16]}
        color={c.coat}
      />
      <Ball at={[0, 0.42, 0]} r={s === "flower" ? 0.27 : 0.23} color={c.skin} />
      <Ball at={[0, 0.52, -0.06]} r={0.23} color={c.hair} />
      <Part at={[0, 0.38, 0.19]} size={[0.28, 0.2, 0.08]} color={c.skin} />
      <Part
        at={[-0.085, 0.43, 0.24]}
        size={[0.035, 0.045, 0.025]}
        color="#211a32"
      />
      <Part
        at={[0.085, 0.43, 0.24]}
        size={[0.035, 0.045, 0.025]}
        color="#211a32"
      />
      {s === "pilot" && (
        <>
          <Part at={[0, 0.21, 0.16]} size={[0.39, 0.1, 0.08]} color="#ffe0a0" />
          <Part
            at={[0.21, 0.11, -0.12]}
            size={[0.35, 0.09, 0.1]}
            color="#ffe0a0"
          />
          <Part
            at={[0, 0.51, 0.18]}
            size={[0.35, 0.08, 0.06]}
            color="#4b405a"
          />
        </>
      )}
      {s === "tophat" && (
        <>
          <Part at={[0, 0.68, 0]} size={[0.58, 0.07, 0.42]} color="#2c203f" />
          <Part at={[0, 0.88, 0]} size={[0.34, 0.38, 0.3]} color="#2c203f" />
          <Part
            at={[0, 0.75, 0.01]}
            size={[0.35, 0.06, 0.31]}
            color="#e9ae47"
          />
          <Part
            at={[0, 0.32, 0.25]}
            size={[0.25, 0.05, 0.05]}
            color="#e2d4c4"
          />
        </>
      )}
      {s === "widehat" && (
        <>
          <mesh position={[0, 0.66, 0]}>
            <cylinderGeometry args={[0.48, 0.48, 0.07, 24]} />
            <meshStandardMaterial color="#513269" />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <coneGeometry args={[0.27, 0.3, 12]} />
            <meshStandardMaterial color="#513269" />
          </mesh>
          <Part
            at={[0, -0.05, -0.16]}
            size={[0.45, 0.65, 0.04]}
            color="#513269"
          />
        </>
      )}
      {s === "flower" && (
        <>
          <Ball at={[0.19, 0.6, 0.11]} r={0.13} color="#ffcd67" />
          <Ball at={[0.25, 0.53, 0.16]} r={0.1} color="#ffcd67" />
          <Ball at={[0.16, 0.5, 0.2]} r={0.1} color="#ffcd67" />
          <Ball at={[0.2, 0.55, 0.23]} r={0.05} color="#f1687e" />
        </>
      )}
      {s === "afro" && (
        <>
          {[-1, 0, 1].map((n) => (
            <Ball
              key={n}
              at={[n * 0.17, 0.68 - Math.abs(n) * 0.05, -0.02]}
              r={0.2}
              color={c.hair}
            />
          ))}
          <Part at={[0, 0.1, 0.16]} size={[0.1, 0.23, 0.03]} color="#ffcc63" />
        </>
      )}
      {s === "fur" && (
        <>
          <Ball at={[-0.16, 0.18, 0]} r={0.14} color="#fff3e9" />
          <Ball at={[0.16, 0.18, 0]} r={0.14} color="#fff3e9" />
          <Part at={[0, -0.15, 0]} size={[0.46, 0.25, 0.3]} color={c.coat} />
          <Part
            at={[-0.18, 0.45, -0.05]}
            size={[0.11, 0.38, 0.2]}
            color={c.hair}
          />
        </>
      )}
      {s === "goggles" && (
        <>
          <Ball at={[-0.12, 0.51, 0.22]} r={0.1} color="#e9b866" />
          <Ball at={[0.12, 0.51, 0.22]} r={0.1} color="#e9b866" />
          <Ball at={[-0.12, 0.51, 0.29]} r={0.065} color="#5267a5" />
          <Ball at={[0.12, 0.51, 0.29]} r={0.065} color="#5267a5" />
          <Part at={[0, 0.01, -0.24]} size={[0.33, 0.4, 0.2]} color="#745274" />
        </>
      )}
      {s === "star" && (
        <>
          <Part at={[0, -0.12, 0]} size={[0.46, 0.3, 0.31]} color={c.coat} />
          <Ball at={[-0.2, 0.44, -0.06]} r={0.18} color={c.hair} />
          <Ball at={[0.2, 0.44, -0.06]} r={0.18} color={c.hair} />
          <mesh position={[0.23, 0.67, 0.08]} rotation={[0, 0, 0.3]}>
            <octahedronGeometry args={[0.14]} />
            <meshStandardMaterial color="#ffce68" />
          </mesh>
        </>
      )}
      {s === "bun" && (
        <>
          <Ball at={[0, 0.78, -0.08]} r={0.14} color={c.hair} />
          <Part at={[0, 0.2, 0.15]} size={[0.08, 0.2, 0.04]} color="#eee5de" />
          <Part
            at={[0, 0.43, 0.255]}
            size={[0.31, 0.07, 0.025]}
            color="#493f5f"
          />
        </>
      )}
      {s === "cap" && (
        <>
          <Ball at={[0, 0.61, -0.02]} r={0.25} color="#f1ca4e" />
          <Part
            at={[0.1, 0.58, 0.23]}
            size={[0.42, 0.06, 0.22]}
            color="#f1ca4e"
          />
          <Part
            at={[0, 0.06, 0.15]}
            size={[0.16, 0.16, 0.04]}
            color="#fff1c7"
          />
        </>
      )}
    </group>
  );
}
