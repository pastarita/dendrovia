'use client';

import type { AssetManifest } from '@dendrovia/shared';

export function ManifestHeader({ manifest }: { manifest: AssetManifest }) {
  const shaderCount = Object.keys(manifest.shaders).length;
  const paletteCount = Object.keys(manifest.palettes).length;
  const meshCount = manifest.meshes ? Object.keys(manifest.meshes).length : 0;

  return (
    <div style={{
      padding: "1rem 1.25rem",
      border: "1px solid #222",
      borderRadius: "8px",
      marginBottom: "1rem",
    }}>
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.4 }}>Version</span>
          <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.95rem" }}>{manifest.version}</div>
        </div>
        <div>
          <span style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.4 }}>Checksum</span>
          <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.95rem" }}>{manifest.checksum}</div>
        </div>
        <div>
          <span style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.4 }}>Topology</span>
          <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.95rem" }}>{manifest.topology}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "1rem" }}>
          <Stat label="Shaders" value={shaderCount} />
          <Stat label="Palettes" value={paletteCount} />
          <Stat label="Meshes" value={meshCount} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: "0.7rem", opacity: 0.4 }}>{label}</div>
    </div>
  );
}
