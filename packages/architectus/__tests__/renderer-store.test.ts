import { describe, test, expect, beforeEach } from 'bun:test';
import {
  useRendererStore,
  getQuality,
  getQualityPreset,
} from '../src/store/useRendererStore';
import type { QualityTier } from '../src/store/useRendererStore';

// Reset the store between tests to avoid state leaking.
beforeEach(() => {
  useRendererStore.setState({
    cameraMode: 'falcon',
    playerPosition: [0, 5, -10],
    playerBranchId: null,
    cameraTransitioning: false,
    qualityTier: 'high',
    quality: getQualityPreset('high'),
    gpuBackend: null,
    selectedNodeId: null,
    hoveredNodeId: null,
    sceneReady: false,
    loading: true,
    loadingProgress: 0,
    fps: 0,
    drawCalls: 0,
    triangles: 0,
    generatedAssets: null,
  });
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  test('camera defaults to falcon mode', () => {
    expect(useRendererStore.getState().cameraMode).toBe('falcon');
  });

  test('quality tier defaults to high', () => {
    expect(useRendererStore.getState().qualityTier).toBe('high');
  });

  test('no node is selected or hovered', () => {
    expect(useRendererStore.getState().selectedNodeId).toBeNull();
    expect(useRendererStore.getState().hoveredNodeId).toBeNull();
  });

  test('scene is not ready and is loading', () => {
    expect(useRendererStore.getState().sceneReady).toBe(false);
    expect(useRendererStore.getState().loading).toBe(true);
  });

  test('performance counters start at zero', () => {
    const state = useRendererStore.getState();
    expect(state.fps).toBe(0);
    expect(state.drawCalls).toBe(0);
    expect(state.triangles).toBe(0);
  });

  test('gpuBackend is null before detection', () => {
    expect(useRendererStore.getState().gpuBackend).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Camera actions
// ---------------------------------------------------------------------------

describe('setCameraMode', () => {
  test('switches to player mode', () => {
    useRendererStore.getState().setCameraMode('player');
    expect(useRendererStore.getState().cameraMode).toBe('player');
  });

  test('sets cameraTransitioning to true', () => {
    useRendererStore.getState().setCameraMode('player');
    expect(useRendererStore.getState().cameraTransitioning).toBe(true);
  });

  test('switches back to falcon mode', () => {
    useRendererStore.getState().setCameraMode('player');
    useRendererStore.getState().setCameraMode('falcon');
    expect(useRendererStore.getState().cameraMode).toBe('falcon');
  });
});

// ---------------------------------------------------------------------------
// Node selection / hover
// ---------------------------------------------------------------------------

describe('selectNode', () => {
  test('selects a node by id', () => {
    useRendererStore.getState().selectNode('file-42');
    expect(useRendererStore.getState().selectedNodeId).toBe('file-42');
  });

  test('deselects when passed null', () => {
    useRendererStore.getState().selectNode('file-42');
    useRendererStore.getState().selectNode(null);
    expect(useRendererStore.getState().selectedNodeId).toBeNull();
  });
});

describe('hoverNode', () => {
  test('sets hovered node', () => {
    useRendererStore.getState().hoverNode('node-7');
    expect(useRendererStore.getState().hoveredNodeId).toBe('node-7');
  });

  test('clears hovered node', () => {
    useRendererStore.getState().hoverNode('node-7');
    useRendererStore.getState().hoverNode(null);
    expect(useRendererStore.getState().hoveredNodeId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Quality tier
// ---------------------------------------------------------------------------

describe('setQualityTier', () => {
  const tiers: QualityTier[] = ['ultra', 'high', 'medium', 'low', 'potato'];

  for (const tier of tiers) {
    test(`sets tier to ${tier} and updates quality settings`, () => {
      useRendererStore.getState().setQualityTier(tier);
      const state = useRendererStore.getState();
      expect(state.qualityTier).toBe(tier);
      expect(state.quality).toEqual(getQualityPreset(tier));
    });
  }
});

// ---------------------------------------------------------------------------
// Quality presets (getQualityPreset)
// ---------------------------------------------------------------------------

describe('getQualityPreset', () => {
  test('ultra has highest raymarch steps and all effects on', () => {
    const p = getQualityPreset('ultra');
    expect(p.maxRaymarchSteps).toBe(128);
    expect(p.postProcessing).toBe(true);
    expect(p.bloom).toBe(true);
    expect(p.shadows).toBe(true);
    expect(p.maxParticles).toBe(5000);
  });

  test('potato has lowest raymarch steps and all effects off', () => {
    const p = getQualityPreset('potato');
    expect(p.maxRaymarchSteps).toBe(16);
    expect(p.postProcessing).toBe(false);
    expect(p.bloom).toBe(false);
    expect(p.shadows).toBe(false);
    expect(p.maxParticles).toBe(100);
  });

  test('medium disables shadows but keeps post-processing', () => {
    const p = getQualityPreset('medium');
    expect(p.shadows).toBe(false);
    expect(p.postProcessing).toBe(true);
  });

  test('low disables post-processing and shadows', () => {
    const p = getQualityPreset('low');
    expect(p.postProcessing).toBe(false);
    expect(p.shadows).toBe(false);
  });

  test('lodBias increases as quality decreases', () => {
    const tiers: QualityTier[] = ['ultra', 'high', 'medium', 'low', 'potato'];
    let prevBias = -1;
    for (const tier of tiers) {
      const bias = getQualityPreset(tier).lodBias;
      expect(bias).toBeGreaterThan(prevBias);
      prevBias = bias;
    }
  });

  test('maxParticles decreases as quality decreases', () => {
    const tiers: QualityTier[] = ['ultra', 'high', 'medium', 'low', 'potato'];
    let prevParticles = Infinity;
    for (const tier of tiers) {
      const particles = getQualityPreset(tier).maxParticles;
      expect(particles).toBeLessThan(prevParticles);
      prevParticles = particles;
    }
  });
});

// ---------------------------------------------------------------------------
// getQuality helper
// ---------------------------------------------------------------------------

describe('getQuality', () => {
  test('returns current quality settings without subscribing', () => {
    useRendererStore.getState().setQualityTier('potato');
    const q = getQuality();
    expect(q.maxRaymarchSteps).toBe(16);
    expect(q.maxParticles).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Performance updates
// ---------------------------------------------------------------------------

describe('updatePerformance', () => {
  test('updates fps, drawCalls, and triangles', () => {
    useRendererStore.getState().updatePerformance(60, 150, 50000);
    const state = useRendererStore.getState();
    expect(state.fps).toBe(60);
    expect(state.drawCalls).toBe(150);
    expect(state.triangles).toBe(50000);
  });
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('setLoading', () => {
  test('sets loading true with explicit progress', () => {
    useRendererStore.getState().setLoading(true, 42);
    const state = useRendererStore.getState();
    expect(state.loading).toBe(true);
    expect(state.loadingProgress).toBe(42);
  });

  test('sets loading false defaults progress to 100', () => {
    useRendererStore.getState().setLoading(false);
    const state = useRendererStore.getState();
    expect(state.loading).toBe(false);
    expect(state.loadingProgress).toBe(100);
  });

  test('sets loading true without progress defaults to 0', () => {
    useRendererStore.getState().setLoading(true);
    const state = useRendererStore.getState();
    expect(state.loading).toBe(true);
    expect(state.loadingProgress).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// GPU backend
// ---------------------------------------------------------------------------

describe('setGpuBackend', () => {
  test('sets webgpu backend', () => {
    useRendererStore.getState().setGpuBackend('webgpu');
    expect(useRendererStore.getState().gpuBackend).toBe('webgpu');
  });

  test('sets webgl2 backend', () => {
    useRendererStore.getState().setGpuBackend('webgl2');
    expect(useRendererStore.getState().gpuBackend).toBe('webgl2');
  });
});
