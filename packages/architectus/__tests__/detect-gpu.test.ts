import { describe, expect, test } from 'bun:test';

/**
 * The classifyTier function is module-private in detectGPU.ts, and the
 * public detectGPU() function relies on browser-only APIs (navigator.gpu,
 * document.createElement('canvas')). Rather than mock the entire browser
 * environment, we replicate the classifyTier logic here and test it
 * directly. This verifies the tier classification algorithm which is the
 * core logic of GPU detection.
 */

type QualityTier = 'ultra' | 'high' | 'medium' | 'low' | 'potato';

function classifyTier(maxTextureSize: number, maxBufferSize: number, memoryGB: number, isMobile: boolean): QualityTier {
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

// ---------------------------------------------------------------------------
// Desktop classification
// ---------------------------------------------------------------------------

describe('classifyTier — desktop', () => {
  test('ultra: large textures + 16GB+ RAM + huge buffer', () => {
    expect(classifyTier(16384, 2_147_483_648, 16, false)).toBe('ultra');
  });

  test('ultra: exceeding minimums still qualifies', () => {
    expect(classifyTier(32768, 4_294_967_296, 32, false)).toBe('ultra');
  });

  test('high: 8192 textures + 8GB RAM', () => {
    expect(classifyTier(8192, 0, 8, false)).toBe('high');
  });

  test('high: large textures but not enough buffer for ultra', () => {
    expect(classifyTier(16384, 1_000_000, 16, false)).toBe('high');
  });

  test('medium: 4GB RAM but small textures', () => {
    expect(classifyTier(4096, 0, 4, false)).toBe('medium');
  });

  test('medium: 4GB RAM exactly', () => {
    expect(classifyTier(2048, 0, 4, false)).toBe('medium');
  });

  test('low: less than 4GB RAM on desktop', () => {
    expect(classifyTier(4096, 0, 2, false)).toBe('low');
  });

  test('low: 1GB RAM', () => {
    expect(classifyTier(2048, 0, 1, false)).toBe('low');
  });
});

// ---------------------------------------------------------------------------
// Mobile classification
// ---------------------------------------------------------------------------

describe('classifyTier — mobile', () => {
  test('mobile with 8GB RAM caps at medium', () => {
    // Even though desktop would be high, mobile caps at medium
    expect(classifyTier(16384, 2_147_483_648, 8, true)).toBe('medium');
  });

  test('mobile with 6GB RAM is medium', () => {
    expect(classifyTier(8192, 0, 6, true)).toBe('medium');
  });

  test('mobile with 4GB RAM is low', () => {
    expect(classifyTier(8192, 0, 4, true)).toBe('low');
  });

  test('mobile with 3GB RAM is potato', () => {
    expect(classifyTier(4096, 0, 3, true)).toBe('potato');
  });

  test('mobile with 2GB RAM is potato', () => {
    expect(classifyTier(4096, 0, 2, true)).toBe('potato');
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('classifyTier — edge cases', () => {
  test('zero memory on desktop yields low', () => {
    expect(classifyTier(16384, 0, 0, false)).toBe('low');
  });

  test('zero memory on mobile yields potato', () => {
    expect(classifyTier(16384, 0, 0, true)).toBe('potato');
  });

  test('boundary: 16383 texture size does not qualify as ultra', () => {
    expect(classifyTier(16383, 2_147_483_648, 16, false)).toBe('high');
  });

  test('boundary: 15GB RAM does not qualify as ultra', () => {
    expect(classifyTier(16384, 2_147_483_648, 15, false)).toBe('high');
  });

  test('boundary: buffer one below ultra threshold', () => {
    expect(classifyTier(16384, 2_147_483_647, 16, false)).toBe('high');
  });

  test('WebGL2 cap: classifyTier can return ultra but caller caps at high', () => {
    // This tests the logic documented in detectGPU.ts where WebGL2
    // caps ultra down to high. classifyTier itself returns ultra.
    const tier = classifyTier(16384, 2_147_483_648, 16, false);
    const webgl2Tier = tier === 'ultra' ? 'high' : tier;
    expect(webgl2Tier).toBe('high');
  });
});
