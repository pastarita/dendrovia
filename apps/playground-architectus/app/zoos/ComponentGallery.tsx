'use client';

import { useState, useMemo, Suspense, Component, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import {
  LSystem,
  TurtleInterpreter,
  BranchInstances,
  NodeInstances,
  CameraRig,
  Lighting,
  PostProcessing,
  PerformanceMonitor,
  useRendererStore,
} from '@dendrovia/architectus';
import type { ProceduralPalette } from '@dendrovia/shared';
import { ComponentCard, ComponentInfo, type ComponentEntry } from './ComponentCard';

// ---------------------------------------------------------------------------
// Component registry — every exported ARCHITECTUS component
// ---------------------------------------------------------------------------

const COMPONENTS: ComponentEntry[] = [
  {
    id: 'branch-instances',
    name: 'BranchInstances',
    category: 'rendering',
    description: 'Instanced cylinders for branch segments with depth-based coloring and emissive pulsing.',
    propsSignature: `branches: BranchSegment[]
palette: {
  primary: string   // Hex — trunk color
  secondary: string // Hex — tip color
  glow: string      // Hex — emissive color
}`,
    snippet: `<BranchInstances
  branches={geometry.branches}
  palette={{
    primary: "#0a4a6e",
    secondary: "#1a2a4e",
    glow: "#00ffff",
  }}
/>`,
  },
  {
    id: 'node-instances',
    name: 'NodeInstances',
    category: 'rendering',
    description: 'Instanced spheres for file/directory nodes. Click emits NODE_CLICKED via EventBus.',
    propsSignature: `nodes: NodeMarker[]
palette: {
  accent: string // Hex — node color
  glow: string   // Hex — emissive glow
}`,
    snippet: `<NodeInstances
  nodes={geometry.nodes}
  palette={{
    accent: "#00ffcc",
    glow: "#00ffff",
  }}
/>`,
  },
  {
    id: 'dendrite-world',
    name: 'DendriteWorld',
    category: 'rendering',
    description: 'Core scene container. Runs topology → L-System → Turtle → GPU pipeline. Includes BranchTracker.',
    propsSignature: `topology: FileTreeNode
hotspots?: Hotspot[]
palette: ProceduralPalette
lsystemOverride?: LSystemRule`,
    snippet: `<DendriteWorld
  topology={topologyData}
  hotspots={hotspotData}
  palette={palette}
/>`,
  },
  {
    id: 'camera-rig',
    name: 'CameraRig',
    category: 'camera',
    description: 'Two-mode camera: Falcon (orbit) and Player (surface-locked). Smooth SLERP transitions.',
    propsSignature: `(no props — reads from useRendererStore)

Store fields:
  cameraMode: "falcon" | "player"
  cameraTransitioning: boolean
  playerPosition: [x, y, z]`,
    snippet: `<CameraRig />

// Toggle with:
useRendererStore.getState()
  .setCameraMode("player")`,
  },
  {
    id: 'lighting',
    name: 'Lighting',
    category: 'effects',
    description: 'Tron-aesthetic lighting: low ambient, sharp directional key, cyan fill from below, hemisphere gradient.',
    propsSignature: `(no props — reads shadows from store)

Lights:
  ambientLight (0.15, #1a1a2e)
  directionalLight (key, 0.6)
  directionalLight (fill, 0.1, #00ffff)
  hemisphereLight (#1a1a3e → #0a0a0a)`,
    snippet: `<Lighting />`,
  },
  {
    id: 'post-processing',
    name: 'PostProcessing',
    category: 'effects',
    description: 'Effect stack: Bloom (catches emissive >1.0), Chromatic Aberration, Vignette. Auto-merged GPU passes.',
    propsSignature: `(no props — reads from store)

Store fields:
  quality.postProcessing: boolean
  quality.bloom: boolean`,
    snippet: `<PostProcessing />

// Controlled via quality tier:
useRendererStore.getState()
  .setQualityTier("high")`,
  },
  {
    id: 'performance-monitor',
    name: 'PerformanceMonitor',
    category: 'systems',
    description: 'Samples FPS and renderer stats every 30 frames. Updates store via getState() to avoid re-render churn.',
    propsSignature: `(no props — writes to store)

Updates:
  fps: number
  drawCalls: number
  triangles: number`,
    snippet: `<PerformanceMonitor />

// Read stats:
const fps = useRendererStore(s => s.fps)`,
  },
];

const CATEGORIES = ['rendering', 'camera', 'effects', 'systems'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  rendering: 'Rendering',
  camera: 'Camera',
  effects: 'Effects',
  systems: 'Systems',
};

// ---------------------------------------------------------------------------
// Palette + scene generation for preview
// ---------------------------------------------------------------------------

const PALETTE: ProceduralPalette = {
  primary: '#0a4a6e',
  secondary: '#1a2a4e',
  accent: '#00ffcc',
  background: '#0a0a0a',
  glow: '#00ffff',
  mood: 'cool',
};

function useSampleGeometry() {
  return useMemo(() => {
    const ls = new LSystem({
      axiom: 'F',
      rules: { F: 'F[+F][-F]' },
      iterations: 4,
      angle: 25,
      seed: 42,
    });
    const turtle = new TurtleInterpreter(25);
    return turtle.interpret(ls.expand());
  }, []);
}

// ---------------------------------------------------------------------------
// Error boundary for R3F components that may fail (e.g. PostProcessing)
// ---------------------------------------------------------------------------

class R3FErrorBoundary extends Component<{ fallback?: ReactNode; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return this.props.fallback ?? null;
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Scene that highlights the selected component
// ---------------------------------------------------------------------------

function PreviewScene({ selectedId }: { selectedId: string }) {
  const geom = useSampleGeometry();

  // Show different combinations based on selected component
  const showBranches = ['branch-instances', 'dendrite-world', 'lighting', 'camera-rig', 'performance-monitor'].includes(selectedId);
  const showNodes = ['node-instances', 'dendrite-world', 'lighting', 'camera-rig', 'performance-monitor'].includes(selectedId);
  const showPostFx = selectedId === 'post-processing';

  return (
    <>
      <Lighting />
      {showBranches && (
        <BranchInstances
          branches={geom.branches}
          palette={{ primary: PALETTE.primary, secondary: PALETTE.secondary, glow: PALETTE.glow }}
        />
      )}
      {showNodes && (
        <NodeInstances
          nodes={geom.nodes}
          palette={{ accent: PALETTE.accent, glow: PALETTE.glow }}
        />
      )}
      {showPostFx && (
        <>
          <BranchInstances
            branches={geom.branches}
            palette={{ primary: PALETTE.primary, secondary: PALETTE.secondary, glow: PALETTE.glow }}
          />
          <NodeInstances
            nodes={geom.nodes}
            palette={{ accent: PALETTE.accent, glow: PALETTE.glow }}
          />
          <R3FErrorBoundary>
            <PostProcessing />
          </R3FErrorBoundary>
        </>
      )}
      <PerformanceMonitor />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Gallery Component
// ---------------------------------------------------------------------------

export function ComponentGallery() {
  const [selectedId, setSelectedId] = useState('branch-instances');
  const fps = useRendererStore((s) => s.fps);

  // Non-null: COMPONENTS is a non-empty const array and selectedId defaults to a valid key
  const selectedEntry = (COMPONENTS.find((c) => c.id === selectedId) ?? COMPONENTS[0]) as ComponentEntry;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 10rem)' }}>
      {/* Sidebar — component list */}
      <div style={{
        width: 260,
        padding: '1rem',
        borderRight: '1px solid #333',
        overflowY: 'auto',
        flexShrink: 0,
        background: '#111',
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--pillar-accent)' }}>
          Components
        </div>

        {CATEGORIES.map((cat) => (
          <div key={cat} style={{ marginBottom: '1rem' }}>
            <div style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              opacity: 0.4,
              marginBottom: '0.4rem',
            }}>
              {CATEGORY_LABELS[cat]}
            </div>
            {COMPONENTS.filter((c) => c.category === cat).map((entry) => (
              <ComponentCard
                key={entry.id}
                entry={entry}
                selected={entry.id === selectedId}
                onSelect={() => setSelectedId(entry.id)}
              />
            ))}
          </div>
        ))}

        {/* Stats */}
        <div style={{
          padding: '0.5rem',
          background: '#0a0a1e',
          border: '1px solid #1a1a3e',
          borderRadius: '4px',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.7rem',
          marginTop: '1rem',
        }}>
          <div style={{ opacity: 0.5, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
            Performance
          </div>
          <div>FPS: {fps || '...'}</div>
          <div style={{ opacity: 0.4 }}>
            {COMPONENTS.length} components registered
          </div>
        </div>
      </div>

      {/* Main area — Canvas + Info */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <Canvas
            dpr={[1, 1.5]}
            gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
            style={{ background: PALETTE.background }}
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

            {/* @ts-expect-error React 18/19 type mismatch across workspace packages */}
            <Suspense fallback={null}>
              <PreviewScene selectedId={selectedId} />
            </Suspense>

            <gridHelper args={[40, 40, '#1a1a2e', '#0a0a1e']} />
          </Canvas>

          {/* Component label overlay */}
          <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
            padding: '6px 10px',
            background: '#0a0a0acc',
            border: '1px solid var(--pillar-accent)',
            borderRadius: '4px',
            color: 'var(--pillar-accent)',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.75rem',
            fontWeight: 600,
            pointerEvents: 'none',
          }}>
            &lt;{selectedEntry.name} /&gt;
          </div>
        </div>

        {/* Component info panel */}
        <ComponentInfo entry={selectedEntry} />
      </div>
    </div>
  );
}
