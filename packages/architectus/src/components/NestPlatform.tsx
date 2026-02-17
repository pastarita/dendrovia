import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRendererStore } from '../store/useRendererStore';
import type { QualityTier } from '../store/useRendererStore';
import { useCameraEditorStore } from '../store/useCameraEditorStore';
import type { NestConfig } from '../systems/NestConfig';
import { createBowlProfile } from '../systems/NestConfig';

/**
 * NEST PLATFORM
 *
 * Concave bowl geometry placed at a fork junction. Serves as the player
 * localization anchor and visual indicator of the tree's branching structure.
 *
 * Geometry layers (all oriented via nestOrientation):
 *   - Bowl: LatheGeometry from parabolic profile (deep purpure + azure gradient)
 *   - Inner glow disc: small emissive disc at bowl center
 *   - Rim glow: TorusGeometry at bowl edge (bloom pickup)
 *   - Mid-ring: concentric accent ring at 60% radius
 *   - Branch anchor nodules: small spheres at child branch origins
 *
 * Quality tier scaling mirrors RootPlatform's TIER_DETAIL pattern.
 */

interface NestPlatformProps {
  nestConfig: NestConfig;
  palette: { primary: string; secondary: string; glow: string; accent: string };
  qualityTier?: QualityTier;
}

/** Geometry detail per quality tier */
const TIER_DETAIL: Record<QualityTier, {
  latheSegments: number;
  rimSegments: number;
  maxAnchors: number;
  animated: boolean;
  midRing: boolean;
  innerGlow: boolean;
}> = {
  ultra:  { latheSegments: 64, rimSegments: 128, maxAnchors: Infinity, animated: true, midRing: true, innerGlow: true },
  high:   { latheSegments: 64, rimSegments: 128, maxAnchors: Infinity, animated: true, midRing: true, innerGlow: true },
  medium: { latheSegments: 32, rimSegments: 64,  maxAnchors: Infinity, animated: true, midRing: true, innerGlow: false },
  low:    { latheSegments: 16, rimSegments: 32,  maxAnchors: 4,        animated: false, midRing: false, innerGlow: false },
  potato: { latheSegments: 8,  rimSegments: 16,  maxAnchors: 0,        animated: false, midRing: false, innerGlow: false },
};

// Rim pulse parameters (scale-invariant)
const RIM_PULSE_SPEED = 1.2;
const RIM_HEIGHT = 0.05; // relative to nest radius
const MID_RING_POS = 0.6; // at 60% of nest radius

// Module-scope temp vector for zero per-frame allocation
const _tempV = new THREE.Vector3();

export function NestPlatform({ nestConfig, palette, qualityTier: tierProp }: NestPlatformProps) {
  const storeTier = useRendererStore((s) => s.qualityTier);
  const tier = tierProp ?? storeTier;
  const detail = TIER_DETAIL[tier];

  const rimRef = useRef<THREE.Mesh>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);

  // --- Materials (memoized per palette) ---
  const bowlMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#7C3AED'), // deeper violet
    emissive: new THREE.Color('#A855F7'),
    emissiveIntensity: 0.4,
    metalness: 0.85,
    roughness: 0.15,
    side: THREE.DoubleSide,
  }), []);

  const rimMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(palette.glow),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [palette.glow]);

  const midRingMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#3B82F6'), // azure accent
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  const innerGlowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#E9D5FF'), // light lavender
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  const anchorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#F59E0B'), // amber/gold instead of flat red
    emissive: new THREE.Color('#F59E0B'),
    emissiveIntensity: 0.6,
    metalness: 0.8,
    roughness: 0.25,
  }), []);

  // --- Bowl geometry (LatheGeometry from parabolic profile) ---
  const bowlGeometry = useMemo(() => {
    const rimHeight = nestConfig.nestRadius * RIM_HEIGHT;
    const profile = createBowlProfile(
      nestConfig.nestRadius,
      nestConfig.depth,
      rimHeight,
      detail.latheSegments,
    );
    return new THREE.LatheGeometry(profile, detail.latheSegments);
  }, [nestConfig.nestRadius, nestConfig.depth, detail.latheSegments]);

  // --- Rim torus geometry ---
  const rimThickness = nestConfig.nestRadius * 0.04;
  const rimGeometry = useMemo(
    () => new THREE.TorusGeometry(nestConfig.nestRadius, rimThickness, 8, detail.rimSegments),
    [nestConfig.nestRadius, rimThickness, detail.rimSegments],
  );

  // --- Mid ring geometry (concentric accent) ---
  const midRingRadius = nestConfig.nestRadius * MID_RING_POS;
  const midRingThickness = nestConfig.nestRadius * 0.02;
  const midRingGeometry = useMemo(
    () => new THREE.TorusGeometry(midRingRadius, midRingThickness, 6, Math.floor(detail.rimSegments * 0.6)),
    [midRingRadius, midRingThickness, detail.rimSegments],
  );

  // --- Inner glow disc ---
  const innerDiscGeometry = useMemo(
    () => new THREE.CircleGeometry(nestConfig.nestRadius * 0.15, detail.latheSegments),
    [nestConfig.nestRadius, detail.latheSegments],
  );

  // --- Anchor nodule geometry (shared) ---
  const anchorGeometry = useMemo(
    () => new THREE.SphereGeometry(nestConfig.nestRadius * 0.06, 8, 6),
    [nestConfig.nestRadius],
  );

  // --- Anchor transforms ---
  const anchors = useMemo(() => {
    const max = detail.maxAnchors;
    return nestConfig.nestBranchAnchors.slice(0, max);
  }, [nestConfig.nestBranchAnchors, detail.maxAnchors]);

  // --- Animation: rim + inner glow pulse ---
  useFrame(() => {
    if (!detail.animated) return;
    const t = performance.now() * 0.001 * RIM_PULSE_SPEED;
    if (rimRef.current) {
      (rimRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.3 * Math.sin(t);
    }
    if (innerGlowRef.current) {
      (innerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.4 * Math.sin(t * 1.5 + 0.5);
    }
  });

  const { nestPosition, nestOrientation } = nestConfig;
  const nestVerticalOffset = useCameraEditorStore((s) => s.authoredParams.nestVerticalOffset);
  // Bowl center is at the bottom of the bowl (offset by -depth in local up)
  const bowlCenterY = -nestConfig.depth;

  return (
    <group
      name="nest-platform"
      position={[nestPosition.x, nestPosition.y + nestVerticalOffset, nestPosition.z]}
      quaternion={nestOrientation}
    >
      {/* Bowl */}
      <mesh
        geometry={bowlGeometry}
        material={bowlMaterial}
        rotation={[Math.PI, 0, 0]}
      />

      {/* Rim glow torus */}
      <mesh
        ref={rimRef}
        geometry={rimGeometry}
        material={rimMaterial}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, nestConfig.nestRadius * RIM_HEIGHT, 0]}
      />

      {/* Concentric mid-ring (azure accent) */}
      {detail.midRing && (
        <mesh
          geometry={midRingGeometry}
          material={midRingMaterial}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, bowlCenterY * 0.4, 0]}
        />
      )}

      {/* Inner glow disc at bowl center */}
      {detail.innerGlow && (
        <mesh
          ref={innerGlowRef}
          geometry={innerDiscGeometry}
          material={innerGlowMaterial}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, bowlCenterY + 0.01, 0]}
        />
      )}

      {/* Branch anchor nodules */}
      {anchors.map((anchor, i) => {
        // Compute position relative to nest center
        _tempV.copy(anchor.position).sub(nestPosition);
        // Apply inverse nest orientation to get local-space position
        const invQ = nestOrientation.clone().invert();
        _tempV.applyQuaternion(invQ);

        return (
          <mesh
            key={i}
            geometry={anchorGeometry}
            material={anchorMaterial}
            position={[_tempV.x, _tempV.y, _tempV.z]}
          />
        );
      })}
    </group>
  );
}
