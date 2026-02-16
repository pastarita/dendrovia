'use client';

/**
 * DENDROVIA QUEST — Hub & Launcher
 *
 * Central landing page for the Dendrovia monorepo workspace.
 * The main 3D experience lives at / (root).
 * All other pillar playgrounds serve as GMZ-doc servers.
 * Dev-only: links target localhost ports.
 */

function devUrl(port: number, path = ''): string {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return path || '/';
  }
  return `http://localhost:${port}${path}`;
}

const MAIN_APP = {
  name: 'QUEST',
  port: 3010,
  icon: '🌳',
  desc: 'The Game — 3D World Experience',
  color: '#00ffcc',
};

const PILLAR_SERVERS = [
  { name: 'ARCHITECTUS', port: 3011, icon: '🏛️', desc: 'The Renderer — 3D Engine',           color: '#3B82F6' },
  { name: 'CHRONOS',     port: 3012, icon: '📜', desc: 'Git History + AST Parsing',           color: '#c77b3f' },
  { name: 'IMAGINARIUM', port: 3013, icon: '🎨', desc: 'Procedural Art Generation',           color: '#A855F7' },
  { name: 'LUDUS',       port: 3014, icon: '🎮', desc: 'Game Mechanics + Rules',               color: '#EF4444' },
  { name: 'OCULUS',      port: 3015, icon: '👁️', desc: 'UI + Navigation',                     color: '#22C55E' },
  { name: 'OPERATUS',    port: 3016, icon: '💾', desc: 'Infrastructure + Persistence',         color: '#6B7280' },
];

export default function HubPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ededed',
        fontFamily: "'Courier New', monospace",
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '0.15em' }}>
          DENDROVIA
        </h1>
        <p style={{ opacity: 0.5, marginTop: '0.5rem', fontSize: '0.9rem' }}>
          Autogamification of Codebase Archaeologization
        </p>
      </div>

      {/* Main App Card */}
      <a
        href="/"
        style={{
          display: 'block',
          width: '100%',
          maxWidth: '600px',
          padding: '2rem',
          border: `2px solid ${MAIN_APP.color}`,
          borderRadius: '12px',
          marginBottom: '2.5rem',
          background: 'rgba(0, 255, 204, 0.05)',
          transition: 'all 0.2s',
          textAlign: 'center',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 255, 204, 0.12)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 255, 204, 0.05)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{MAIN_APP.icon}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: MAIN_APP.color }}>
          {MAIN_APP.name}
        </div>
        <div style={{ opacity: 0.6, marginTop: '0.25rem' }}>{MAIN_APP.desc}</div>
        <div
          style={{
            marginTop: '1rem',
            fontSize: '0.8rem',
            opacity: 0.4,
            fontFamily: 'monospace',
          }}
        >
          :{MAIN_APP.port}
        </div>
      </a>

      {/* Divider */}
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          borderTop: '1px solid #222',
          marginBottom: '2rem',
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '-0.7em',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0a0a0a',
            padding: '0 1rem',
            fontSize: '0.75rem',
            opacity: 0.4,
            whiteSpace: 'nowrap',
          }}
        >
          PILLAR PLAYGROUNDS
        </span>
      </div>

      {/* Pillar Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem',
          width: '100%',
          maxWidth: '600px',
        }}
      >
        {PILLAR_SERVERS.map((p) => (
          <a
            key={p.port}
            href={devUrl(p.port)}
            style={{
              display: 'block',
              padding: '1.25rem',
              border: '1px solid #222',
              borderRadius: '8px',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = p.color)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#222')}
          >
            <div style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>{p.icon}</div>
            <div style={{ fontWeight: 600, color: p.color }}>{p.name}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.2rem' }}>{p.desc}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.3, marginTop: '0.5rem' }}>
              :{p.port}
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '3rem', opacity: 0.25, fontSize: '0.7rem', textAlign: 'center' }}>
        Six-Pillar Architecture · SDF + Hex Hybrid
      </div>
    </main>
  );
}
