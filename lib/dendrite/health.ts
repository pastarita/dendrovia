/**
 * Health Derivation — Shared across pillar runtime bridges
 *
 * Evaluates an ordered list of conditions to derive a RuntimeHealth value.
 * First match wins. Default: "idle".
 */

import type { RuntimeHealth } from './types';

export interface HealthCondition {
  check: () => boolean;
  result: RuntimeHealth;
}

export function deriveHealth(conditions: HealthCondition[]): RuntimeHealth {
  for (const { check, result } of conditions) {
    if (check()) return result;
  }
  return 'idle';
}
