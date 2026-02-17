'use client';

import type { MeshManifestEntry } from '@dendrovia/shared';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TIER_COLORS: Record<string, { bg: string; fg: string }> = {
  enriched: { bg: '#1e3a5f', fg: '#93c5fd' },
  base: { bg: '#3b2d00', fg: '#fbbf24' },
  parametric: { bg: '#1e3b1e', fg: '#86efac' },
  billboard: { bg: '#3b1e1e', fg: '#fca5a5' },
};

const FORMAT_COLORS: Record<string, { bg: string; fg: string }> = {
  halfedge: { bg: '#3c1f5f', fg: '#c4b5fd' },
  indexed: { bg: '#1e3a5f', fg: '#93c5fd' },
  profile: { bg: '#3c6b63', fg: '#99f6e4' },
};

export function MeshEntries({ meshes }: { meshes: Record<string, MeshManifestEntry> }) {
  const entries = Object.entries(meshes);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Meshes ({entries.length})</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Path</th>
              <th style={thStyle}>Hash</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Vertices</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Faces</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Size</th>
              <th style={thStyle}>Tier</th>
              <th style={thStyle}>Format</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([id, mesh]) => {
              const tier = TIER_COLORS[mesh.tier] ?? { bg: '#333', fg: '#aaa' };
              const fmt = FORMAT_COLORS[mesh.format] ?? { bg: '#333', fg: '#aaa' };
              return (
                <tr key={id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 500 }}>{id}</span>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--font-geist-mono)', fontSize: '0.75rem', opacity: 0.5 }}>
                    {mesh.path}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--font-geist-mono)', fontSize: '0.75rem', opacity: 0.5 }}>
                    {mesh.hash.slice(0, 8)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-geist-mono)' }}>
                    {mesh.vertices.toLocaleString()}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-geist-mono)' }}>
                    {mesh.faces.toLocaleString()}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-geist-mono)' }}>
                    {formatBytes(mesh.size)}
                  </td>
                  <td style={tdStyle}>
                    <Badge bg={tier.bg} fg={tier.fg}>
                      {mesh.tier}
                    </Badge>
                  </td>
                  <td style={tdStyle}>
                    <Badge bg={fmt.bg} fg={fmt.fg}>
                      {mesh.format}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: '0.65rem',
        padding: '0.15rem 0.4rem',
        borderRadius: '3px',
        background: bg,
        color: fg,
      }}
    >
      {children}
    </span>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem 0.75rem',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  opacity: 0.5,
  fontWeight: 500,
};

const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
};
