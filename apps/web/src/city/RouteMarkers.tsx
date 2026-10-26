import { Html } from "@react-three/drei";
import type { State } from "../../../../packages/shared/index";
import { command } from "../store";
export default function RouteMarkers({
  s,
  id,
}: {
  s: State;
  id: string | null;
}) {
  if (s.phase !== "ROUTE_CHOICE") return null;
  const p = s.players[s.current],
    from = s.board[p.position],
    mine = p.id === id && !s.paused;
  return (
    <>
      {from.next.map((next) => {
        const tile = s.board[next],
          length = Math.hypot(tile.x - from.x, tile.z - from.z),
          angle = Math.atan2(tile.x - from.x, tile.z - from.z);
        return (
          <group key={next}>
            <mesh
              position={[(from.x + tile.x) / 2, 0.22, (from.z + tile.z) / 2]}
              rotation={[0, angle, 0]}
            >
              <boxGeometry args={[0.17, 0.025, length]} />
              <meshBasicMaterial color="#ffce7f" />
            </mesh>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[tile.x, 0.23, tile.z]}
            >
              <ringGeometry args={[0.5, 0.65, 24]} />
              <meshBasicMaterial color="#ffe4aa" />
            </mesh>
            {mine && (
              <Html center position={[tile.x, 1.7, tile.z]}>
                <button
                  className="route-marker"
                  onClick={() => command("ROUTE", { tile: next })}
                >
                  {next >= 40 ? "Take shortcut" : "Take outer road"}
                </button>
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
}
