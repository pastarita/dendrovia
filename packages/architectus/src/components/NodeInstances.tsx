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
 */

interface NodeInstancesProps {
  nodes: NodeMarker[];
  palette: {
    accent: string;
    glow: string;
  };
}

const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _color = new THREE.Color();

export function NodeInstances({ nodes, palette }: NodeInstancesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const selectedNodeId = useRendererStore((s) => s.selectedNodeId);
  const hoveredNodeId = useRendererStore((s) => s.hoveredNodeId);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.accent),
      emissive: new THREE.Color(palette.glow),
      emissiveIntensity: 1.2, // Above 1.0 → bloom catches it
      roughness: 0.1,
      metalness: 0.6,
      transparent: true,
      opacity: 0.9,
    });
  }, [palette.accent, palette.glow]);

  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(1, 16, 12);
  }, []);

  // Build a path→index map for click detection
  const pathToIndex = useMemo(() => {
    const map = new Map<number, string>();
    for (let i = 0; i < nodes.length; i++) {
      map.set(i, nodes[i].path);
    }
    return map;
  }, [nodes]);

  // Update instance matrices
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || nodes.length === 0) return;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      _position.copy(node.position);
      _quaternion.identity();

      // Size based on type (directories larger) and depth (deeper = smaller)
      const isDir = node.type === 'directory';
      const baseSize = isDir ? 0.2 : 0.12;
      const depthScale = Math.max(0.5, 1 - node.depth * 0.1);
      const size = baseSize * depthScale;

      _scale.set(size, size, size);
      _matrix.compose(_position, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);

      // Color: directories are accent, files are glow (reuse temp — no allocation)
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

  // Pulsing glow on all nodes
  useFrame((state) => {
    if (material) {
      const pulse = Math.sin(state.clock.elapsedTime * 1.5) * 0.2 + 1.2;
      material.emissiveIntensity = pulse;
    }
  });

  // Click handler
  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      const instanceId = event.instanceId;
      if (instanceId === undefined) return;

      const path = pathToIndex.get(instanceId);
      if (!path) return;

      const node = nodes[instanceId];
      useRendererStore.getState().selectNode(path);

      // Emit event for other pillars
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
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      const instanceId = event.instanceId;
      if (instanceId === undefined) return;

      const path = pathToIndex.get(instanceId);
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

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, nodes.length]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      frustumCulled={true}
    />
  );
}
