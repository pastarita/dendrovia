import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GeneratedAssets } from '../loader/AssetBridge';

/**
 * Quality tiers from T5 research: 5-tier adaptive quality system.
 * Each tier defines render settings for different GPU capabilities.
 */
export type QualityTier = 'ultra' | 'high' | 'medium' | 'low' | 'potato';

export interface QualitySettings {
  /** Device pixel ratio multiplier */
  dpr: [number, number];
  /** Max raymarch steps (SDF rendering) */
  maxRaymarchSteps: number;
  /** Enable post-processing effects */
  postProcessing: boolean;
  /** Enable bloom effect specifically */
  bloom: boolean;
  /** Max particle count */
  maxParticles: number;
  /** LOD bias (higher = more aggressive LOD) */
  lodBias: number;
  /** Enable shadows */
  shadows: boolean;
}

const QUALITY_PRESETS: Record<QualityTier, QualitySettings> = {
  ultra: {
    dpr: [1, 2],
    maxRaymarchSteps: 128,
    postProcessing: true,
    bloom: true,
    maxParticles: 5000,
    lodBias: 0,
    shadows: true,
  },
  high: {
    dpr: [1, 1.5],
    maxRaymarchSteps: 64,
    postProcessing: true,
    bloom: true,
    maxParticles: 2000,
    lodBias: 1,
    shadows: true,
  },
  medium: {
    dpr: [1, 1],
    maxRaymarchSteps: 48,
    postProcessing: true,
    bloom: true,
    maxParticles: 1000,
    lodBias: 2,
    shadows: false,
  },
  low: {
    dpr: [0.75, 0.75],
    maxRaymarchSteps: 32,
    postProcessing: false,
    bloom: false,
    maxParticles: 500,
    lodBias: 3,
    shadows: false,
  },
  potato: {
    dpr: [0.5, 0.5],
    maxRaymarchSteps: 16,
    postProcessing: false,
    bloom: false,
    maxParticles: 100,
    lodBias: 4,
    shadows: false,
  },
};

export type CameraMode = 'falcon' | 'player';

interface RendererState {
  // Camera
  cameraMode: CameraMode;
  playerPosition: [number, number, number];
  playerBranchId: string | null;
  cameraTransitioning: boolean;

  // Quality
  qualityTier: QualityTier;
  quality: QualitySettings;
  gpuBackend: 'webgpu' | 'webgl2' | null;

  // UI coordination
  isUiHovered: boolean;

  // Scene
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  sceneReady: boolean;
  loading: boolean;
  loadingProgress: number;

  // Performance
  fps: number;
  drawCalls: number;
  triangles: number;

  // Generated assets from IMAGINARIUM (null until loaded)
  generatedAssets: GeneratedAssets | null;

  // Actions
  setCameraMode: (mode: CameraMode) => void;
  setPlayerPosition: (pos: [number, number, number]) => void;
  setPlayerBranch: (branchId: string | null) => void;
  setQualityTier: (tier: QualityTier) => void;
  setGpuBackend: (backend: 'webgpu' | 'webgl2') => void;
  selectNode: (nodeId: string | null) => void;
  hoverNode: (nodeId: string | null) => void;
  setSceneReady: (ready: boolean) => void;
  setLoading: (loading: boolean, progress?: number) => void;
  updatePerformance: (fps: number, drawCalls: number, triangles: number) => void;
  setGeneratedAssets: (assets: GeneratedAssets) => void;
  setUiHovered: (hovered: boolean) => void;
}

export const useRendererStore = create<RendererState>()(
  subscribeWithSelector((set) => ({
    // Camera defaults
    cameraMode: 'falcon',
    playerPosition: [0, 5, -10],
    playerBranchId: null,
    cameraTransitioning: false,

    // Quality defaults (detected at startup)
    qualityTier: 'high',
    quality: QUALITY_PRESETS.high,
    gpuBackend: null,

    // UI coordination
    isUiHovered: false,

    // Scene defaults
    selectedNodeId: null,
    hoveredNodeId: null,
    sceneReady: false,
    loading: true,
    loadingProgress: 0,

    // Performance defaults
    fps: 0,
    drawCalls: 0,
    triangles: 0,

    // Generated assets (null until IMAGINARIUM assets are loaded)
    generatedAssets: null,

    // Actions
    setCameraMode: (mode) =>
      set({ cameraMode: mode, cameraTransitioning: true }),

    setPlayerPosition: (pos) =>
      set({ playerPosition: pos }),

    setPlayerBranch: (branchId) =>
      set({ playerBranchId: branchId }),

    setQualityTier: (tier) =>
      set({ qualityTier: tier, quality: QUALITY_PRESETS[tier] }),

    setGpuBackend: (backend) =>
      set({ gpuBackend: backend }),

    selectNode: (nodeId) =>
      set({ selectedNodeId: nodeId }),

    hoverNode: (nodeId) =>
      set({ hoveredNodeId: nodeId }),

    setSceneReady: (ready) =>
      set({ sceneReady: ready }),

    setLoading: (loading, progress) =>
      set({ loading, loadingProgress: progress ?? (loading ? 0 : 100) }),

    updatePerformance: (fps, drawCalls, triangles) =>
      set({ fps, drawCalls, triangles }),

    setGeneratedAssets: (assets) =>
      set({ generatedAssets: assets }),

    setUiHovered: (hovered) =>
      set({ isUiHovered: hovered }),
  }))
);

/** Get quality settings without subscribing (for useFrame loops) */
export function getQuality(): QualitySettings {
  return useRendererStore.getState().quality;
}

/** Get quality preset by tier name */
export function getQualityPreset(tier: QualityTier): QualitySettings {
  return QUALITY_PRESETS[tier];
}
