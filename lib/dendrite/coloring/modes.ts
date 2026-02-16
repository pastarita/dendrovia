/**
 * Color mode resolvers — strategy pattern.
 * Each resolver maps a source node to a fill + text color pair.
 */

import type { SourceNode } from "../types";
import { PILLAR_COLORS, STATUS_COLORS, FIDELITY_COLORS, RUNTIME_HEALTH_COLORS } from "../design-tokens";
import type { RuntimeHealth } from "../types";

export interface ColorPair {
  fill: string;
  text: string;
}

export type ColorResolver = (node: SourceNode) => ColorPair;

export const statusResolver: ColorResolver = (node) =>
  STATUS_COLORS[node.status] ?? STATUS_COLORS.scaffold;

export const domainResolver: ColorResolver = (node) =>
  PILLAR_COLORS[node.domain] ?? PILLAR_COLORS.shared;

export const fidelityResolver: ColorResolver = (node) =>
  FIDELITY_COLORS[node.kind] ?? FIDELITY_COLORS.section;

export const runtimeResolver: ColorResolver = (_node) =>
  RUNTIME_HEALTH_COLORS.idle;

export function resolveRuntimeColor(health: RuntimeHealth): ColorPair {
  return RUNTIME_HEALTH_COLORS[health] ?? RUNTIME_HEALTH_COLORS.idle;
}
