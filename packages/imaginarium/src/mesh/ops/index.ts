/**
 * Mesh operations — composable primitives for the procedural pipeline.
 */

export { subdivide, loopSubdivideOnce } from './subdivide';
export { smooth, taubinSmooth, laplacianSmoothOnce } from './smooth';
export {
  displaceNormal,
  displaceByFunction,
  displaceByField,
  displaceByNoise,
} from './displace';
