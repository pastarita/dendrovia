import * as THREE from 'three';
import type { SpatialIndex } from './SpatialIndex';
import type { NestConfig } from './NestConfig';
import type { ViewIssue, ViewQualityReport } from './CameraParams';

/**
 * VIEW QUALITY VALIDATOR
 *
 * Pure-function system that evaluates camera view quality in player modes.
 * Detects 4 common issues:
 *
 * 1. Face-into-wall:  Camera is inside or very near a branch surface
 * 2. Bad azimuth (1P): Camera forward is nearly parallel to the branch axis
 * 3. Off-platform:    Nest center is outside the camera frustum on initial placement
 * 4. Branch occlusion: In 3P mode, geometry blocks the line from camera to player
 *
 * Runs as a pure function — a thin useFrame wrapper calls it at ~4Hz (every 15 frames).
 * Module-scope temporaries are used for zero per-frame allocation.
 */

// Module-scope temporaries
const _camForward = new THREE.Vector3();
const _toNest = new THREE.Vector3();
const _toPlayer = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();

/**
 * Validate camera view quality.
 *
 * @param cameraPosition  Current camera world position
 * @param cameraForward   Camera forward direction (normalized)
 * @param nestConfig      Active nest configuration
 * @param spatialIndex    Spatial index for nearest-segment queries
 * @param mode            Current camera mode ('player-1p' | 'player-3p')
 * @param playerPosition  Player world position (used for 3P occlusion check)
 * @param elapsedSinceTransition  Seconds since the last mode transition
 * @returns               View quality report with score and issues
 */
export function validateCameraView(
  cameraPosition: THREE.Vector3,
  cameraForward: THREE.Vector3,
  nestConfig: NestConfig | null,
  spatialIndex: SpatialIndex | null,
  mode: 'player-1p' | 'player-3p',
  playerPosition: THREE.Vector3 | null,
  elapsedSinceTransition: number,
): ViewQualityReport {
  const issues: ViewIssue[] = [];

  // ─── 1. Face-into-wall ──────────────────────────────────────────────

  if (spatialIndex && spatialIndex.nodeCount > 0) {
    const nearest = spatialIndex.nearestSegment(cameraPosition);
    if (nearest) {
      const wallThreshold = nearest.segment.radius * 1.2;
      if (nearest.distance < wallThreshold) {
        issues.push({
          id: 'face-into-wall',
          message: `Camera is inside/near branch surface (${nearest.distance.toFixed(2)}u < ${wallThreshold.toFixed(2)}u threshold)`,
          severity: nearest.distance < nearest.segment.radius ? 'error' : 'warning',
        });
      }
    }
  }

  // ─── 2. Bad azimuth (1P only) ───────────────────────────────────────

  if (mode === 'player-1p' && spatialIndex && spatialIndex.nodeCount > 0) {
    const nearest = spatialIndex.nearestSegment(cameraPosition);
    if (nearest) {
      const segAxis = _rayDir
        .copy(nearest.segment.end)
        .sub(nearest.segment.start)
        .normalize();

      _camForward.copy(cameraForward);
      const alignment = Math.abs(_camForward.dot(segAxis));

      if (alignment > 0.95) {
        issues.push({
          id: 'bad-azimuth',
          message: `Camera looks along branch axis (alignment: ${alignment.toFixed(3)})`,
          severity: alignment > 0.98 ? 'error' : 'warning',
        });
      }
    }
  }

  // ─── 3. Off-platform (initial placement, first 2s) ─────────────────

  if (nestConfig && elapsedSinceTransition < 2.0) {
    _toNest.copy(nestConfig.nestPosition).sub(cameraPosition).normalize();
    const dotToNest = _toNest.dot(cameraForward);

    // If nest center is behind the camera (dot < 0) or very far off-axis
    if (dotToNest < 0.1) {
      issues.push({
        id: 'off-platform',
        message: 'Nest center is outside camera view on initial placement',
        severity: 'warning',
      });
    }
  }

  // ─── 4. Branch occlusion (3P only) ─────────────────────────────────

  if (mode === 'player-3p' && playerPosition && spatialIndex && spatialIndex.nodeCount > 0) {
    _toPlayer.copy(playerPosition).sub(cameraPosition);
    const distToPlayer = _toPlayer.length();

    if (distToPlayer > 0.01) {
      // Check if nearest segment to the midpoint between camera and player
      // is closer than the segment radius — indicating an obstruction
      const midpoint = _rayDir
        .copy(cameraPosition)
        .add(playerPosition)
        .multiplyScalar(0.5);

      const midNearest = spatialIndex.nearestSegment(midpoint);
      if (midNearest && midNearest.distance < midNearest.segment.radius * 1.5) {
        issues.push({
          id: 'branch-occlusion',
          message: 'Branch geometry between camera and player',
          severity: 'warning',
        });
      }
    }
  }

  // ─── Compute score ─────────────────────────────────────────────────

  let score = 100;
  for (const issue of issues) {
    score -= issue.severity === 'error' ? 30 : 15;
  }
  score = Math.max(0, score);

  return {
    score,
    issues,
    enabled: true,
  };
}
