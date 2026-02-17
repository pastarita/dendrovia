import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleSystem } from '../systems/ParticleSystem';
import { useRendererStore } from '../store/useRendererStore';

/**
 * PARTICLE INSTANCES (D6)
 *
 * Renders the ParticleSystem's output as instanced point sprites.
 * Uses InstancedBufferGeometry with a tiny quad per particle,
 * billboard-aligned via the vertex shader.
 *
 * Ambient fireflies spawn automatically within the scene bounding box.
 * The burst() API is exposed via the ParticleSystem ref for VFX events.
 */

interface ParticleInstancesProps {
  /** Scene bounding box for ambient particle spawning */
  bounds: THREE.Box3;
  /** Accent color for fireflies */
  color?: string;
  /** Ref callback to expose ParticleSystem for external burst calls */
  systemRef?: (system: ParticleSystem) => void;
}

export function ParticleInstances({ bounds, color, systemRef }: ParticleInstancesProps) {
  const maxParticles = useRendererStore((s) => s.quality.maxParticles);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const ambientTimer = useRef(0);

  // Create particle system (recreate when budget changes)
  const system = useMemo(() => new ParticleSystem(maxParticles), [maxParticles]);

  // Expose system via ref callback
  useEffect(() => {
    systemRef?.(system);
  }, [system, systemRef]);

  // Dummy matrix for instanced mesh (positions set via instance attributes)
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particleColor = useMemo(() => new THREE.Color(color ?? '#00ffcc'), [color]);

  useFrame((_, delta) => {
    // Clamp delta to avoid huge jumps on tab-switch
    const dt = Math.min(delta, 0.1);

    // Spawn ambient fireflies periodically
    ambientTimer.current += dt;
    if (ambientTimer.current > 0.3) {
      ambientTimer.current = 0;
      system.spawnAmbient(bounds, particleColor);
    }

    // Update simulation
    system.update(dt);

    // Update instanced mesh transforms
    const mesh = meshRef.current;
    if (!mesh) return;

    const count = system.activeCount;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const i2 = i * 2;
      dummy.position.set(
        system.positions[i3]!,
        system.positions[i3 + 1]!,
        system.positions[i3 + 2]!,
      );
      const scale = system.scales[i2]!;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Set per-instance color
      mesh.setColorAt(i, new THREE.Color(
        system.colors[i3]!,
        system.colors[i3 + 1]!,
        system.colors[i3 + 2]!,
      ));
    }

    // Hide unused instances
    for (let i = count; i < mesh.count; i++) {
      dummy.position.set(0, -1000, 0);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.count = Math.max(count, 1); // Keep at least 1 to avoid warnings
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, maxParticles]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
