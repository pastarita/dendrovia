/**
 * Pre-built SDF shader strings for different complexity tiers.
 * Keyed by tier name — provides instant fallback shaders.
 */

export type SDFTier = 'simple-trunk' | 'binary-branch' | 'complex-tree' | 'dense-canopy' | 'twisted-spire';

export const DEFAULT_SDFS: Map<SDFTier, string> = new Map([
  [
    'simple-trunk',
    `
float scene(vec3 p) {
  float trunk = sdCapsule(p, vec3(0.0, 0.0, 0.0), vec3(0.0, 4.0, 0.0), 0.3);
  float crown = sdSphere(p - vec3(0.0, 4.5, 0.0), 1.2);
  return opSmoothUnion(trunk, crown, 0.5);
}
`,
  ],

  [
    'binary-branch',
    `
float scene(vec3 p) {
  float trunk = sdCapsule(p, vec3(0.0, 0.0, 0.0), vec3(0.0, 3.0, 0.0), 0.25);
  float b1 = sdCapsule(p, vec3(0.0, 2.5, 0.0), vec3(1.5, 4.5, 0.5), 0.15);
  float b2 = sdCapsule(p, vec3(0.0, 2.5, 0.0), vec3(-1.2, 4.0, -0.3), 0.15);
  float d = opSmoothUnion(trunk, b1, 0.3);
  d = opSmoothUnion(d, b2, 0.3);
  return d;
}
`,
  ],

  [
    'complex-tree',
    `
float scene(vec3 p) {
  float trunk = sdCapsule(p, vec3(0.0, 0.0, 0.0), vec3(0.0, 3.5, 0.0), 0.3);
  float b1 = sdCapsule(p, vec3(0.0, 2.0, 0.0), vec3(1.8, 4.0, 0.8), 0.15);
  float b2 = sdCapsule(p, vec3(0.0, 2.5, 0.0), vec3(-1.5, 4.5, -0.5), 0.15);
  float b3 = sdCapsule(p, vec3(0.0, 3.0, 0.0), vec3(0.5, 5.0, -1.0), 0.12);
  float b4 = sdCapsule(p, vec3(1.8, 4.0, 0.8), vec3(2.5, 5.5, 1.2), 0.08);
  float b5 = sdCapsule(p, vec3(-1.5, 4.5, -0.5), vec3(-2.0, 6.0, -1.0), 0.08);
  float d = opSmoothUnion(trunk, b1, 0.3);
  d = opSmoothUnion(d, b2, 0.3);
  d = opSmoothUnion(d, b3, 0.25);
  d = opSmoothUnion(d, b4, 0.2);
  d = opSmoothUnion(d, b5, 0.2);
  return d;
}
`,
  ],

  [
    'dense-canopy',
    `
float scene(vec3 p) {
  float trunk = sdCapsule(p, vec3(0.0, 0.0, 0.0), vec3(0.0, 3.0, 0.0), 0.35);
  float b1 = sdCapsule(p, vec3(0.0, 1.5, 0.0), vec3(2.0, 3.5, 1.0), 0.18);
  float b2 = sdCapsule(p, vec3(0.0, 2.0, 0.0), vec3(-1.8, 4.0, -0.8), 0.16);
  float b3 = sdCapsule(p, vec3(0.0, 2.5, 0.0), vec3(0.8, 4.5, -1.5), 0.14);
  float b4 = sdCapsule(p, vec3(0.0, 2.8, 0.0), vec3(-0.5, 4.8, 1.2), 0.12);
  float b5 = sdCapsule(p, vec3(2.0, 3.5, 1.0), vec3(3.0, 5.0, 1.5), 0.1);
  float b6 = sdCapsule(p, vec3(-1.8, 4.0, -0.8), vec3(-2.5, 5.5, -1.5), 0.1);
  float b7 = sdCapsule(p, vec3(0.8, 4.5, -1.5), vec3(1.5, 6.0, -2.0), 0.08);
  float d = opSmoothUnion(trunk, b1, 0.35);
  d = opSmoothUnion(d, b2, 0.3);
  d = opSmoothUnion(d, b3, 0.3);
  d = opSmoothUnion(d, b4, 0.25);
  d = opSmoothUnion(d, b5, 0.2);
  d = opSmoothUnion(d, b6, 0.2);
  d = opSmoothUnion(d, b7, 0.15);
  return d;
}
`,
  ],

  [
    'twisted-spire',
    `
float scene(vec3 p) {
  vec3 tp = opTwist(p, 0.3);
  float trunk = sdCapsule(tp, vec3(0.0, 0.0, 0.0), vec3(0.0, 5.0, 0.0), 0.2);
  float b1 = sdCapsule(p, vec3(0.0, 1.5, 0.0), vec3(1.0, 3.0, 0.5), 0.12);
  float b2 = sdCapsule(p, vec3(0.0, 2.5, 0.0), vec3(-0.8, 4.0, -0.6), 0.1);
  float b3 = sdCapsule(p, vec3(0.0, 3.5, 0.0), vec3(0.6, 5.0, 0.8), 0.08);
  float spire = sdRoundCone(p - vec3(0.0, 5.0, 0.0), 0.15, 0.02, 2.0);
  float d = opSmoothUnion(trunk, b1, 0.25);
  d = opSmoothUnion(d, b2, 0.25);
  d = opSmoothUnion(d, b3, 0.2);
  d = opSmoothUnion(d, spire, 0.15);
  return d;
}
`,
  ],
]);

export function getDefaultSDF(avgComplexity: number): { tier: SDFTier; glsl: string } {
  let tier: SDFTier;
  if (avgComplexity <= 3) tier = 'simple-trunk';
  else if (avgComplexity <= 6) tier = 'binary-branch';
  else if (avgComplexity <= 10) tier = 'complex-tree';
  else if (avgComplexity <= 15) tier = 'dense-canopy';
  else tier = 'twisted-spire';

  return { tier, glsl: DEFAULT_SDFS.get(tier)! };
}
