/**
 * ARCHITECTUS Dendrite Integration — Barrel Export
 *
 * Provides runtime bridge, collectors, and actions for live observation
 * of ARCHITECTUS renderer subsystems through the dendrite surface.
 */

export { ArchitectusRuntimeBridge } from './bridge';
export type { ArchitectusBridgeConfig } from './bridge';
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
} from './collectors';
export type { RendererSnapshot } from './collectors';
export { qualityActions, cameraActions } from './actions';
