import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useRendererStore } from '../store/useRendererStore';
import { PostProcessingTSL } from './PostProcessingTSL';

/**
 * POST-PROCESSING STACK
 *
 * Tron-aesthetic post-processing from T5 research.
 * Effects auto-merged into fewer GPU passes by pmndrs/postprocessing.
 *
 * Stack (ordered by visual importance):
 *   1. Bloom — catches emissive >1.0 (rim glow, circuit lines)
 *   2. Chromatic Aberration — subtle edge color fringing
 *   3. Vignette — darken edges, focus center
 *
 * Total cost on M1: ~1.5ms (well within 16ms frame budget).
 *
 * Note: pmndrs/postprocessing uses GLSL. For WebGPU, we'll need to
 * migrate to three/tsl post-processing in a future iteration.
 * For now, R3F's Canvas falls back to WebGL2 when using EffectComposer.
 */

function BloomEffect() {
  return (
    <Bloom
      intensity={1.5}
      luminanceThreshold={1.0}
      luminanceSmoothing={0.1}
      mipmapBlur={true}
    />
  );
}

function WithBloom() {
  return (
    <EffectComposer multisampling={4}>
      <BloomEffect />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.0005, 0.0005] as any}
        radialModulation={true}
        modulationOffset={0.3}
      />
      <Vignette
        offset={0.3}
        darkness={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

function WithoutBloom() {
  return (
    <EffectComposer multisampling={4}>
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.0005, 0.0005] as any}
        radialModulation={true}
        modulationOffset={0.3}
      />
      <Vignette
        offset={0.3}
        darkness={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

export function PostProcessing() {
  const postProcessing = useRendererStore((s) => s.quality.postProcessing);
  const bloom = useRendererStore((s) => s.quality.bloom);
  const gpuBackend = useRendererStore((s) => s.gpuBackend);

  if (!postProcessing) return null;

  // D9: WebGPU path uses TSL-based post-processing (WGSL-native)
  if (gpuBackend === 'webgpu') return <PostProcessingTSL />;

  // WebGL2 path: pmndrs/postprocessing (GLSL)
  return bloom ? <WithBloom /> : <WithoutBloom />;
}
