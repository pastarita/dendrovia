import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import type { NodeMarker } from '../systems/TurtleInterpreter';
import { useRendererStore } from '../store/useRendererStore';

/**
 * NODE INSTANCES
 *
 * Interactive file/directory nodes rendered as instanced spheres.
 * Each node represents a file or directory from the code topology.
 *
 * Visual: Glowing orbs at branch tips/junctions.
 *   - Files: smaller spheres, subdued glow
 *   - Directories: larger spheres, brighter glow
 *   - Hotspots: pulsing red/amber glow
 *   - Selected: bright halo
 *   - Hovered: increased emissive
 *
 * Interaction: Click emits NODE_CLICKED event via EventBus.
 *
 * When running on WebGPU with >1000 nodes, splits into multiple
 * instancedMesh groups to stay within the 64KB UBO limit.
 */

interface NodeInstancesProps {
  nodes: NodeMarker[];
  palette: {
    accent: string;
    glow: string;
  };
}

/** WebGPU UBO limit: 64KB / 64 bytes per instance matrix = 1000 instances max */
const WEBGPU_MAX_INSTANCES_PER_MESH = 1000;

const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _color = new THREE.Color();

/** Split an array into chunks of at most `size` elements */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

interface NodeMeshProps {
  nodes: NodeMarker[];
  /** Global offset: index of the first node in this chunk within the full array */
  globalOffset: number;
  geometry: THREE.SphereGeometry;
  material: THREE.MeshStandardMaterial;
  palette: { accent: string; glow: string };
  onClick: (event: ThreeEvent<MouseEvent>, globalOffset: number) => void;
  onPointerOver: (event: ThreeEvent<PointerEvent>, globalOffset: number) => void;
  onPointerOut: () => void;
}

/** Single instanced mesh for a batch of nodes */
function NodeMesh({
  nodes,
  globalOffset,
  geometry,
  material,
  palette,
  onClick,
  onPointerOver,
  onPointerOut,
}: NodeMeshProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || nodes.length === 0) return;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]!;

      _position.copy(node.position);
      _quaternion.identity();

      const isDir = node.type === 'directory';
      const baseSize = isDir ? 0.2 : 0.12;
      const depthScale = Math.max(0.5, 1 - node.depth * 0.1);
      const size = baseSize * depthScale;

      _scale.set(size, size, size);
      _matrix.compose(_position, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);

      if (isDir) {
        _color.set(palette.accent);
      } else {
        _color.set(palette.glow).multiplyScalar(0.7);
      }
      mesh.setColorAt(i, _color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [nodes, palette.accent, palette.glow]);

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => onClick(event, globalOffset),
    [onClick, globalOffset],
  );

  const handlePointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => onPointerOver(event, globalOffset),
    [onPointerOver, globalOffset],
  );

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, nodes.length]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={onPointerOut}
      frustumCulled={true}
    />
  );
}

export function NodeInstances({ nodes, palette }: NodeInstancesProps) {
  const gpuBackend = useRendererStore((s) => s.gpuBackend);
  const encounterNodeId = useRendererStore((s) => s.encounterNodeId);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.accent),
      emissive: new THREE.Color(palette.glow),
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.6,
      transparent: true,
      opacity: 0.9,
    });
  }, [palette.accent, palette.glow]);

  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(1, 16, 12);
  }, []);

  // Build a global path→index map for click detection
  const pathToIndex = useMemo(() => {
    const map = new Map<number, string>();
    for (let i = 0; i < nodes.length; i++) {
      map.set(i, nodes[i]!.path);
    }
    return map;
  }, [nodes]);

  // Pulsing glow on all nodes + D8 encounter emissive pulse
  useFrame((state) => {
    if (!material) return;

    if (encounterNodeId) {
      const encounterPulse = Math.sin(state.clock.elapsedTime * 6) * 0.8 + 2.5;
      material.emissiveIntensity = encounterPulse;
      material.emissive.set('#ff4444');
    } else {
      const pulse = Math.sin(state.clock.elapsedTime * 1.5) * 0.2 + 1.2;
      material.emissiveIntensity = pulse;
      material.emissive.set(palette.glow);
    }
  });

  // Click handler — receives globalOffset from the chunk
  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>, globalOffset: number) => {
      event.stopPropagation();
      const instanceId = event.instanceId;
      if (instanceId === undefined) return;

      const globalIndex = globalOffset + instanceId;
      const path = pathToIndex.get(globalIndex);
      if (!path) return;

      const node = nodes[globalIndex]!;
      useRendererStore.getState().selectNode(path);

      getEventBus().emit(GameEvents.NODE_CLICKED, {
        nodeId: path,
        filePath: path,
        position: node.position.toArray() as [number, number, number],
      });
    },
    [nodes, pathToIndex]
  );

  // Hover handler
  const handlePointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>, globalOffset: number) => {
      event.stopPropagation();
      const instanceId = event.instanceId;
      if (instanceId === undefined) return;

      const globalIndex = globalOffset + instanceId;
      const path = pathToIndex.get(globalIndex);
      if (path) {
        useRendererStore.getState().hoverNode(path);
        document.body.style.cursor = 'pointer';
      }
    },
    [pathToIndex]
  );

  const handlePointerOut = useCallback(() => {
    useRendererStore.getState().hoverNode(null);
    document.body.style.cursor = 'default';
  }, []);

  if (nodes.length === 0) return null;

  // On WebGPU, split into chunks of 1000 to stay within the 64KB UBO limit
  const needsChunking = gpuBackend === 'webgpu' && nodes.length > WEBGPU_MAX_INSTANCES_PER_MESH;
  const chunks = needsChunking
    ? chunkArray(nodes, WEBGPU_MAX_INSTANCES_PER_MESH)
    : [nodes];

  return (
    <>
      {chunks.map((chunk, i) => (
        <NodeMesh
          key={i}
          nodes={chunk}
          globalOffset={i * WEBGPU_MAX_INSTANCES_PER_MESH}
          geometry={geometry}
          material={material}
          palette={palette}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      ))}
    </>
  );
}
