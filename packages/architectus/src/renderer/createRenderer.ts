/**
 * RENDERER FACTORY (D2)
 *
 * Conditionally creates a WebGPU or WebGL2 renderer based on GPU detection.
 * R3F's Canvas accepts a `gl` callback that receives the canvas element
 * and returns a renderer instance.
 *
 * Phase 1: WebGPU renderer without pmndrs post-processing (GLSL-only).
 *          PostProcessing component skips itself when WebGPU is active.
 * Phase 2 (D9): TSL-based post-processing for WebGPU path.
 */

import { createLogger } from '@dendrovia/shared/logger';
import type { GPUCapabilities } from './detectGPU';

const log = createLogger('ARCHITECTUS', 'renderer');

/**
 * Configuration for the renderer factory.
 * Pass the detected GPU capabilities so we know which backend to use.
 */
export interface RendererConfig {
  /** Result from detectGPU() */
  gpuCaps: GPUCapabilities;
  /** Canvas element from R3F */
  canvas: HTMLCanvasElement;
  /** Antialias setting */
  antialias?: boolean;
  /** Power preference */
  powerPreference?: 'high-performance' | 'low-power' | 'default';
}

/**
 * Creates the appropriate Three.js renderer based on GPU capabilities.
 *
 * When WebGPU is available, imports WebGPURenderer dynamically to avoid
 * bundling it when not needed. Falls back to standard WebGLRenderer.
 */
export async function createWebGPURenderer(config: RendererConfig) {
  const { canvas, antialias = true, powerPreference = 'high-performance' } = config;

  if (config.gpuCaps.backend === 'webgpu') {
    try {
      // Dynamic import — only loads when WebGPU is the detected backend.
      // three/webgpu has no .d.ts yet so we use an untyped import.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const webgpuModule = await import('three/webgpu' as any) as any;
      const WebGPURenderer = webgpuModule.WebGPURenderer;

      const renderer = new WebGPURenderer({
        canvas,
        antialias,
        powerPreference,
        alpha: false,
      });

      await renderer.init();
      return renderer;
    } catch (err) {
      log.warn({ err }, 'WebGPU renderer init failed, falling back to WebGL2');
      // Fall through to WebGL2
    }
  }

  // WebGL2 fallback — standard path
  const THREE = await import('three');
  return new THREE.WebGLRenderer({
    canvas,
    antialias,
    powerPreference,
    alpha: false,
  });
}
