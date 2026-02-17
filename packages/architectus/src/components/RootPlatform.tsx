import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRendererStore } from '../store/useRendererStore';
import type { QualityTier } from '../store/useRendererStore';

/**
 * ROOT PLATFORM
 *
 * Persistent spawn platform at the base of the root trunk (origin).
 * Four concentric geometry layers centered at (0, 0, 0):
 *
 *   Layer 1 — Base Disc ("the puck"): metallic platform flush with Y=0
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
  rootName: string;
}

// Platform dimensions (world units)
const PLATFORM_RADIUS = 3.0;
const PLATFORM_THICKNESS = 0.15;
const WELL_RADIUS = 0.35;
const WELL_HEIGHT = 0.3;
const RIM_MAJOR_RADIUS = 3.0;
const RIM_TUBE_RADIUS = 0.03;
const INNER_RING_INNER = 1.0;
const INNER_RING_OUTER = 1.1;
const OUTER_RING_INNER = 2.5;
const OUTER_RING_OUTER = 2.6;
const ROUTE_LENGTH = 1.5;
const ROUTE_RADIUS_BASE = 0.02;
const ROUTE_RADIUS_TIP = 0.015;

// Ring rotation speeds (rad/s)
const INNER_RING_SPEED = 0.05;
const OUTER_RING_SPEED = -0.03;

// Rim pulse parameters
const RIM_PULSE_MIN = 1.5;
const RIM_PULSE_MAX = 2.5;
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

export function RootPlatform({ palette, routes, rootName }: RootPlatformProps) {
  const qualityTier = useRendererStore((s) => s.qualityTier);
  const detail = TIER_DETAIL[qualityTier];

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

  // --- Geometries (memoized per quality tier) ---
  const discGeometry = useMemo(
    () => new THREE.CylinderGeometry(PLATFORM_RADIUS, PLATFORM_RADIUS, PLATFORM_THICKNESS, detail.discSegments),
    [detail.discSegments],
  );

  const wellGeometry = useMemo(
    () => new THREE.CylinderGeometry(WELL_RADIUS, WELL_RADIUS, WELL_HEIGHT, 32),
    [],
  );

  const innerRingGeometry = useMemo(
    () => new THREE.RingGeometry(INNER_RING_INNER, INNER_RING_OUTER, 64),
    [],
  );

  const outerRingGeometry = useMemo(
    () => new THREE.RingGeometry(OUTER_RING_INNER, OUTER_RING_OUTER, 64),
    [],
  );

  const rimGeometry = useMemo(
    () => new THREE.TorusGeometry(RIM_MAJOR_RADIUS, RIM_TUBE_RADIUS, 8, 128),
    [],
  );

  const routeGeometry = useMemo(
    () => new THREE.CylinderGeometry(ROUTE_RADIUS_TIP, ROUTE_RADIUS_BASE, ROUTE_LENGTH, 4),
    [],
  );

  // --- Route indicator transforms ---
  const routeTransforms = useMemo(() => {
    return routes.map((route) => {
      const dir = route.direction.clone();
      // Project onto XZ plane
      dir.y = 0;
      if (dir.lengthSq() < 0.001) {
        dir.set(1, 0, 0);
      }
      dir.normalize();

      // Position at platform edge
      const pos = dir.clone().multiplyScalar(PLATFORM_RADIUS + ROUTE_LENGTH * 0.5);
      pos.y = 0;

      // Slight Y tilt to show branch trajectory
      const tiltedDir = route.direction.clone().normalize();
      tiltedDir.y = Math.max(tiltedDir.y * 0.3, 0.05); // Flatten but keep hint
      tiltedDir.normalize();

      // Rotation: align cylinder Y-axis with tiltedDir projected into XZ+slight Y
      const quaternion = new THREE.Quaternion();
      const up = new THREE.Vector3(0, 1, 0);
      // The cylinder's default axis is Y, so we rotate from Y to the direction
      // But we want the rod to lay mostly flat, pointing outward from center
      const rodDir = new THREE.Vector3(dir.x, tiltedDir.y * 0.5, dir.z).normalize();
      quaternion.setFromUnitVectors(up, rodDir);

      return { position: pos, quaternion, label: route.label };
    });
  }, [routes]);

  // --- Animation ---
  useFrame((_, delta) => {
    if (!detail.animated) return;
    const dt = Math.min(delta, 0.1);

    // Counter-rotating rings
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z += INNER_RING_SPEED * dt;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += OUTER_RING_SPEED * dt;
    }

    // Rim pulse
    if (rimRef.current) {
      const t = performance.now() * 0.001 * RIM_PULSE_SPEED;
      const pulse = RIM_PULSE_MIN + (RIM_PULSE_MAX - RIM_PULSE_MIN) * (0.5 + 0.5 * Math.sin(t));
      (rimRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.3 * Math.sin(t);
      // Scale emissive effect via opacity since MeshBasicMaterial has no emissiveIntensity
      void pulse; // pulse tracked for potential future emissive material upgrade
    }
  });

  return (
    <group name="root-platform">
      {/* Layer 1 — Base Disc */}
      <mesh
        geometry={discGeometry}
        material={discMaterial}
        position={[0, -PLATFORM_THICKNESS / 2, 0]}
        receiveShadow
      />

      {/* Layer 4 — Center Well (trunk mount) */}
      {detail.layers >= 2 && (
        <mesh
          geometry={wellGeometry}
          material={wellMaterial}
          position={[0, WELL_HEIGHT / 2, 0]}
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
