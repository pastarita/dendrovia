'use client';

import { useState, useEffect } from 'react';
import type { AssetManifest } from '@dendrovia/shared';
import { ManifestHeader } from './components/ManifestHeader';
import { ShaderEntries } from './components/ShaderEntries';
import { PaletteEntries } from './components/PaletteEntries';
import { MeshEntries } from './components/MeshEntries';
import { MycologySection } from './components/MycologySection';

const DEMO_MANIFEST: AssetManifest = {
  version: '0.3.0-demo',
  checksum: 'a1b2c3d4e5f6',
  topology: 'generated/topology.json',
  shaders: {
    dendrite: 'generated/shaders/dendrite.glsl',
    bark: 'generated/shaders/bark.glsl',
    canopy: 'generated/shaders/canopy.glsl',
    mycelium: 'generated/shaders/mycelium.glsl',
    spore: 'generated/shaders/spore.glsl',
  },
  palettes: {
    forest: 'generated/palettes/forest.json',
    cavern: 'generated/palettes/cavern.json',
    twilight: 'generated/palettes/twilight.json',
    aurora: 'generated/palettes/aurora.json',
  },
  mycology: {
    specimens: 'generated/mycology/specimens.json',
    network: 'generated/mycology/network.json',
    assetDir: 'generated/mycology/svg/',
    specimenCount: 42,
  },
  meshes: {
    'amanita-muscaria': {
      path: 'generated/meshes/amanita-muscaria.mesh',
      hash: 'f3a8c7b2e1d94a6b',
      format: 'halfedge',
      vertices: 2048,
      faces: 4096,
      size: 32768,
      tier: 'enriched',
      genusId: 'amanita',
    },
    'boletus-edulis': {
      path: 'generated/meshes/boletus-edulis.mesh',
      hash: 'c1d2e3f4a5b6c7d8',
      format: 'indexed',
      vertices: 1024,
      faces: 2048,
      size: 16384,
      tier: 'base',
      genusId: 'boletus',
    },
    'cantharellus-cibarius': {
      path: 'generated/meshes/cantharellus-cibarius.mesh',
      hash: '9a8b7c6d5e4f3a2b',
      format: 'profile',
      vertices: 512,
      faces: 1024,
      size: 8192,
      tier: 'parametric',
      genusId: 'cantharellus',
    },
  },
};

export function ManifestCatalogClient() {
  const [manifest, setManifest] = useState<AssetManifest | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/generated/manifest.json')
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setManifest(data);
        setIsDemo(false);
      })
      .catch(() => {
        setManifest(DEMO_MANIFEST);
        setIsDemo(true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ marginTop: "2rem", opacity: 0.5 }}>Loading manifest...</div>;
  }

  if (!manifest) {
    return <div style={{ marginTop: "2rem", opacity: 0.5 }}>No manifest available.</div>;
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      {isDemo && (
        <div style={{
          display: "inline-block",
          padding: "0.25rem 0.75rem",
          background: "#3b2d00",
          border: "1px solid #d97706",
          borderRadius: "4px",
          fontSize: "0.75rem",
          color: "#fbbf24",
          marginBottom: "1rem",
        }}>
          Demo Data — No manifest.json at /generated/
        </div>
      )}

      <ManifestHeader manifest={manifest} />
      <ShaderEntries shaders={manifest.shaders} />
      <PaletteEntries palettes={manifest.palettes} />
      {manifest.meshes && <MeshEntries meshes={manifest.meshes} />}
      {manifest.mycology && <MycologySection mycology={manifest.mycology} />}
    </div>
  );
}
