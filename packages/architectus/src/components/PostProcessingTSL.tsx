import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * POST-PROCESSING TSL (D9)
 *
 * WebGPU-native post-processing using Three.js Shading Language (TSL).
 * Replaces pmndrs/postprocessing (GLSL-only) when running on WebGPU backend.
 *
 * Effect chain:
 *   1. Scene pass → Bloom (UnrealBloom via TSL)
 *   2. Bloom → Chromatic Aberration (RGB shift)
 *   3. CA → Vignette (custom TSL function)
 *
 * TSL auto-compiles to WGSL for WebGPU (and can fallback to GLSL).
 * Effects are composed as a node graph via scene.outputNode.
 *
 * Note: Three.js TSL PostProcessing is r169+ and still evolving.
 * If imports fail at runtime, this component gracefully returns null.
 */

export function PostProcessingTSL() {
  const { scene, camera } = useThree();
  const initialized = useRef(false);
  const prevOutputNode = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Dynamic imports — these only exist in three/examples/jsm/tsl/
        const [{ bloom }, { rgbShift }, tsl, passModule] = await Promise.all([
          import('three/examples/jsm/tsl/display/BloomNode.js'),
          import('three/examples/jsm/tsl/display/RGBShiftNode.js'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          import('three/tsl' as any),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          import('three/nodes' as any),
        ]);

        if (cancelled) return;

        const { pass } = passModule;
        const { Fn, uv, distance, vec2, smoothstep } = tsl;

        // 1. Scene pass captures the rendered scene
        const scenePass = pass(scene, camera);

        // 2. Bloom — catches emissive >1.0 (rim glow, circuit lines)
        const bloomEffect = bloom(scenePass, 1.5, 0.1, 1.0);

        // 3. Chromatic aberration — subtle color fringing at edges
        const chromaticEffect = rgbShift(bloomEffect, 0.0005, 0);

        // 4. Vignette — custom TSL function (darken edges)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vignetteFn = Fn(([input]: any) => {
          const uvCoord = uv();
          const dist = distance(uvCoord, vec2(0.5, 0.5));
          const falloff = smoothstep(0.8, 0.3, dist);
          return input.mul(falloff);
        });

        const finalOutput = vignetteFn(chromaticEffect);

        if (cancelled) return;

        // Store previous outputNode for cleanup
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prevOutputNode.current = (scene as any).outputNode ?? null;

        // Assign to scene — Three.js renderer picks this up automatically
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (scene as any).outputNode = finalOutput;
        initialized.current = true;
      } catch (err) {
        // TSL modules unavailable — graceful skip
        console.warn('[ARCHITECTUS/D9] TSL PostProcessing unavailable:', err);
      }
    })();

    return () => {
      cancelled = true;
      // Restore previous output node on unmount
      if (initialized.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (scene as any).outputNode = prevOutputNode.current ?? null;
        initialized.current = false;
      }
    };
  }, [scene, camera]);

  // TSL post-processing is configured via scene.outputNode — no JSX needed
  return null;
}
