import type { FlatMeshData } from '@dendrovia/imaginarium';
import type { FungalSpecimen, ProceduralPalette } from '@dendrovia/shared';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * MUSHROOM INSTANCES
 *
 * Renders fungal specimens as instanced meshes on the forest floor.
 * Specimens are grouped by genus so that all mushrooms sharing a genus
 * (and therefore the same mesh geometry) are rendered in a single
 * instanced draw call.
 *
 * Visual: Bioluminescent fungi with emissive glow that bloom picks up.
 *   - Scale color from specimen morphology drives per-instance tinting
 *   - Emissive intensity modulated by bioluminescence field
 *   - Subtle pulsing glow for "alive" feeling
 *
 * Fallback: If meshData is missing for a genus, those specimens are
 * silently skipped (the SVG billboard fallback is handled elsewhere).
 */

interface MushroomInstancesProps {
  specimens: FungalSpecimen[];
  meshData: Map<string, FlatMeshData>;
  palette: ProceduralPalette;
}

// Temp objects for matrix computation (avoid allocation per frame)
const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _color = new THREE.Color();

/**
 * Group specimens by genus. Returns a map of genus -> specimen list,
 * but only for genera that have mesh data available.
 */
function groupByGenus(specimens: FungalSpecimen[], meshData: Map<string, FlatMeshData>): Map<string, FungalSpecimen[]> {
  const groups = new Map<string, FungalSpecimen[]>();

  for (const specimen of specimens) {
    const genus = specimen.taxonomy.genus;

    // Check if mesh data exists for this specimen (by id) or genus
    const hasMesh = meshData.has(specimen.id) || meshData.has(genus);
    if (!hasMesh) continue;

    let group = groups.get(genus);
    if (!group) {
      group = [];
      groups.set(genus, group);
    }
    group.push(specimen);
  }

  return groups;
}

/**
 * Build a THREE.BufferGeometry from FlatMeshData.
 * Positions, normals, and indices are set as BufferAttributes.
 */
function buildGeometry(flat: FlatMeshData): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute('position', new THREE.BufferAttribute(flat.positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(flat.normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(flat.indices, 1));

  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Resolve the FlatMeshData for a genus. Checks the map by specimen id
 * first (per-specimen meshes), then falls back to genus key.
 */
function resolveMeshData(
  genus: string,
  specimens: FungalSpecimen[],
  meshData: Map<string, FlatMeshData>,
): FlatMeshData | null {
  // Try the first specimen's id (specimen-level mesh)
  for (const specimen of specimens) {
    const flat = meshData.get(specimen.id);
    if (flat) return flat;
  }
  // Fall back to genus key
  return meshData.get(genus) ?? null;
}

/**
 * Determine emissive intensity from the bioluminescence descriptor.
 * Higher bioluminescence means brighter glow.
 */
function bioluminescenceIntensity(bioluminescence: string): number {
  switch (bioluminescence) {
    case 'brilliant':
      return 1.5;
    case 'bright':
      return 1.0;
    case 'moderate':
      return 0.6;
    case 'faint':
      return 0.3;
    case 'dim':
      return 0.15;
    default:
      return 0.05;
  }
}

/**
 * A single instanced mesh group for one genus of mushrooms.
 * Separated into its own component so each genus can memoize independently.
 */
function GenusInstanceGroup({
  genus,
  specimens,
  meshData,
  palette,
}: {
  genus: string;
  specimens: FungalSpecimen[];
  meshData: Map<string, FlatMeshData>;
  palette: ProceduralPalette;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const flat = useMemo(() => resolveMeshData(genus, specimens, meshData), [genus, specimens, meshData]);

  const geometry = useMemo(() => {
    if (!flat) return null;
    return buildGeometry(flat);
  }, [flat]);

  // Compute average bioluminescence for material emissive intensity
  const avgBioluminescence = useMemo(() => {
    if (specimens.length === 0) return 0.3;
    let total = 0;
    for (const s of specimens) {
      total += bioluminescenceIntensity(s.morphology.bioluminescence);
    }
    return total / specimens.length;
  }, [specimens]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.accent),
      emissive: new THREE.Color(palette.glow),
      emissiveIntensity: avgBioluminescence,
      roughness: 0.35,
      metalness: 0.2,
      transparent: true,
      opacity: 0.95,
      // Vertex colors enabled for per-instance tinting
      vertexColors: false,
    });
  }, [palette.accent, palette.glow, avgBioluminescence]);

  // Update instance matrices and colors when specimens change
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || specimens.length === 0) return;

    for (let i = 0; i < specimens.length; i++) {
      const specimen = specimens[i]!;
      const placement = specimen.placement;

      // Position from placement
      _position.set(placement.position[0], placement.position[1], placement.position[2]);

      // Rotation: Y-axis rotation from placement.rotation
      _euler.set(0, placement.rotation, 0);
      _quaternion.setFromEuler(_euler);

      // Scale: uniform from placement.scale
      const s = placement.scale;
      _scale.set(s, s, s);

      _matrix.compose(_position, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);

      // Per-instance color from morphology.scaleColor
      _color.set(specimen.morphology.scaleColor);
      mesh.setColorAt(i, _color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [specimens]);

  // Subtle bioluminescent pulse
  useFrame((state) => {
    if (material) {
      const pulse = Math.sin(state.clock.elapsedTime * 0.8 + genus.length * 0.5) * 0.15 + avgBioluminescence;
      material.emissiveIntensity = Math.max(0, pulse);
    }
  });

  if (!geometry || specimens.length === 0) return null;

  return <instancedMesh ref={meshRef} args={[geometry, material, specimens.length]} frustumCulled={true} />;
}

/**
 * Top-level mushroom renderer. Groups specimens by genus and renders
 * one GenusInstanceGroup per unique genus that has mesh data.
 */
export function MushroomInstances({ specimens, meshData, palette }: MushroomInstancesProps) {
  // Group specimens by genus (only those with mesh data)
  const genusGroups = useMemo(() => groupByGenus(specimens, meshData), [specimens, meshData]);

  if (genusGroups.size === 0) return null;

  return (
    <group name="mushroom-instances">
      {Array.from(genusGroups.entries()).map(([genus, genusSpecimens]) => (
        <GenusInstanceGroup
          key={genus}
          genus={genus}
          specimens={genusSpecimens}
          meshData={meshData}
          palette={palette}
        />
      ))}
    </group>
  );
}
