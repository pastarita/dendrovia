/**
 * ARCHITECTUS Dendrite Integration — Barrel Export
 *
 * Provides runtime bridge, collectors, and actions for live observation
 * of ARCHITECTUS renderer subsystems through the dendrite surface.
 */

export { ArchitectusRuntimeBridge } from './bridge.js';
export type { ArchitectusBridgeConfig } from './bridge.js';
export {
  collectAssetBridge,
  collectDendriteWorld,
  collectCameraRig,
  collectPerformanceMonitor,
  collectGPUDetection,
  collectPostProcessing,
  collectLighting,
  collectInstances,
  collectSystems,
} from './collectors.js';
export type { RendererSnapshot } from './collectors.js';
export { qualityActions, cameraActions } from './actions.js';
