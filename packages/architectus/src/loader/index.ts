/**
 * Loader barrel — asset loading utilities for ARCHITECTUS.
 */
export { loadGeneratedAssets, loadWorldIndex, loadSegmentData } from './AssetBridge';
export type { GeneratedAssets, WorldIndexResult, SegmentLoadResult } from './AssetBridge';
export { evaluateSegmentLoading } from './SegmentLoadManager';
