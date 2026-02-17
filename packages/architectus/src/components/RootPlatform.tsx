import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRendererStore } from '../store/useRendererStore';
import type { QualityTier } from '../store/useRendererStore';
import { deriveDimensions } from '../systems/PlatformConfig';
import type { PlatformConfig } from '../systems/PlatformConfig';

/**
 * ROOT PLATFORM
 *
 * Persistent spawn platform at the base of the root trunk.
 * All dimensions derive dynamically from the topology's trunk radius
 * via PlatformConfig — the same tree that produces a 0.3-radius trunk
 * gets a radius-3 platform, while a larger tree gets proportionally larger.
 *
 * Four concentric geometry layers:
 *   Layer 1 — Base Disc ("the puck"): metallic platform, top flush with origin Y
 *   Layer 2 — Concentric Ring Grooves: glowing rings marking trunk/route zones
 *   Layer 3 — Edge Rim Glow: Tron-style bloom-catching torus
 *   Layer 4 — Center Well: trunk mount anchor
 *
 * Route indicators radiate from the platform edge showing top-level branch directions.
 * Quality tier scaling reduces geometry complexity on weaker GPUs.
 */

interface RootPlatformProps {
  palette: { primary: string; secondary: string; glow: string; accent: string };
  routes: Array<{ direction: THREE.Vector3; label: string }>;
  config: PlatformConfig;
}

// Ring rotation speeds (rad/s) — scale-invariant
const INNER_RING_SPEED = 0.05;
const OUTER_RING_SPEED = -0.03;

// Rim pulse parameters — scale-invariant
const RIM_PULSE_SPEED = 1.2;

/** Geometry detail per quality tier */
const TIER_DETAIL: Record<QualityTier, {
  discSegments: number;
  layers: number; // 1=disc only, 2=disc+rim, 3=disc+rim+outerRing, 4=all
  animated: boolean;
  routes: boolean;
}> = {
  ultra:  { discSegments: 64, layers: 4, animated: true, routes: true },
  high:   { discSegments: 64, layers: 4, animated: true, routes: true },
  medium: { discSegments: 32, layers: 3, animated: true, routes: true },
  low:    { discSegments: 16, layers: 2, animated: false, routes: false },
  potato: { discSegments: 8,  layers: 1, animated: false, routes: false },
};

export function RootPlatform({ palette, routes, config }: RootPlatformProps) {
  const qualityTier = useRendererStore((s) => s.qualityTier);
  const detail = TIER_DETAIL[qualityTier];

  // Derive all concrete dimensions from topology config
  const dim = useMemo(() => deriveDimensions(config), [config]);

  // Refs for animated elements
  const innerRingRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const rimRef = useRef<THREE.Mesh>(null);

  // --- Materials (memoized per palette) ---
  const discMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.primary),
    emissive: new THREE.Color(palette.glow),
    emissiveIntensity: 0.2,
    metalness: 0.9,
    roughness: 0.2,
  }), [palette.primary, palette.glow]);

  const wellMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.primary).multiplyScalar(0.7),
    emissive: new THREE.Color(palette.glow),
    emissiveIntensity: 0.4,
    metalness: 0.95,
    roughness: 0.15,
  }), [palette.primary, palette.glow]);

  const ringMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(palette.glow),
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [palette.glow]);

  const rimMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(palette.glow),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [palette.glow]);

  const routeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.accent),
    emissive: new THREE.Color(palette.glow),
    emissiveIntensity: 0.5,
    metalness: 0.8,
    roughness: 0.3,
  }), [palette.accent, palette.glow]);

  // --- Geometries (memoized per dimensions + quality tier) ---
  const discGeometry = useMemo(
    () => new THREE.CylinderGeometry(dim.platformRadius, dim.platformRadius, dim.platformThickness, detail.discSegments),
    [dim.platformRadius, dim.platformThickness, detail.discSegments],
  );

  const wellGeometry = useMemo(
    () => new THREE.CylinderGeometry(dim.wellRadius, dim.wellRadius, dim.wellHeight, 32),
    [dim.wellRadius, dim.wellHeight],
  );

  const innerRingGeometry = useMemo(
    () => new THREE.RingGeometry(dim.innerRingInner, dim.innerRingOuter, 64),
    [dim.innerRingInner, dim.innerRingOuter],
  );

  const outerRingGeometry = useMemo(
    () => new THREE.RingGeometry(dim.outerRingInner, dim.outerRingOuter, 64),
    [dim.outerRingInner, dim.outerRingOuter],
  );

  const rimGeometry = useMemo(
    () => new THREE.TorusGeometry(dim.platformRadius, dim.rimTubeRadius, 8, 128),
    [dim.platformRadius, dim.rimTubeRadius],
  );

  const routeGeometry = useMemo(
    () => new THREE.CylinderGeometry(dim.routeRadiusTip, dim.routeRadiusBase, dim.routeLength, 4),
    [dim.routeRadiusTip, dim.routeRadiusBase, dim.routeLength],
  );

  // --- Route indicator transforms ---
  const routeTransforms = useMemo(() => {
    return routes.map((route) => {
      const dir = route.direction.clone();
      dir.y = 0;
      if (dir.lengthSq() < 0.001) {
        dir.set(1, 0, 0);
      }
      dir.normalize();

      // Position at platform edge
      const pos = dir.clone().multiplyScalar(dim.platformRadius + dim.routeLength * 0.5);
      pos.y = config.origin[1];

      // Slight Y tilt to show branch trajectory
      const tiltedDir = route.direction.clone().normalize();
      tiltedDir.y = Math.max(tiltedDir.y * 0.3, 0.05);
      tiltedDir.normalize();

      const quaternion = new THREE.Quaternion();
      const up = new THREE.Vector3(0, 1, 0);
      const rodDir = new THREE.Vector3(dir.x, tiltedDir.y * 0.5, dir.z).normalize();
      quaternion.setFromUnitVectors(up, rodDir);

      return { position: pos, quaternion, label: route.label };
    });
  }, [routes, dim.platformRadius, dim.routeLength, config.origin]);

  // --- Animation ---
  useFrame((_, delta) => {
    if (!detail.animated) return;
    const dt = Math.min(delta, 0.1);

    if (innerRingRef.current) {
      innerRingRef.current.rotation.z += INNER_RING_SPEED * dt;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += OUTER_RING_SPEED * dt;
    }

    if (rimRef.current) {
      const t = performance.now() * 0.001 * RIM_PULSE_SPEED;
      (rimRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.3 * Math.sin(t);
    }
  });

  const [ox, oy, oz] = config.origin;

  return (
    <group name="root-platform" position={[ox, oy, oz]}>
      {/* Layer 1 — Base Disc */}
      <mesh
        geometry={discGeometry}
        material={discMaterial}
        position={[0, -dim.platformThickness / 2, 0]}
        receiveShadow
      />

      {/* Layer 4 — Center Well (trunk mount) */}
      {detail.layers >= 2 && (
        <mesh
          geometry={wellGeometry}
          material={wellMaterial}
          position={[0, dim.wellHeight / 2, 0]}
        />
      )}

      {/* Layer 3 — Edge Rim Glow */}
      {detail.layers >= 2 && (
        <mesh
          ref={rimRef}
          geometry={rimGeometry}
          material={rimMaterial}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
        />
      )}

      {/* Layer 2 — Outer Ring Groove */}
      {detail.layers >= 3 && (
        <mesh
          ref={outerRingRef}
          geometry={outerRingGeometry}
          material={ringMaterial}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.001, 0]}
        />
      )}

      {/* Layer 2 — Inner Ring Groove */}
      {detail.layers >= 4 && (
        <mesh
          ref={innerRingRef}
          geometry={innerRingGeometry}
          material={ringMaterial}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.001, 0]}
        />
      )}

      {/* Route Indicators */}
      {detail.routes && routeTransforms.map((rt, i) => (
        <mesh
          key={i}
          geometry={routeGeometry}
          material={routeMaterial}
          position={rt.position}
          quaternion={rt.quaternion}
        />
      ))}
    </group>
  );
}
