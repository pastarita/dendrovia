import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import type { FileTreeNode, ProceduralPalette, Hotspot, LSystemRule } from '@dendrovia/shared';
import { useRendererStore } from './store/useRendererStore';
import { loadGeneratedAssets, type CacheableAssetLoader } from './loader/AssetBridge';
import { detectGPU } from './renderer/detectGPU';
import { DendriteWorld } from './components/DendriteWorld';
import { CameraRig } from './components/CameraRig';
import { Lighting } from './components/Lighting';
import { PostProcessing } from './components/PostProcessing';
import { PerformanceMonitor } from './components/PerformanceMonitor';

/**
 * ARCHITECTUS APP
 *
 * The main renderer entry point. Orchestrates:
 *   - GPU detection and quality tier selection
 *   - R3F Canvas with adaptive DPR
 *   - Scene graph (DendriteWorld, CameraRig, Lighting, PostProcessing)
 *   - Loading state management
 *
 * Can be used standalone (dev mode) or embedded in the full Dendrovia app.
 */

interface AppProps {
  /** Code topology from CHRONOS (optional — uses demo data if not provided) */
  topology?: FileTreeNode;
  /** Visual palette from IMAGINARIUM (optional — uses default if not provided) */
  palette?: ProceduralPalette;
  /** Hotspot data from CHRONOS */
  hotspots?: Hotspot[];
  /** Path to IMAGINARIUM manifest.json (triggers asset loading when provided) */
  manifestPath?: string;
  /** OPERATUS AssetLoader for cached loading (optional — direct fetch when omitted) */
  assetLoader?: CacheableAssetLoader | null;
}

// Default "beautiful fallback" palette (Tron-inspired)
const DEFAULT_PALETTE: ProceduralPalette = {
  primary: '#0a4a6e',
  secondary: '#1a2a4e',
  accent: '#00ffcc',
  background: '#0a0a0a',
  glow: '#00ffff',
  mood: 'cool',
};

// Demo topology for standalone dev mode
const DEMO_TOPOLOGY: FileTreeNode = {
  name: 'src',
  path: 'src',
  type: 'directory',
  children: [
    {
      name: 'components',
      path: 'src/components',
      type: 'directory',
      children: [
        { name: 'App.tsx', path: 'src/components/App.tsx', type: 'file', metadata: { path: 'src/components/App.tsx', hash: 'a1', language: 'typescript', complexity: 8, loc: 120, lastModified: new Date(), author: 'dev' } },
        { name: 'Header.tsx', path: 'src/components/Header.tsx', type: 'file', metadata: { path: 'src/components/Header.tsx', hash: 'a2', language: 'typescript', complexity: 3, loc: 45, lastModified: new Date(), author: 'dev' } },
        { name: 'Sidebar.tsx', path: 'src/components/Sidebar.tsx', type: 'file', metadata: { path: 'src/components/Sidebar.tsx', hash: 'a3', language: 'typescript', complexity: 5, loc: 80, lastModified: new Date(), author: 'dev' } },
      ],
    },
    {
      name: 'utils',
      path: 'src/utils',
      type: 'directory',
      children: [
        { name: 'helpers.ts', path: 'src/utils/helpers.ts', type: 'file', metadata: { path: 'src/utils/helpers.ts', hash: 'b1', language: 'typescript', complexity: 12, loc: 200, lastModified: new Date(), author: 'dev' } },
        { name: 'api.ts', path: 'src/utils/api.ts', type: 'file', metadata: { path: 'src/utils/api.ts', hash: 'b2', language: 'typescript', complexity: 6, loc: 90, lastModified: new Date(), author: 'dev' } },
      ],
    },
    {
      name: 'types',
      path: 'src/types',
      type: 'directory',
      children: [
        { name: 'index.ts', path: 'src/types/index.ts', type: 'file', metadata: { path: 'src/types/index.ts', hash: 'c1', language: 'typescript', complexity: 1, loc: 50, lastModified: new Date(), author: 'dev' } },
      ],
    },
    { name: 'index.ts', path: 'src/index.ts', type: 'file', metadata: { path: 'src/index.ts', hash: 'd1', language: 'typescript', complexity: 2, loc: 15, lastModified: new Date(), author: 'dev' } },
    { name: 'main.tsx', path: 'src/main.tsx', type: 'file', metadata: { path: 'src/main.tsx', hash: 'd2', language: 'typescript', complexity: 1, loc: 10, lastModified: new Date(), author: 'dev' } },
  ],
};

export function App({ topology, palette, hotspots, manifestPath, assetLoader }: AppProps = {}) {
  const quality = useRendererStore((s) => s.quality);
  const setQualityTier = useRendererStore((s) => s.setQualityTier);
  const setGpuBackend = useRendererStore((s) => s.setGpuBackend);
  const setLoading = useRendererStore((s) => s.setLoading);
  const generatedAssets = useRendererStore((s) => s.generatedAssets);
  const setGeneratedAssets = useRendererStore((s) => s.setGeneratedAssets);
  const sdfBackdrop = useRendererStore((s) => s.sdfBackdrop);
  const toggleSdfBackdrop = useRendererStore((s) => s.toggleSdfBackdrop);

  const [gpuReady, setGpuReady] = useState(false);

  const activeTopology = topology ?? DEMO_TOPOLOGY;

  // Palette priority: explicit prop > loaded IMAGINARIUM palette > hardcoded default
  const activePalette = palette ?? generatedAssets?.palette ?? DEFAULT_PALETTE;

  // L-system rules from IMAGINARIUM (if available)
  const activeLSystem: LSystemRule | undefined = generatedAssets?.lsystem ?? undefined;

  // Phase 1: GPU detection on mount
  useEffect(() => {
    let cancelled = false;

    detectGPU().then((caps) => {
      if (cancelled) return;
      setQualityTier(caps.tier);
      setGpuBackend(caps.backend);
      setGpuReady(true);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [setQualityTier, setGpuBackend, setLoading]);

  // Phase 2: Load IMAGINARIUM generated assets (non-blocking)
  useEffect(() => {
    if (!manifestPath) return;
    let cancelled = false;

    loadGeneratedAssets(manifestPath, { assetLoader: assetLoader ?? undefined }).then((assets) => {
      if (cancelled || !assets) return;
      setGeneratedAssets(assets);
    });

    return () => { cancelled = true; };
  }, [manifestPath, assetLoader, setGeneratedAssets]);

  if (!gpuReady) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: activePalette.background,
        color: activePalette.glow,
        fontFamily: "'Courier New', monospace",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            ARCHITECTUS
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
            Detecting GPU capabilities...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        dpr={quality.dpr}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        style={{ background: activePalette.background }}
      >
        <PerspectiveCamera
          makeDefault
          position={[10, 14, -16]}
          fov={60}
          near={0.1}
          far={500}
        />

        {/* Adaptive quality from R3F/drei */}
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        <Suspense fallback={null}>
          {/* Scene contents */}
          <Lighting />
          <CameraRig />
          <DendriteWorld
            topology={activeTopology}
            hotspots={hotspots}
            palette={activePalette}
            lsystemOverride={activeLSystem}
          />
          <PostProcessing />
        </Suspense>

        {/* Performance tracking (no visual output) */}
        <PerformanceMonitor />

        {/* Debug grid (dev mode only) */}
        <gridHelper args={[40, 40, '#1a1a2e', '#0a0a1e']} />
      </Canvas>
    </div>
  );
}
