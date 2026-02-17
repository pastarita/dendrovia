import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SegmentPlacement } from '@dendrovia/shared';

/**
 * SEGMENT OVERLAY (D7)
 *
 * Renders translucent glow spheres at story arc segment regions.
 * Each segment placement (from SegmentMapper) becomes a sphere
 * positioned at the centroid with radius matching the segment's extent.
 *
 * The active segment (current quest target) pulses brighter.
 */

interface SegmentOverlayProps {
  /** Segment placements from SegmentMapper */
  placements: Map<string, SegmentPlacement>;
  /** ID of the currently active segment (quest target) */
  activeSegmentId?: string | null;
  /** Glow color for segments */
  glowColor?: string;
}

export function SegmentOverlay({ placements, activeSegmentId, glowColor = '#00ffff' }: SegmentOverlayProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const pulseRef = useRef(0);

  // Convert placements to arrays for instanced rendering
  const { entries, activeIndex } = useMemo(() => {
    const arr = Array.from(placements.values()).filter(p => p.radius > 0);
    const idx = activeSegmentId
      ? arr.findIndex(p => p.segmentId === activeSegmentId)
      : -1;
    return { entries: arr, activeIndex: idx };
  }, [placements, activeSegmentId]);

  const count = entries.length;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const baseColor = useMemo(() => new THREE.Color(glowColor), [glowColor]);
  const activeColor = useMemo(() => new THREE.Color(glowColor).multiplyScalar(2), [glowColor]);

  // Set initial transforms
  useMemo(() => {
    if (!meshRef.current || count === 0) return;
    const mesh = meshRef.current;

    for (let i = 0; i < count; i++) {
      const p = entries[i]!;
      dummy.position.set(p.centroid[0], p.centroid[1], p.centroid[2]);
      // Minimum visible radius of 1 unit
      dummy.scale.setScalar(Math.max(p.radius, 1));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, i === activeIndex ? activeColor : baseColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, count, activeIndex]);

  // Pulse the active segment
  useFrame((_, delta) => {
    if (activeIndex < 0 || !meshRef.current) return;

    pulseRef.current += delta * 2;
    const pulse = 0.6 + Math.sin(pulseRef.current) * 0.4;

    const p = entries[activeIndex]!;
    dummy.position.set(p.centroid[0], p.centroid[1], p.centroid[2]);
    dummy.scale.setScalar(Math.max(p.radius, 1) * (1 + pulse * 0.15));
    dummy.updateMatrix();
    meshRef.current.setMatrixAt(activeIndex, dummy.matrix);
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial
        transparent
        opacity={0.08}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.BackSide}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
