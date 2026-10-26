import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
export default function Water({ reduced }: { reduced: boolean }) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, dt) => {
    if (!reduced) uniforms.uTime.value += Math.min(dt, 0.1);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]}>
      <planeGeometry args={[250, 250]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`varying vec2 point;void main(){point=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec2 point;uniform float uTime;void main(){float radius=length(point);float ripple=sin(radius*4.-uTime*.6+sin(point.x*.4)*.5);float wave=sin(point.x*.8+point.y*.5+uTime*.22);float shore=exp(-abs(radius-17.)*.3);vec3 base=mix(vec3(.105,.071,.18),vec3(.19,.13,.28),.5+.5*wave);base+=vec3(.21,.11,.24)*shore*pow(max(0.,ripple),10.)*.45;gl_FragColor=vec4(base,1.);}`}
      />
    </mesh>
  );
}
