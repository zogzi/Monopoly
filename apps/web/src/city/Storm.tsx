import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
export const stormFlash = (time: number) => {
  const phase = time % 18;
  return phase > 5 && phase < 5.65
    ? Math.sin(((phase - 5) / 0.65) * Math.PI) ** 2
    : 0;
};
const boltPoints = [
  new THREE.Vector3(-0.7, 7.3, -0.4),
  new THREE.Vector3(-0.25, 6.9, -0.25),
  new THREE.Vector3(-0.48, 6.25, -0.1),
  new THREE.Vector3(0.12, 5.8, 0.03),
  new THREE.Vector3(-0.1, 5.2, 0.16),
  new THREE.Vector3(0.27, 4.8, 0.2),
];
function Lightning({
  active,
  reduced,
  flash,
}: {
  active: boolean;
  reduced: boolean;
  flash: { value: number };
}) {
  const ref = useRef<THREE.Group>(null),
    light = useRef<THREE.PointLight>(null);
  const parts = useMemo(() => {
    const lines: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i < boltPoints.length - 1; i++)
      lines.push([boltPoints[i], boltPoints[i + 1]]);
    lines.push(
      [boltPoints[2], new THREE.Vector3(-1.2, 5.85, -0.2)],
      [boltPoints[3], new THREE.Vector3(0.9, 5.5, 0.18)],
    );
    return lines.map(([a, b]) => {
      const midpoint = a.clone().add(b).multiplyScalar(0.5),
        direction = b.clone().sub(a),
        quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction.clone().normalize(),
        );
      return { at: midpoint, length: direction.length(), quaternion };
    });
  }, []);
  useFrame(() => {
    const intensity = active && !reduced ? flash.value : 0;
    if (ref.current) ref.current.visible = intensity > 0.025;
    if (light.current) light.current.intensity = intensity * 28;
  });
  return (
    <>
      <group ref={ref} visible={false}>
        {parts.map((part, i) => (
          <mesh key={i} position={part.at} quaternion={part.quaternion}>
            <cylinderGeometry args={[0.028, 0.018, part.length, 5]} />
            <meshBasicMaterial color="#e9dcff" toneMapped={false} />
          </mesh>
        ))}
      </group>
      <pointLight
        ref={light}
        position={[0, 5.5, 0]}
        color="#c5bcff"
        intensity={0}
        distance={20}
        decay={1.6}
      />
    </>
  );
}
export default function Storm({
  active,
  reduced,
  quality,
}: {
  active: boolean;
  reduced: boolean;
  quality: string;
}) {
  const { gl } = useThree();
  const clouds = useRef<THREE.InstancedMesh>(null),
    rain = useRef<THREE.ShaderMaterial>(null);
  const lastThunder = useRef(false);
  const flash = useMemo(() => ({ value: 0 }), []),
    object = useMemo(() => new THREE.Object3D(), []);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uFlash: flash }),
    [flash],
  );
  const lobes = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const a = i * 2.4,
          r = 0.5 + (i % 4) * 0.55;
        return {
          x: Math.cos(a) * r,
          y: 7.6 + Math.sin(i * 3) * 0.38,
          z: Math.sin(a) * r - 0.5,
          sx: 1.2 + (i % 3) * 0.28,
          sy: 0.6 + (i % 2) * 0.25,
          sz: 1 + (i % 4) * 0.18,
        };
      }),
    [],
  );
  const drops = useMemo(() => {
    const count = quality === "HIGH" ? 260 : 120,
      points = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399,
        r = Math.sqrt((i + 0.5) / count) * 3.2,
        x = Math.sin(angle) * r,
        z = Math.cos(angle) * r - 0.4,
        y = (i * 0.731) % 7;
      points.set([x, y, z, x + 0.035, y, z], i * 6);
    }
    return points;
  }, [quality]);
  const tails = useMemo(
    () =>
      Float32Array.from({ length: drops.length / 3 }, (_, i) =>
        i % 2 ? -0.35 : 0,
      ),
    [drops],
  );
  useFrame(({ clock }) => {
    const time = reduced ? 0 : clock.elapsedTime;
    flash.value = active && !reduced ? stormFlash(time) : 0;
    uniforms.uTime.value = time;
    const thunder = flash.value > 0.2;
    if (gl.domElement.dataset.lightning !== String(thunder))
      gl.domElement.dataset.lightning = String(thunder);
    if (thunder && !lastThunder.current)
      window.dispatchEvent(new Event("zmonopoly-thunder"));
    lastThunder.current = thunder;
    if (clouds.current) {
      lobes.forEach((lobe, i) => {
        object.position.set(
          lobe.x + Math.sin(time * 0.08 + i) * 0.17,
          lobe.y + Math.sin(time * 0.1 + i) * 0.09,
          lobe.z,
        );
        object.scale.set(lobe.sx, lobe.sy, lobe.sz);
        object.rotation.set(0, time * 0.008 + i, 0);
        object.updateMatrix();
        clouds.current!.setMatrixAt(i, object.matrix);
      });
      clouds.current.instanceMatrix.needsUpdate = true;
    }
    if (rain.current) rain.current.uniforms.uTime.value = time;
  });
  return (
    <group name="castle-weather">
      <instancedMesh
        ref={clouds}
        args={[undefined, undefined, 16]}
        frustumCulled={false}
      >
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          uniforms={uniforms}
          transparent
          depthWrite={false}
          vertexShader={`varying vec2 tex;varying vec3 center;void main(){tex=uv;vec4 c=modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.);center=c.xyz;vec4 view=viewMatrix*c;view.xy+=position.xy*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));gl_Position=projectionMatrix*view;}`}
          fragmentShader={`varying vec2 tex;varying vec3 center;uniform float uTime;uniform float uFlash;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){vec2 p=tex*4.+center.xz*.35+vec2(uTime*.014,0.);float n=noise(p)*.6+noise(p*2.)*.28+noise(p*4.)*.12;float edge=1.-smoothstep(.35,1.,length((tex-.5)*2.));float alpha=edge*smoothstep(.2,.65,n)*.8;if(alpha<.015)discard;vec3 shade=mix(vec3(.075,.06,.12),vec3(.28,.25,.37),n*.8+tex.y*.12);shade+=uFlash*vec3(.48,.43,.68);gl_FragColor=vec4(shade,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}
        />
      </instancedMesh>
      {active && !reduced && quality !== "LOW" && (
        <lineSegments name="castle-rain" frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[drops, 3]} />
            <bufferAttribute attach="attributes-tail" args={[tails, 1]} />
          </bufferGeometry>
          <shaderMaterial
            ref={rain}
            transparent
            depthWrite={false}
            uniforms={{ uTime: { value: 0 } }}
            vertexShader={`uniform float uTime;attribute float tail;void main(){vec3 p=position;p.y=mod(p.y-uTime*4.2+700.,7.)+tail;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`}
            fragmentShader={`void main(){gl_FragColor=vec4(.65,.68,.92,.24);}`}
          />
        </lineSegments>
      )}
      <Lightning active={active} reduced={reduced} flash={flash} />
    </group>
  );
}
