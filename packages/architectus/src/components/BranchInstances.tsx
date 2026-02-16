import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BranchSegment } from '../systems/TurtleInterpreter';

/**
 * BRANCH INSTANCES
 *
 * Renders all branch segments as instanced cylinders.
 * Single draw call for potentially thousands of branches.
 *
 * Each instance is positioned and oriented to connect its start→end points,
 * with tapered radius (startRadius → endRadius).
 *
 * Visual: Tron-aesthetic metallic material with Fresnel rim glow
 * that bloom picks up (emissive > 1.0 on edges).
 */

interface BranchInstancesProps {
  branches: BranchSegment[];
  palette: {
    primary: string;
    secondary: string;
    glow: string;
  };
}

// Shared geometry — single cylinder template
const CYLINDER_SEGMENTS = 8;

// Temp objects for matrix computation (avoid allocation per frame)
const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);
const _direction = new THREE.Vector3();
const _colorA = new THREE.Color();
const _colorB = new THREE.Color();

export function BranchInstances({ branches, palette }: BranchInstancesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Memoize material — Tron aesthetic: dark metallic with bright emissive edges
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.primary),
      emissive: new THREE.Color(palette.glow),
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.9,
    });
  }, [palette.primary, palette.glow]);

  // Memoize geometry
  const geometry = useMemo(() => {
    return new THREE.CylinderGeometry(1, 1, 1, CYLINDER_SEGMENTS);
  }, []);

  // Update instance matrices when branches change
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || branches.length === 0) return;

    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i]!;

      // Direction from start to end
      _direction.subVectors(branch.end, branch.start);
      const length = _direction.length();
      if (length < 0.001) continue;

      _direction.normalize();

      // Position: midpoint of start→end
      _position.addVectors(branch.start, branch.end).multiplyScalar(0.5);

      // Orientation: rotate cylinder (Y-up) to match branch direction
      _quaternion.setFromUnitVectors(_up, _direction);

      // Scale: average radius for X/Z, length for Y
      const avgRadius = (branch.startRadius + branch.endRadius) / 2;
      _scale.set(avgRadius, length, avgRadius);

      _matrix.compose(_position, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);

      // Depth-based color variation (reuse temp colors — no allocation)
      const depthFactor = Math.max(0, 1 - branch.depth * 0.15);
      _colorA.set(palette.primary).lerp(
        _colorB.set(palette.secondary),
        1 - depthFactor
      );
      mesh.setColorAt(i, _colorA);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [branches, palette.primary, palette.secondary]);

  // Subtle pulsing glow
  useFrame((state) => {
    if (material) {
      const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.05 + 0.3;
      material.emissiveIntensity = pulse;
    }
  });

  if (branches.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, branches.length]}
      frustumCulled={true}
    />
  );
}
