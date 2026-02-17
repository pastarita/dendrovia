/**
 * @dendrovia/architectus
 *
 * The Renderer - WebGPU/R3F engine for procedural dendrites.
 * "Macro-SDF, Micro-Mesh" — SDFs for static structure, instanced meshes for dynamic elements.
 */

// Core app
export { App } from './App';
export { BranchInstances } from './components/BranchInstances';
export { CameraRig } from './components/CameraRig';
// Components
export { DendriteWorld } from './components/DendriteWorld';
export { Lighting } from './components/Lighting';
export { MushroomInstances } from './components/MushroomInstances';
export { NodeInstances } from './components/NodeInstances';
export { PerformanceMonitor } from './components/PerformanceMonitor';
export { PostProcessing } from './components/PostProcessing';
export type {
  CacheableAssetLoader,
  GeneratedAssets,
  LoadGeneratedAssetsOptions,
} from './loader/AssetBridge';
// Loader — IMAGINARIUM asset bridge
export { loadGeneratedAssets } from './loader/AssetBridge';
export type { QualityTier } from './store/useRendererStore';
// Store
export { useRendererStore } from './store/useRendererStore';
// Systems
export { LSystem } from './systems/LSystem';
export type { BranchSegment, NodeMarker, TreeGeometry, TurtleState } from './systems/TurtleInterpreter';
export { TurtleInterpreter } from './systems/TurtleInterpreter';
