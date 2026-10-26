import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { State } from "../../../../packages/shared/index";
import { lotPosition } from "./geometry";
import { buildingArchitecture } from "./architecture";
export default function PropertyMarkers({
  s,
  id,
  reduced,
}: {
  s: State;
  id: string | null;
  reduced: boolean;
}) {
  const rings = useRef<THREE.InstancedMesh>(null),
    arrows = useRef<THREE.InstancedMesh>(null);
  const object = useMemo(() => new THREE.Object3D(), []);
  const lots = useMemo(
    () =>
      s.board
        .filter((t) => t.owner && t.owner === id)
        .map((t) => {
          const model = buildingArchitecture(t, 0, 0);
          return {
            at: lotPosition(t),
            top:
              Math.max(
                ...[
                  ...model.boxes,
                  ...model.gables,
                  ...model.spires,
                  ...model.rounds,
                ].map((part) => part.at[1] + part.size[1] / 2),
              ) + 0.48,
          };
        }),
    [s.board, id],
  );
  useFrame(({ clock }) => {
    if (!rings.current || !arrows.current) return;
    lots.forEach((lot, i) => {
      object.position.set(lot.at[0], 0.36, lot.at[1]);
      object.scale.setScalar(1);
      object.rotation.set(-Math.PI / 2, 0, 0);
      object.updateMatrix();
      rings.current!.setMatrixAt(i, object.matrix);
      object.position.y =
        lot.top + (reduced ? 0 : Math.sin(clock.elapsedTime * 2.4 + i) * 0.07);
      object.rotation.set(0, 0, Math.PI);
      object.updateMatrix();
      arrows.current!.setMatrixAt(i, object.matrix);
    });
    rings.current.count = arrows.current.count = lots.length;
    rings.current.instanceMatrix.needsUpdate = true;
    arrows.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group name="your-property-markers">
      <instancedMesh
        ref={rings}
        count={lots.length}
        args={[undefined, undefined, Math.max(1, lots.length)]}
        frustumCulled={false}
        raycast={() => {}}
      >
        <ringGeometry args={[0.83, 0.91, 32]} />
        <meshBasicMaterial color="#ffce7d" side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh
        ref={arrows}
        count={lots.length}
        args={[undefined, undefined, Math.max(1, lots.length)]}
        frustumCulled={false}
        raycast={() => {}}
      >
        <coneGeometry args={[0.15, 0.28, 4]} />
        <meshBasicMaterial color="#ffdf91" />
      </instancedMesh>
    </group>
  );
}
