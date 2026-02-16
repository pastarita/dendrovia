/**
 * ARCHITECTUS Collectors — Per-node metric extraction
 *
 * Pure functions that read from useRendererStore state and return RuntimeNodeState.
 * Each collector maps to a specific node ID in the architectus fixture.
 */

import type { RuntimeNodeState } from '../../../../lib/dendrite/types.js';
import { deriveHealth } from '../../../../lib/dendrite/health.js';
import type { QualityTier, CameraMode } from '../store/useRendererStore.js';
import type { GeneratedAssets } from '../loader/AssetBridge.js';

export type { RuntimeNodeState };

/** Subset of useRendererStore state needed by collectors. */
export interface RendererSnapshot {
  sceneReady: boolean;
  loading: boolean;
  loadingProgress: number;
  fps: number;
  drawCalls: number;
  triangles: number;
  cameraMode: CameraMode;
  qualityTier: QualityTier;
  gpuBackend: 'webgpu' | 'webgl2' | null;
  quality: {
    postProcessing: boolean;
    bloom: boolean;
  };
  generatedAssets: GeneratedAssets | null;
}

function now(): number {
  return Date.now();
}

export function collectAssetBridge(state: RendererSnapshot): RuntimeNodeState {
  const assets = state.generatedAssets;
  const loaded = assets !== null;
  const assetCount = loaded
    ? Object.keys(assets.palettes).length +
      Object.keys(assets.shaders).length +
      (assets.lsystem ? 1 : 0) +
      (assets.noise ? 1 : 0) +
      (assets.mycology ? 1 : 0) +
      (assets.meshes ? assets.meshes.size : 0) +
      (assets.storyArc ? 1 : 0)
    : 0;
  const segments = assets?.storyArc?.segments.length ?? 0;

  return {
    nodeId: 'arch-asset-bridge',
    health: deriveHealth([
      { check: () => loaded, result: 'healthy' },
      { check: () => state.loading, result: 'degraded' },
    ]),
    metrics: [
      { key: 'loaded', value: loaded ? 'yes' : 'no' },
      { key: 'assets', value: assetCount },
      { key: 'progress', value: Math.round(state.loadingProgress), unit: '%' },
      ...(segments > 0 ? [{ key: 'segments', value: segments }] : []),
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectDendriteWorld(state: RendererSnapshot): RuntimeNodeState {
  return {
    nodeId: 'arch-dendrite-world',
    health: deriveHealth([
      { check: () => state.sceneReady, result: 'healthy' },
      { check: () => state.loading, result: 'degraded' },
    ]),
    metrics: [
      { key: 'ready', value: state.sceneReady ? 'yes' : 'no' },
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectCameraRig(state: RendererSnapshot): RuntimeNodeState {
  return {
    nodeId: 'arch-camera',
    health: 'healthy',
    metrics: [
      { key: 'mode', value: state.cameraMode },
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectPerformanceMonitor(state: RendererSnapshot): RuntimeNodeState {
  return {
    nodeId: 'arch-perf',
    health: deriveHealth([
      { check: () => state.fps < 15, result: 'error' },
      { check: () => state.fps < 30, result: 'degraded' },
      { check: () => state.fps >= 30, result: 'healthy' },
    ]),
    metrics: [
      { key: 'fps', value: Math.round(state.fps) },
      { key: 'drawCalls', value: state.drawCalls },
      { key: 'triangles', value: state.triangles },
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectGPUDetection(state: RendererSnapshot): RuntimeNodeState {
  return {
    nodeId: 'arch-gpu',
    health: deriveHealth([
      { check: () => state.gpuBackend !== null, result: 'healthy' },
    ]),
    metrics: [
      { key: 'backend', value: state.gpuBackend ?? 'detecting' },
      { key: 'quality', value: state.qualityTier },
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectPostProcessing(state: RendererSnapshot): RuntimeNodeState {
  return {
    nodeId: 'arch-postfx',
    health: state.quality.postProcessing ? 'healthy' : 'idle',
    metrics: [
      { key: 'enabled', value: state.quality.postProcessing ? 'yes' : 'no' },
      { key: 'bloom', value: state.quality.bloom ? 'on' : 'off' },
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectLighting(): RuntimeNodeState {
  return {
    nodeId: 'arch-lighting',
    health: 'healthy',
    metrics: [
      { key: 'status', value: 'active' },
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectInstances(
  state: RendererSnapshot,
): RuntimeNodeState[] {
  const ready = state.sceneReady && state.generatedAssets !== null;
  const health = ready ? 'healthy' as const : 'idle' as const;

  return [
    {
      nodeId: 'arch-branch-inst',
      health,
      metrics: [{ key: 'status', value: ready ? 'ready' : 'waiting' }],
      actions: [],
      lastUpdated: now(),
    },
    {
      nodeId: 'arch-node-inst',
      health,
      metrics: [{ key: 'status', value: ready ? 'ready' : 'waiting' }],
      actions: [],
      lastUpdated: now(),
    },
    {
      nodeId: 'arch-mushroom-inst',
      health,
      metrics: [{ key: 'status', value: ready ? 'ready' : 'waiting' }],
      actions: [],
      lastUpdated: now(),
    },
  ];
}

export function collectSystems(): RuntimeNodeState[] {
  const t = now();
  return [
    {
      nodeId: 'arch-lsystem',
      health: 'healthy',
      metrics: [{ key: 'status', value: 'ready' }],
      actions: [],
      lastUpdated: t,
    },
    {
      nodeId: 'arch-turtle',
      health: 'healthy',
      metrics: [{ key: 'status', value: 'ready' }],
      actions: [],
      lastUpdated: t,
    },
    {
      nodeId: 'arch-segment-mapper',
      health: 'healthy',
      metrics: [{ key: 'status', value: 'ready' }],
      actions: [],
      lastUpdated: t,
    },
  ];
}
