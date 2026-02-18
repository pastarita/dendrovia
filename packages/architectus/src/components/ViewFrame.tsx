import { useMemo } from 'react';
import * as THREE from 'three';
import { useRendererStore } from '../store/useRendererStore';
import type { QualityTier } from '../store/useRendererStore';
import type { NestConfig } from '../systems/NestConfig';

/**
 * VIEW FRAME
 *
 * Diagnostic hemisphere visualization around a nest, showing:
 *   - Inner hemisphere (interaction zone) — translucent green fill + wireframe
 *   - Outer hemisphere (LOD/draw-distance boundary) — wireframe only
 *   - Planarizing ring at nest Y level — orange/gold reference plane
 *
 * Returns null when not visible. All geometry memoized on nestConfig dimensions.
 */

interface ViewFrameProps {
  nestConfig: NestConfig;
  visible: boolean;
  palette: { primary: string; glow: string };
  qualityTier?: QualityTier;
}

/** Segment counts per quality tier */
const TIER_SEGMENTS: Record<QualityTier, { inner: number; outer: number; ring: number }> = {
  ultra:  { inner: 48, outer: 24, ring: 64 },
  high:   { inner: 48, outer: 24, ring: 64 },
  medium: { inner: 32, outer: 16, ring: 32 },
  low:    { inner: 16, outer: 8,  ring: 16 },
  potato: { inner: 8,  outer: 4,  ring: 8  },
};

export function ViewFrame({ nestConfig, visible, palette, qualityTier: tierProp }: ViewFrameProps) {
  const storeTier = useRendererStore((s) => s.qualityTier);
  const tier = tierProp ?? storeTier;
  const segments = TIER_SEGMENTS[tier];

  // --- Inner hemisphere geometry (upper half sphere) ---
  const innerGeometry = useMemo(
    () => new THREE.SphereGeometry(
      nestConfig.viewNearRadius,
      segments.inner,
      segments.inner,
      0, Math.PI * 2,
      0, Math.PI / 2,
    ),
    [nestConfig.viewNearRadius, segments.inner],
  );

  // --- Outer hemisphere geometry ---
  const outerGeometry = useMemo(
    () => new THREE.SphereGeometry(
      nestConfig.viewFarRadius,
      segments.outer,
      segments.outer,
      0, Math.PI * 2,
      0, Math.PI / 2,
    ),
    [nestConfig.viewFarRadius, segments.outer],
  );

  // --- Planarizing ring ---
  const ringThickness = nestConfig.viewFarRadius * 0.01;
  const ringGeometry = useMemo(
    () => new THREE.TorusGeometry(nestConfig.viewFarRadius, ringThickness, 4, segments.ring),
    [nestConfig.viewFarRadius, ringThickness, segments.ring],
  );

  // --- Materials ---
  const innerFillMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#22C55E'),
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), []);

  const innerWireMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#22C55E'),
    wireframe: true,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  }), []);

  const outerWireMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#22C55E'),
    wireframe: true,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
  }), []);

  const ringMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#F59E0B'), // orange/gold
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  if (!visible) return null;

  const { nestPosition } = nestConfig;

  return (
    <group
      name="view-frame"
      position={[nestPosition.x, nestPosition.y, nestPosition.z]}
    >
      {/* Inner hemisphere — translucent fill */}
      <mesh geometry={innerGeometry} material={innerFillMaterial} />

      {/* Inner hemisphere — wireframe overlay */}
      <mesh geometry={innerGeometry} material={innerWireMaterial} />

      {/* Outer hemisphere — wireframe only */}
      <mesh geometry={outerGeometry} material={outerWireMaterial} />

      {/* Planarizing ring at nest Y level */}
      <mesh
        geometry={ringGeometry}
        material={ringMaterial}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
}
