'use client';

import { Suspense, Component, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import {
  DendriteWorld,
  Lighting,
  PostProcessing,
  PerformanceMonitor,
  useRendererStore,
} from '@dendrovia/architectus';

class R3FErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() { return this.state.error ? null : this.props.children; }
}
import type { ShowcaseFixture } from './fixtures';

interface ShowcaseViewerProps {
  fixture: ShowcaseFixture;
  onClose: () => void;
}

export function ShowcaseViewer({ fixture, onClose }: ShowcaseViewerProps) {
  const fps = useRendererStore((s) => s.fps);
  const selectedNodeId = useRendererStore((s) => s.selectedNodeId);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: fixture.palette.background,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header bar */}
      <div style={{
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#111',
        borderBottom: '1px solid #333',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.35rem 0.75rem',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: '#ededed',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            &larr; Back
          </button>
          <div>
            <span style={{ fontWeight: 700, color: 'var(--pillar-accent)' }}>
              {fixture.name}
            </span>
            <span style={{ opacity: 0.4, marginLeft: '0.75rem', fontSize: '0.8rem' }}>
              {fixture.fileCount} files
              {fixture.hotspots.length > 0 && ` | ${fixture.hotspots.length} hotspots`}
            </span>
          </div>
        </div>

        {/* Performance stats */}
        <div style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.7rem',
          opacity: 0.5,
        }}>
          {fps > 0 ? `${fps} FPS` : '...'}
        </div>
      </div>

      {/* Canvas — fills remaining space */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
          style={{ background: fixture.palette.background }}
        >
          <PerspectiveCamera
            makeDefault
            position={[15, 20, -20]}
            fov={60}
            near={0.1}
            far={500}
          />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={100}
          />

          {/* @ts-expect-error React 18/19 type mismatch across workspace packages */}
          <Suspense fallback={null}>
            <Lighting />
            <DendriteWorld
              topology={fixture.topology}
              hotspots={fixture.hotspots}
              palette={fixture.palette}
            />
            <R3FErrorBoundary>
              <PostProcessing />
            </R3FErrorBoundary>
          </Suspense>

          <PerformanceMonitor />
          <gridHelper args={[60, 60, '#1a1a2e', '#0a0a1e']} />
        </Canvas>

        {/* Selected node info */}
        {selectedNodeId && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            padding: '8px 12px',
            background: `${fixture.palette.background}cc`,
            borderLeft: `2px solid ${fixture.palette.accent}`,
            color: fixture.palette.accent,
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.8rem',
            pointerEvents: 'none',
            textShadow: `0 0 8px ${fixture.palette.accent}40`,
          }}>
            <div style={{ opacity: 0.5, fontSize: '0.65rem', marginBottom: 2 }}>SELECTED</div>
            <div>{selectedNodeId}</div>
          </div>
        )}

        {/* Metadata panel */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          padding: '10px 14px',
          background: '#0a0a0acc',
          border: '1px solid #333',
          borderRadius: '6px',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.7rem',
          color: '#aaa',
          minWidth: 180,
        }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginBottom: '0.4rem' }}>
            Topology
          </div>
          <div>Files: {fixture.fileCount}</div>
          <div>Hotspots: {fixture.hotspots.length}</div>
          <div>Palette: {fixture.palette.mood}</div>
          {fixture.hotspots.length > 0 && (
            <>
              <div style={{ marginTop: '0.4rem', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>
                Top Risk
              </div>
              {fixture.hotspots.slice(0, 2).map((h) => (
                <div key={h.path} style={{ opacity: 0.7 }}>
                  {h.path.split('/').pop()} ({(h.riskScore * 100).toFixed(0)}%)
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
