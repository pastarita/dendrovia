import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { ProceduralPalette } from '@dendrovia/shared';
import { getQuality } from '../store/useRendererStore';

/**
 * SDF BACKDROP (D5)
 *
 * Fullscreen quad running an IMAGINARIUM raymarching shader.
 *
 * D5 enhancements:
 *   - maxRaymarchSteps wired from quality tier (adaptive LOD)
 *   - lodThreshold + lodTransitionWidth uniforms for distance-based SDF/mesh blending
 *   - depthWrite enabled so SDF can participate in depth compositing
 *   - Camera-relative uniforms updated per frame
 *
 * The IMAGINARIUM shader is expected to honor u_maxSteps and u_lodThreshold
 * when present. Shaders that don't declare them simply ignore the uniforms.
 */

interface SDFBackdropProps {
  shaderSource: string;
  palette: ProceduralPalette;
}

/** Parse a hex color string to normalized RGB floats */
function hexToRGB(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

/** LOD threshold distances per lodBias tier */
const LOD_THRESHOLDS = [80, 50, 35, 20, 10] as const;
const LOD_TRANSITION_WIDTHS = [20, 15, 10, 8, 5] as const;

const VERTEX_SHADER = `
precision highp float;
attribute vec3 position;
void main() {
  gl_Position = vec4(position.xy, 0.999, 1.0);
}
`;

export function SDFBackdrop({ shaderSource, palette }: SDFBackdropProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const material = useMemo(() => {
    const c1 = hexToRGB(palette.primary);
    const c2 = hexToRGB(palette.secondary);
    const c3 = hexToRGB(palette.accent);
    const glow = hexToRGB(palette.glow);
    const bg = hexToRGB(palette.background);

    const q = getQuality();

    return new THREE.RawShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: shaderSource,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(size.width, size.height) },
        u_color1: { value: new THREE.Vector3(c1[0], c1[1], c1[2]) },
        u_color2: { value: new THREE.Vector3(c2[0], c2[1], c2[2]) },
        u_color3: { value: new THREE.Vector3(c3[0], c3[1], c3[2]) },
        u_glow: { value: new THREE.Vector3(glow[0], glow[1], glow[2]) },
        u_background: { value: new THREE.Vector3(bg[0], bg[1], bg[2]) },
        // D5: LOD pipeline uniforms
        u_maxSteps: { value: q.maxRaymarchSteps },
        u_lodThreshold: { value: LOD_THRESHOLDS[q.lodBias] ?? 50 },
        u_lodTransitionWidth: { value: LOD_TRANSITION_WIDTHS[q.lodBias] ?? 15 },
        u_cameraPos: { value: new THREE.Vector3() },
      },
      depthWrite: true,
      depthTest: true,
    });
  }, [shaderSource, palette]);

  // Update per-frame uniforms: time, camera, quality-driven LOD
  useFrame((state, delta) => {
    const uniforms = material.uniforms;
    uniforms.time.value += delta;
    uniforms.u_cameraPos.value.copy(state.camera.position);

    // Update quality-driven uniforms each frame (they change on tier shift)
    const q = getQuality();
    uniforms.u_maxSteps.value = q.maxRaymarchSteps;
    uniforms.u_lodThreshold.value = LOD_THRESHOLDS[q.lodBias] ?? 50;
    uniforms.u_lodTransitionWidth.value = LOD_TRANSITION_WIDTHS[q.lodBias] ?? 15;
  });

  // Update resolution on canvas resize
  useMemo(() => {
    if (material.uniforms.resolution) {
      material.uniforms.resolution.value.set(size.width, size.height);
    }
  }, [size, material]);

  return (
    <mesh ref={meshRef} renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
