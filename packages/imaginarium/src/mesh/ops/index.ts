/**
 * Mesh operations — composable primitives for the procedural pipeline.
 */

export { subdivide, loopSubdivideOnce } from './subdivide.js';
export { smooth, taubinSmooth, laplacianSmoothOnce } from './smooth.js';
export {
  displaceNormal,
  displaceByFunction,
  displaceByField,
  displaceByNoise,
} from './displace.js';
