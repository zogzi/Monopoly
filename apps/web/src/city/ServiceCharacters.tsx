import { Html } from "@react-three/drei";
import CharacterModel from "./CharacterModel";
import type { ServiceId } from "../../../../packages/shared/content";
export const serviceLocations = [
  {
    id: "broker",
    character: "vesper",
    at: [-4.7, 0.8, 1.2],
    title: "Card broker",
  },
  {
    id: "contractor",
    character: "dex",
    at: [4.7, 0.8, 1.2],
    title: "Contractor",
  },
  { id: "courier", character: "moxie", at: [0, 0.8, -5.1], title: "Courier" },
] as const;
export default function ServiceCharacters({
  onSelect,
}: {
  onSelect: (id: ServiceId) => void;
}) {
  return (
    <>
      {serviceLocations.map((npc) => (
        <group
          key={npc.id}
          position={[...npc.at]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(npc.id);
          }}
        >
          <CharacterModel id={npc.character} />
          <mesh position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.6, 0.7, 0.15, 16]} />
            <meshStandardMaterial color="#a17ba6" />
          </mesh>
          <Html center position={[0, 1.4, 0]} zIndexRange={[1, 0]}>
            <button className="service-marker" onClick={() => onSelect(npc.id)}>
              {npc.title}
            </button>
          </Html>
        </group>
      ))}
    </>
  );
}
