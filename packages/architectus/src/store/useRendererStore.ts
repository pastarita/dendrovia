import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GeneratedAssets } from '../loader/AssetBridge';
import type { SpatialIndex } from '../systems/SpatialIndex';

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

/** Ordered tiers for adaptive stepping */
const TIER_ORDER: QualityTier[] = ['potato', 'low', 'medium', 'high', 'ultra'];

export type CameraMode = 'falcon' | 'player';

/**
 * Adaptive quality tuning config (D3).
 * Hysteresis prevents oscillation between tiers.
 */
const ADAPTIVE_CONFIG = {
  /** FPS below this for downgrade threshold triggers tier decrease */
  downgradeFps: 45,
  /** FPS above this for upgrade threshold triggers tier increase */
  upgradeFps: 55,
  /** Consecutive low samples needed before downgrade */
  downgradeSamples: 3,
  /** Consecutive high samples needed before upgrade */
  upgradeSamples: 5,
  /** Ring buffer size for FPS history */
  historySize: 10,
} as const;

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
  /** Whether auto-tuning is enabled (can be locked by user) */
  autoQuality: boolean;
  /** Maximum tier the auto-tuner can reach (set at startup from GPU detection) */
  maxAutoTier: QualityTier;

  // Adaptive quality (D3)
  /** Ring buffer of recent FPS samples */
  fpsHistory: number[];
  /** Count of consecutive samples below downgrade threshold */
  consecutiveLow: number;
  /** Count of consecutive samples above upgrade threshold */
  consecutiveHigh: number;

  // UI coordination
  isUiHovered: boolean;

  // Scene
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  sceneReady: boolean;
  loading: boolean;
  loadingProgress: number;

  // D8: Encounter feedback
  /** Node currently under encounter (emissive pulse target) */
  encounterNodeId: string | null;
  /** Position of the most recent damage event (for particle burst) */
  damagePosition: [number, number, number] | null;

  // Performance
  fps: number;
  drawCalls: number;
  triangles: number;

  // Generated assets from IMAGINARIUM (null until loaded)
  generatedAssets: GeneratedAssets | null;

  // SDF backdrop toggle
  sdfBackdrop: boolean;

  // D4: Spatial index ref for surface camera queries
  spatialIndex: SpatialIndex | null;

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
  toggleSdfBackdrop: () => void;
  /** D4: Store spatial index for surface camera access */
  setSpatialIndex: (index: SpatialIndex | null) => void;
  /** D8: Set encounter node for emissive pulse */
  setEncounterNode: (nodeId: string | null) => void;
  /** D8: Set damage position for particle burst */
  setDamagePosition: (pos: [number, number, number] | null) => void;
  /** D3: Evaluate FPS history and shift tier if thresholds met */
  autoTuneQuality: () => void;
  /** Lock quality tier (disable auto-tuning) */
  lockQuality: (tier: QualityTier) => void;
}

export const useRendererStore = create<RendererState>()(
  subscribeWithSelector((set, get) => ({
    // Camera defaults
    cameraMode: 'falcon',
    playerPosition: [0, 5, -10],
    playerBranchId: null,
    cameraTransitioning: false,

    // Quality defaults (detected at startup)
    qualityTier: 'high',
    quality: QUALITY_PRESETS.high,
    gpuBackend: null,
    autoQuality: true,
    maxAutoTier: 'ultra',

    // Adaptive quality (D3)
    fpsHistory: [],
    consecutiveLow: 0,
    consecutiveHigh: 0,

    // UI coordination
    isUiHovered: false,

    // Scene defaults
    selectedNodeId: null,
    hoveredNodeId: null,
    sceneReady: false,
    loading: true,
    loadingProgress: 0,

    // D8: Encounter feedback
    encounterNodeId: null,
    damagePosition: null,

    // Performance defaults
    fps: 0,
    drawCalls: 0,
    triangles: 0,

    // Generated assets (null until IMAGINARIUM assets are loaded)
    generatedAssets: null,

    // SDF backdrop (off by default)
    sdfBackdrop: false,

    // D4: Spatial index
    spatialIndex: null,

    // Actions
    setCameraMode: (mode) =>
      set({ cameraMode: mode, cameraTransitioning: true }),

    setPlayerPosition: (pos) =>
      set({ playerPosition: pos }),

    setPlayerBranch: (branchId) =>
      set({ playerBranchId: branchId }),

    setQualityTier: (tier) =>
      set({
        qualityTier: tier,
        quality: QUALITY_PRESETS[tier],
        maxAutoTier: tier, // Initial detection sets the ceiling
      }),

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

    updatePerformance: (fps, drawCalls, triangles) => {
      const state = get();
      // Append to FPS history ring buffer
      const history = [...state.fpsHistory, fps];
      if (history.length > ADAPTIVE_CONFIG.historySize) {
        history.shift();
      }
      set({ fps, drawCalls, triangles, fpsHistory: history });
    },

    setGeneratedAssets: (assets) =>
      set({ generatedAssets: assets }),

    setUiHovered: (hovered) =>
      set({ isUiHovered: hovered }),

    toggleSdfBackdrop: () =>
      set((state) => ({ sdfBackdrop: !state.sdfBackdrop })),

    setSpatialIndex: (index) =>
      set({ spatialIndex: index }),

    setEncounterNode: (nodeId) =>
      set({ encounterNodeId: nodeId }),

    setDamagePosition: (pos) =>
      set({ damagePosition: pos }),

    autoTuneQuality: () => {
      const state = get();
      if (!state.autoQuality) return;
      if (state.fpsHistory.length < 3) return; // Need minimum samples

      const currentFps = state.fps;
      const currentIdx = TIER_ORDER.indexOf(state.qualityTier);
      const maxIdx = TIER_ORDER.indexOf(state.maxAutoTier);

      if (currentFps < ADAPTIVE_CONFIG.downgradeFps) {
        const newLow = state.consecutiveLow + 1;
        if (newLow >= ADAPTIVE_CONFIG.downgradeSamples && currentIdx > 0) {
          // Downgrade
          const newTier = TIER_ORDER[currentIdx - 1]!;
          set({
            qualityTier: newTier,
            quality: QUALITY_PRESETS[newTier],
            consecutiveLow: 0,
            consecutiveHigh: 0,
          });
        } else {
          set({ consecutiveLow: newLow, consecutiveHigh: 0 });
        }
      } else if (currentFps > ADAPTIVE_CONFIG.upgradeFps) {
        const newHigh = state.consecutiveHigh + 1;
        if (newHigh >= ADAPTIVE_CONFIG.upgradeSamples && currentIdx < maxIdx) {
          // Upgrade
          const newTier = TIER_ORDER[currentIdx + 1]!;
          set({
            qualityTier: newTier,
            quality: QUALITY_PRESETS[newTier],
            consecutiveLow: 0,
            consecutiveHigh: 0,
          });
        } else {
          set({ consecutiveHigh: newHigh, consecutiveLow: 0 });
        }
      } else {
        // In the sweet spot — reset counters
        set({ consecutiveLow: 0, consecutiveHigh: 0 });
      }
    },

    lockQuality: (tier) =>
      set({
        qualityTier: tier,
        quality: QUALITY_PRESETS[tier],
        autoQuality: false,
        consecutiveLow: 0,
        consecutiveHigh: 0,
      }),
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
