import { useRef, useMemo, useEffect, Fragment } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BranchSegment } from '../systems/TurtleInterpreter';
import { useRendererStore } from '../store/useRendererStore';

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
 *
 * When running on WebGPU with >1000 branches, splits into multiple
 * instancedMesh groups to stay within the 64KB UBO limit.
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

/** WebGPU UBO limit: 64KB / 64 bytes per instance matrix = 1000 instances max */
const WEBGPU_MAX_INSTANCES_PER_MESH = 1000;

// Temp objects for matrix computation (avoid allocation per frame)
const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);
const _direction = new THREE.Vector3();
const _colorA = new THREE.Color();
const _colorB = new THREE.Color();

/** Split an array into chunks of at most `size` elements */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

interface BranchMeshProps {
  branches: BranchSegment[];
  geometry: THREE.CylinderGeometry;
  material: THREE.MeshStandardMaterial;
  palette: { primary: string; secondary: string };
}

/** Single instanced mesh for a batch of branches */
function BranchMesh({ branches, geometry, material, palette }: BranchMeshProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || branches.length === 0) return;

    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i]!;

      _direction.subVectors(branch.end, branch.start);
      const length = _direction.length();
      if (length < 0.001) {
        _scale.set(0, 0, 0);
        _matrix.compose(branch.start, _quaternion.identity(), _scale);
        mesh.setMatrixAt(i, _matrix);
        _colorA.set(palette.primary);
        mesh.setColorAt(i, _colorA);
        continue;
      }

      _direction.normalize();
      _position.addVectors(branch.start, branch.end).multiplyScalar(0.5);
      _quaternion.setFromUnitVectors(_up, _direction);

      const avgRadius = (branch.startRadius + branch.endRadius) / 2;
      _scale.set(avgRadius, length, avgRadius);

      _matrix.compose(_position, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);

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

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, branches.length]}
      frustumCulled={true}
    />
  );
}

export function BranchInstances({ branches, palette }: BranchInstancesProps) {
  const gpuBackend = useRendererStore((s) => s.gpuBackend);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.primary),
      emissive: new THREE.Color(palette.glow),
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.9,
    });
  }, [palette.primary, palette.glow]);

  const geometry = useMemo(() => {
    return new THREE.CylinderGeometry(1, 1, 1, CYLINDER_SEGMENTS);
  }, []);

  // Subtle pulsing glow
  useFrame((state) => {
    if (material) {
      const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.05 + 0.3;
      material.emissiveIntensity = pulse;
    }
  });

  if (branches.length === 0) return null;

  // On WebGPU, split into chunks of 1000 to stay within the 64KB UBO limit
  const needsChunking = gpuBackend === 'webgpu' && branches.length > WEBGPU_MAX_INSTANCES_PER_MESH;
  const chunks = needsChunking
    ? chunkArray(branches, WEBGPU_MAX_INSTANCES_PER_MESH)
    : [branches];

  return (
    <>
      {chunks.map((chunk, i) => (
        <BranchMesh
          key={i}
          branches={chunk}
          geometry={geometry}
          material={material}
          palette={palette}
        />
      ))}
    </>
  );
}
