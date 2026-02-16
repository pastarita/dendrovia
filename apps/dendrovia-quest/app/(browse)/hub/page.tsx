'use client';

/**
 * DENDROVIA QUEST — Hub & Launcher
 *
 * Central landing page for the Dendrovia monorepo workspace.
 * All pillar playgrounds serve as GMZ-doc servers.
 * Dev-only: links target localhost ports.
 */

function devUrl(port: number, path = ''): string {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return path || '/';
  }
  return `http://localhost:${port}${path}`;
}

const PILLAR_SERVERS = [
  { name: 'ARCHITECTUS', port: 3011, icon: '\u{1F3DB}\uFE0F', desc: 'The Renderer \u2014 3D Engine',           color: '#3B82F6' },
  { name: 'CHRONOS',     port: 3012, icon: '\u{1F4DC}', desc: 'Git History + AST Parsing',           color: '#c77b3f' },
  { name: 'IMAGINARIUM', port: 3013, icon: '\u{1F3A8}', desc: 'Procedural Art Generation',           color: '#A855F7' },
  { name: 'LUDUS',       port: 3014, icon: '\u{1F3AE}', desc: 'Game Mechanics + Rules',               color: '#EF4444' },
  { name: 'OCULUS',      port: 3015, icon: '\u{1F441}\uFE0F', desc: 'UI + Navigation',                     color: '#22C55E' },
  { name: 'OPERATUS',    port: 3016, icon: '\u{1F4BE}', desc: 'Infrastructure + Persistence',         color: '#6B7280' },
];

export default function HubPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'var(--font-geist-sans), sans-serif',
        color: 'var(--foreground, #ededed)',
        padding: '1rem 0',
      }}
    >
      {/* Section title */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
        <h1
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-geist-mono), monospace',
          }}
        >
          Pillar Playgrounds
        </h1>
        <p style={{ opacity: 0.4, marginTop: '0.25rem', fontSize: '0.82rem' }}>
          Autogamification of Codebase Archaeologization
        </p>
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
              border: '1px solid rgba(245, 169, 127, 0.15)',
              borderRadius: '10px',
              background: 'rgba(20, 20, 20, 0.4)',
              backdropFilter: 'blur(8px)',
              transition: 'border-color 0.2s',
              textDecoration: 'none',
              color: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = p.color)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(245, 169, 127, 0.15)')}
          >
            <div style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>{p.icon}</div>
            <div style={{ fontWeight: 600, color: p.color }}>{p.name}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.2rem' }}>{p.desc}</div>
            <div
              style={{
                fontSize: '0.65rem',
                opacity: 0.3,
                marginTop: '0.5rem',
                fontFamily: 'var(--font-geist-mono), monospace',
              }}
            >
              :{p.port}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
