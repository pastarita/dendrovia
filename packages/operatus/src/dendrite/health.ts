/**
 * Health Derivation — Re-export from shared lib
 *
 * Backward-compatible: consumers importing from '@dendrovia/operatus/dendrite'
 * continue to get deriveHealth and HealthCondition from this path.
 */

export { deriveHealth } from '../../../../lib/dendrite/health.js';
export type { HealthCondition } from '../../../../lib/dendrite/health.js';
