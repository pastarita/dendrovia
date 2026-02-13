import { useMemo } from 'react';
import type { FileTreeNode, Hotspot, ProceduralPalette } from '@dendrovia/shared';
import { LSystem } from '../systems/LSystem';
import { TurtleInterpreter } from '../systems/TurtleInterpreter';
import { BranchInstances } from './BranchInstances';
import { NodeInstances } from './NodeInstances';

/**
 * DENDRITE WORLD
 *
 * The core scene container that transforms code topology into a 3D tree.
 *
 * Pipeline:
 *   1. FileTreeNode (from CHRONOS) → LSystem.fromTopology()
 *   2. LSystem.expand() → turtle string
 *   3. TurtleInterpreter.interpret() → BranchSegment[] + NodeMarker[]
 *   4. BranchInstances + NodeInstances → GPU-instanced geometry
 *
 * This component is memoized — it only regenerates when topology changes.
 */

interface DendriteWorldProps {
  topology: FileTreeNode;
  hotspots?: Hotspot[];
  palette: ProceduralPalette;
}

export function DendriteWorld({ topology, hotspots = [], palette }: DendriteWorldProps) {
  // Generate tree geometry from topology (memoized — expensive computation)
  const treeGeometry = useMemo(() => {
    const lSystem = LSystem.fromTopology(topology, hotspots);
    const turtleString = lSystem.expand();
    const interpreter = new TurtleInterpreter();
    return interpreter.interpret(turtleString);
  }, [topology, hotspots]);

  return (
    <group name="dendrite-world">
      {/* Branch geometry — instanced cylinders */}
      <BranchInstances
        branches={treeGeometry.branches}
        palette={{
          primary: palette.primary,
          secondary: palette.secondary,
          glow: palette.glow,
        }}
      />

      {/* Node markers — instanced spheres */}
      <NodeInstances
        nodes={treeGeometry.nodes}
        palette={{
          accent: palette.accent,
          glow: palette.glow,
        }}
      />
    </group>
  );
}
