import { memo } from "react";
import Instances from "./Instances";
import { characterGeometry } from "./characterGeometry";
export default memo(function CharacterModel({ id }: { id: string }) {
  const { boxes, balls, cones } = characterGeometry(id);
  return (
    <group scale={0.85}>
      <Instances items={boxes} />
      <Instances items={balls} shape="sphere" />
      {cones.length > 0 && <Instances items={cones} shape="cone" />}
    </group>
  );
});
