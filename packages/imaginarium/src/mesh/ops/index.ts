/**
 * Mesh operations — composable primitives for the procedural pipeline.
 */

export {
  displaceByField,
  displaceByFunction,
  displaceByNoise,
  displaceNormal,
} from './displace';
export { laplacianSmoothOnce, smooth, taubinSmooth } from './smooth';
export { loopSubdivideOnce, subdivide } from './subdivide';
