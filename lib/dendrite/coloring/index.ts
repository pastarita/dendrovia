/**
 * Color mode registry — resolves node colors by active mode.
 */

import type { ColorMode, SourceNode } from "../types";
import type { ColorPair, ColorResolver } from "./modes";
import { statusResolver, domainResolver, fidelityResolver } from "./modes";

const COLOR_REGISTRY: Record<ColorMode, ColorResolver> = {
  status: statusResolver,
  domain: domainResolver,
  fidelity: fidelityResolver,
};

export function resolveNodeColor(mode: ColorMode, node: SourceNode): ColorPair {
  return COLOR_REGISTRY[mode](node);
}

export type { ColorPair, ColorResolver };
export { statusResolver, domainResolver, fidelityResolver };
