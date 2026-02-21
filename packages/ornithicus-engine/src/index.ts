/**
 * @ornithicus/engine
 *
 * Spatial engine extensions for the Ornithicus codebase editor.
 * Builds on top of @dendrovia/architectus, chronos, and imaginarium.
 *
 * Domains:
 *   - temporal/    — Diff material engine (green/red/yellow branch texturing)
 *   - rasterization/ — Scale frame shift (humanoid→bird perspective transform)
 *   - skybox/      — Frustum controller (view frustum + concentric dome layers)
 *   - growth/      — Replay animator (commit-by-commit tree growth engine)
 */

export { DiffMaterialEngine } from "./temporal/DiffMaterialEngine";
export { ScaleFrameShift } from "./rasterization/ScaleFrameShift";
export { FrustumController } from "./skybox/FrustumController";
export { ReplayAnimator } from "./growth/ReplayAnimator";
