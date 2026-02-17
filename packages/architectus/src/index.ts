/**
 * @dendrovia/architectus
 *
 * The Renderer - WebGPU/R3F engine for procedural dendrites.
 * "Macro-SDF, Micro-Mesh" — SDFs for static structure, instanced meshes for dynamic elements.
 */

// Core app
export { App } from './App';

// Store
export { useRendererStore } from './store/useRendererStore';

// Components
export { DendriteWorld } from './components/DendriteWorld';
export { BranchInstances } from './components/BranchInstances';
export { NodeInstances } from './components/NodeInstances';
export { MushroomInstances } from './components/MushroomInstances';
export { CameraRig } from './components/CameraRig';
export { PostProcessing } from './components/PostProcessing';
export { Lighting } from './components/Lighting';
export { PerformanceMonitor } from './components/PerformanceMonitor';
export { ParticleInstances } from './components/ParticleInstances';
export { SegmentOverlay } from './components/SegmentOverlay';
export { ErrorBoundary } from './components/ErrorBoundary';

// Systems
export { LSystem } from './systems/LSystem';
export { TurtleInterpreter } from './systems/TurtleInterpreter';
export { SpatialIndex } from './systems/SpatialIndex';
export { ParticleSystem, FIREFLY_CONFIG, BURST_CONFIG } from './systems/ParticleSystem';
export { mapNodesToSegments } from './systems/SegmentMapper';
export type { BranchSegment, NodeMarker, TreeGeometry, TurtleState } from './systems/TurtleInterpreter';
export type { NearestSegmentResult } from './systems/SpatialIndex';
export type { Particle, EmitterConfig } from './systems/ParticleSystem';
export type { QualityTier, QualitySettings } from './store/useRendererStore';

// Renderer
export { createWebGPURenderer } from './renderer/createRenderer';
export type { RendererConfig } from './renderer/createRenderer';
export { detectGPU } from './renderer/detectGPU';
export type { GPUCapabilities } from './renderer/detectGPU';

// Loader — IMAGINARIUM asset bridge
export { loadGeneratedAssets } from './loader/AssetBridge';
export type {
  GeneratedAssets,
  CacheableAssetLoader,
  LoadGeneratedAssetsOptions,
} from './loader/AssetBridge';
