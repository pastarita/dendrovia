/**
 * Color mode registry — resolves node colors by active mode.
 */

import type { ColorMode, SourceNode } from '../types';
import type { ColorPair, ColorResolver } from './modes';
import { domainResolver, fidelityResolver, resolveRuntimeColor, runtimeResolver, statusResolver } from './modes';

const COLOR_REGISTRY: Record<ColorMode, ColorResolver> = {
  status: statusResolver,
  domain: domainResolver,
  fidelity: fidelityResolver,
  runtime: runtimeResolver,
};

export function resolveNodeColor(mode: ColorMode, node: SourceNode): ColorPair {
  return COLOR_REGISTRY[mode](node);
}

export type { ColorPair, ColorResolver };
export { statusResolver, domainResolver, fidelityResolver, runtimeResolver, resolveRuntimeColor };
