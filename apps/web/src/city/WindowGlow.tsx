import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Block } from "./Instances";
/** One additive instanced pass gives windows and lanterns a soft local halo. */
export default function WindowGlow({ items }: { items: Block[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const uniforms = useMemo(() => ({}), []);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const object = new THREE.Object3D(),
      color = new THREE.Color();
    items.forEach((item, i) => {
      object.position.set(...item.at);
      object.scale.set(...item.size);
      object.rotation.set(
        item.rotationX ?? 0,
        item.rotation ?? 0,
        item.rotationZ ?? 0,
      );
      object.updateMatrix();
      ref.current!.setMatrixAt(i, object.matrix);
      ref.current!.setColorAt(i, color.set(item.color));
    });
    ref.current.count = items.length;
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh
      name="window-light-halos"
      ref={ref}
      args={[undefined, undefined, Math.max(1, items.length)]}
      raycast={() => {}}
    >
      <planeGeometry />
      <shaderMaterial
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        vertexShader={`varying vec2 tex;varying vec3 tint;void main(){tex=uv;tint=instanceColor;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec2 tex;varying vec3 tint;void main(){vec2 p=(tex-.5)*2.;float halo=exp(-dot(p,p)*3.8)*(1.-smoothstep(.55,1.,max(abs(p.x),abs(p.y))));gl_FragColor=vec4(tint,halo*.19);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}
      />
    </instancedMesh>
  );
}
