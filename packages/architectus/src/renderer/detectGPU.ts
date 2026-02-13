import type { QualityTier } from '../store/useRendererStore';

export interface GPUCapabilities {
  backend: 'webgpu' | 'webgl2';
  tier: QualityTier;
  maxTextureSize: number;
  maxBufferSize: number;
  deviceMemoryGB: number;
  isMobile: boolean;
}

/**
 * Two-phase GPU detection from T5 research.
 * Phase 1 (static): Probes navigator.gpu, adapter limits, device memory.
 * Phase 2 (dynamic): Uses PerformanceMonitor in first 2-5s to refine tier.
 */
export async function detectGPU(): Promise<GPUCapabilities> {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const deviceMemoryGB = (navigator as any).deviceMemory ?? 4;

  // Try WebGPU first
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
      });

      if (adapter) {
        const limits = adapter.limits;
        const maxTextureSize = limits.maxTextureDimension2D;
        const maxBufferSize = Number(limits.maxBufferSize);

        const tier = classifyTier(maxTextureSize, maxBufferSize, deviceMemoryGB, isMobile);

        return {
          backend: 'webgpu',
          tier,
          maxTextureSize,
          maxBufferSize,
          deviceMemoryGB,
          isMobile,
        };
      }
    } catch {
      // WebGPU adapter request failed, fall through to WebGL2
    }
  }

  // Fallback: WebGL2
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');

  if (gl) {
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const tier = classifyTier(maxTextureSize, 0, deviceMemoryGB, isMobile);
    canvas.remove();

    return {
      backend: 'webgl2',
      tier: tier === 'ultra' ? 'high' : tier, // Cap at high for WebGL2
      maxTextureSize,
      maxBufferSize: 0,
      deviceMemoryGB,
      isMobile,
    };
  }

  canvas.remove();

  // Worst case
  return {
    backend: 'webgl2',
    tier: 'potato',
    maxTextureSize: 4096,
    maxBufferSize: 0,
    deviceMemoryGB,
    isMobile,
  };
}

function classifyTier(
  maxTextureSize: number,
  maxBufferSize: number,
  memoryGB: number,
  isMobile: boolean
): QualityTier {
  if (isMobile) {
    if (memoryGB >= 6) return 'medium';
    if (memoryGB >= 4) return 'low';
    return 'potato';
  }

  // Desktop classification
  if (maxTextureSize >= 16384 && memoryGB >= 16 && maxBufferSize >= 2_147_483_648) {
    return 'ultra';
  }
  if (maxTextureSize >= 8192 && memoryGB >= 8) {
    return 'high';
  }
  if (memoryGB >= 4) {
    return 'medium';
  }
  return 'low';
}
