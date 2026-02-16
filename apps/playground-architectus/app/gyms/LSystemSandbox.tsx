'use client';

import { useState, useMemo, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import {
  LSystem,
  TurtleInterpreter,
  BranchInstances,
  NodeInstances,
  Lighting,
  PerformanceMonitor,
  useRendererStore,
} from '@dendrovia/architectus';
import type { TreeGeometry } from '@dendrovia/architectus';
import type { ProceduralPalette, FileTreeNode } from '@dendrovia/shared';
import { ParameterPanel } from './ParameterPanel';

// ---------------------------------------------------------------------------
// Palette presets
// ---------------------------------------------------------------------------

const PALETTE_PRESETS: Record<string, ProceduralPalette> = {
  Tron:     { primary: '#0a4a6e', secondary: '#1a2a4e', accent: '#00ffcc', background: '#0a0a0a', glow: '#00ffff', mood: 'cool' },
  Ember:    { primary: '#6e3a0a', secondary: '#4e2a1a', accent: '#ffcc00', background: '#0a0a0a', glow: '#ff6600', mood: 'warm' },
  Matrix:   { primary: '#0a4e2a', secondary: '#1a3e1a', accent: '#00ff66', background: '#050a05', glow: '#00ff00', mood: 'cool' },
  Amethyst: { primary: '#3a1a6e', secondary: '#2a1a4e', accent: '#cc66ff', background: '#050505', glow: '#9933ff', mood: 'cool' },
};

const PALETTE_KEYS = Object.keys(PALETTE_PRESETS);

// ---------------------------------------------------------------------------
// L-system presets
// ---------------------------------------------------------------------------

const PRESETS = [
  { name: 'Simple Binary',  axiom: 'F', rules: 'F: F[+F][-F]',            angle: 25, iterations: 5, seed: 42 },
  { name: 'Dense Canopy',   axiom: 'F', rules: 'F: FF[+F][-F][^F]',       angle: 30, iterations: 3, seed: 42 },
  { name: 'Sparse Twig',    axiom: 'F', rules: 'F: F[+F]',                angle: 35, iterations: 6, seed: 42 },
  { name: 'Bushy',          axiom: 'F', rules: 'F: F[+F]F[-F]F',          angle: 20, iterations: 3, seed: 42 },
  { name: '3D Spread',      axiom: 'F', rules: 'F: F[+F][^F][-F][&F]',    angle: 30, iterations: 3, seed: 42 },
  { name: 'Topology Demo',  axiom: '__TOPOLOGY__', rules: '',              angle: 25, iterations: 1, seed: 42 },
];

// ---------------------------------------------------------------------------
// Rule parser
// ---------------------------------------------------------------------------

function parseRules(text: string): Record<string, string> {
  const rules: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(':');
    if (idx === -1) continue;
    const sym = trimmed.slice(0, idx).trim();
    const repl = trimmed.slice(idx + 1).trim();
    if (sym.length === 1 && repl) {
      rules[sym] = repl;
    }
  }
  return rules;
}

// ---------------------------------------------------------------------------
// Demo topology for the "Topology Demo" preset
// ---------------------------------------------------------------------------

const DEMO_TOPOLOGY: FileTreeNode = {
  name: 'src', path: 'src', type: 'directory',
  children: [
    {
      name: 'components', path: 'src/components', type: 'directory',
      children: [
        { name: 'App.tsx', path: 'src/components/App.tsx', type: 'file', metadata: { path: 'src/components/App.tsx', hash: 'a1', language: 'typescript', complexity: 8, loc: 120, lastModified: new Date(), author: 'dev' } },
        { name: 'Header.tsx', path: 'src/components/Header.tsx', type: 'file', metadata: { path: 'src/components/Header.tsx', hash: 'a2', language: 'typescript', complexity: 3, loc: 45, lastModified: new Date(), author: 'dev' } },
        { name: 'Sidebar.tsx', path: 'src/components/Sidebar.tsx', type: 'file', metadata: { path: 'src/components/Sidebar.tsx', hash: 'a3', language: 'typescript', complexity: 5, loc: 80, lastModified: new Date(), author: 'dev' } },
      ],
    },
    {
      name: 'utils', path: 'src/utils', type: 'directory',
      children: [
        { name: 'helpers.ts', path: 'src/utils/helpers.ts', type: 'file', metadata: { path: 'src/utils/helpers.ts', hash: 'b1', language: 'typescript', complexity: 12, loc: 200, lastModified: new Date(), author: 'dev' } },
        { name: 'api.ts', path: 'src/utils/api.ts', type: 'file', metadata: { path: 'src/utils/api.ts', hash: 'b2', language: 'typescript', complexity: 6, loc: 90, lastModified: new Date(), author: 'dev' } },
      ],
    },
    {
      name: 'types', path: 'src/types', type: 'directory',
      children: [
        { name: 'index.ts', path: 'src/types/index.ts', type: 'file', metadata: { path: 'src/types/index.ts', hash: 'c1', language: 'typescript', complexity: 1, loc: 50, lastModified: new Date(), author: 'dev' } },
      ],
    },
    { name: 'index.ts', path: 'src/index.ts', type: 'file', metadata: { path: 'src/index.ts', hash: 'd1', language: 'typescript', complexity: 2, loc: 15, lastModified: new Date(), author: 'dev' } },
    { name: 'main.tsx', path: 'src/main.tsx', type: 'file', metadata: { path: 'src/main.tsx', hash: 'd2', language: 'typescript', complexity: 1, loc: 10, lastModified: new Date(), author: 'dev' } },
  ],
};

const MAX_STRING_LENGTH = 200_000;

// ---------------------------------------------------------------------------
// Main Sandbox Component
// ---------------------------------------------------------------------------

export function LSystemSandbox() {
  const [axiom, setAxiom] = useState('F');
  const [rulesText, setRulesText] = useState('F: F[+F][-F]');
  const [angle, setAngle] = useState(25);
  const [iterations, setIterations] = useState(5);
  const [seed, setSeed] = useState(42);
  const [paletteKey, setPaletteKey] = useState('Tron');

  const fps = useRendererStore((s) => s.fps);
  const parsedRules = useMemo(() => parseRules(rulesText), [rulesText]);
  // Explicit type to avoid indexed-access undefined narrowing
  const palette: ProceduralPalette = PALETTE_PRESETS[paletteKey] ?? {
    primary: '#0a4a6e', secondary: '#1a2a4e', accent: '#00ffcc',
    background: '#0a0a0a', glow: '#00ffff', mood: 'cool',
  };

  const useTopology = axiom === '__TOPOLOGY__';

  // Compute tree geometry from L-system params (memoized)
  const { geometry, error, stats } = useMemo(() => {
    try {
      let treeGeom: TreeGeometry;

      if (useTopology) {
        // Use the full CHRONOS → L-System → Turtle pipeline
        const ls = LSystem.fromTopology(DEMO_TOPOLOGY, [], seed);
        const expanded = ls.expand();
        const turtle = new TurtleInterpreter(angle);
        treeGeom = turtle.interpret(expanded);
      } else {
        // Use manual L-system params
        const ls = new LSystem({ axiom, rules: parsedRules, iterations, angle, seed });
        const expanded = ls.expand();
        if (expanded.length > MAX_STRING_LENGTH) {
          return {
            geometry: null,
            error: `L-system string too long (${expanded.length.toLocaleString()} chars). Reduce iterations.`,
            stats: null,
          };
        }
        const turtle = new TurtleInterpreter(angle);
        treeGeom = turtle.interpret(expanded);
      }

      return {
        geometry: treeGeom,
        error: null,
        stats: {
          branches: treeGeom.branches.length,
          nodes: treeGeom.nodes.length,
          stringLength: 0,
        },
      };
    } catch (e) {
      return {
        geometry: null,
        error: e instanceof Error ? e.message : String(e),
        stats: null,
      };
    }
  }, [axiom, parsedRules, iterations, angle, seed, useTopology]);

  const loadPreset = useCallback((preset: typeof PRESETS[0]) => {
    setAxiom(preset.axiom);
    setRulesText(preset.rules);
    setAngle(preset.angle);
    setIterations(preset.iterations);
    setSeed(preset.seed);
  }, []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 10rem)' }}>
      <ParameterPanel
        axiom={useTopology ? '(from topology)' : axiom}
        setAxiom={setAxiom}
        rulesText={useTopology ? '(auto-generated from file tree)' : rulesText}
        setRulesText={setRulesText}
        angle={angle} setAngle={setAngle}
        iterations={useTopology ? 1 : iterations}
        setIterations={setIterations}
        seed={seed} setSeed={setSeed}
        paletteKey={paletteKey} setPaletteKey={setPaletteKey}
        paletteKeys={PALETTE_KEYS}
        presets={PRESETS}
        loadPreset={loadPreset}
        stats={stats}
        fps={fps}
        error={error}
      />

      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
          style={{ background: palette.background }}
        >
          <PerspectiveCamera
            makeDefault
            position={[10, 14, -16]}
            fov={60}
            near={0.1}
            far={500}
          />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={100}
          />

          <Suspense fallback={null}>
            <Lighting />
            {geometry && (
              <>
                <BranchInstances
                  branches={geometry.branches}
                  palette={{
                    primary: palette.primary,
                    secondary: palette.secondary,
                    glow: palette.glow,
                  }}
                />
                <NodeInstances
                  nodes={geometry.nodes}
                  palette={{
                    accent: palette.accent,
                    glow: palette.glow,
                  }}
                />
              </>
            )}
          </Suspense>

          <PerformanceMonitor />
          <gridHelper args={[40, 40, '#1a1a2e', '#0a0a1e']} />
        </Canvas>

        {/* Performance overlay */}
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          color: palette.glow,
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.7rem',
          pointerEvents: 'none',
          textShadow: `0 0 6px ${palette.glow}40`,
        }}>
          <div style={{ opacity: 0.6 }}>{fps > 0 ? `${fps} FPS` : '...'}</div>
          {stats && (
            <div style={{ opacity: 0.4 }}>
              {stats.branches} branches | {stats.nodes} nodes
            </div>
          )}
        </div>

        {/* Mode indicator */}
        {useTopology && (
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            padding: '6px 10px',
            background: '#0a0a0acc',
            border: '1px solid var(--pillar-accent)',
            borderRadius: '4px',
            color: 'var(--pillar-accent)',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.7rem',
          }}>
            TOPOLOGY MODE — File tree &rarr; L-System &rarr; Turtle &rarr; GPU
          </div>
        )}
      </div>
    </div>
  );
}
