'use client';

type OperatusMod = typeof import('@dendrovia/operatus');

const DEMO_ENTRIES = [
  {
    path: 'shaders/dendrite.glsl',
    data: '// dendrite vertex shader\nvoid main() { gl_Position = vec4(0.0); }',
    hash: 'abc123',
  },
  {
    path: 'shaders/bark.glsl',
    data: '// bark fragment shader\nvoid main() { gl_FragColor = vec4(0.5, 0.3, 0.1, 1.0); }',
    hash: 'def456',
  },
  {
    path: 'palettes/forest.json',
    data: '{"primary":"#2d5a27","secondary":"#8bc34a","accent":"#4caf50"}',
    hash: 'ghi789',
  },
  { path: 'topology.json', data: '{"nodes":50,"edges":120,"hotspots":15}', hash: 'jkl012' },
  { path: 'meshes/amanita.mesh', data: '{"vertices":2048,"faces":4096,"format":"halfedge"}', hash: 'mno345' },
];

export function CacheActionToolbar({
  cache,
  onRefresh,
}: {
  cache: InstanceType<OperatusMod['CacheManager']>;
  onRefresh: () => Promise<void>;
}) {
  const handleClearAll = async () => {
    await cache.clear();
    await onRefresh();
  };

  const handleEvict1h = async () => {
    await cache.evictOlderThan(60 * 60 * 1000);
    await onRefresh();
  };

  const handleEvict24h = async () => {
    await cache.evictOlderThan(24 * 60 * 60 * 1000);
    await onRefresh();
  };

  const handleSeedDemo = async () => {
    for (const entry of DEMO_ENTRIES) {
      await cache.set(entry.path, entry.data, entry.hash);
    }
    await onRefresh();
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <button onClick={handleSeedDemo} style={{ ...btnStyle, background: '#1e3a5f', borderColor: '#3b82f6' }}>
        Seed Demo Data
      </button>
      <button onClick={handleEvict1h} style={btnStyle}>
        Evict &gt;1h
      </button>
      <button onClick={handleEvict24h} style={btnStyle}>
        Evict &gt;24h
      </button>
      <button onClick={handleClearAll} style={{ ...btnStyle, borderColor: '#4a2020', color: '#ef4444' }}>
        Clear All
      </button>
      <button onClick={() => onRefresh()} style={btnStyle}>
        Refresh
      </button>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '0.4rem 0.75rem',
  background: '#222',
  border: '1px solid #444',
  borderRadius: '4px',
  color: '#ededed',
  fontSize: '0.8rem',
  cursor: 'pointer',
};
