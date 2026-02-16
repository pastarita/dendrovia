'use client';

/**
 * PillarLauncher — Grid of pillar dev server cards.
 * Extracted from the original page.tsx for reuse below the world cards.
 */

const MAIN_APP = {
  name: 'ARCHITECTUS',
  port: 3011,
  icon: '🏛️',
  desc: 'The Renderer — Main 3D Experience',
  color: '#3B82F6',
};

const PILLAR_SERVERS = [
  { name: 'CHRONOS',     port: 3012, icon: '📜', desc: 'Git History + AST Parsing',       color: '#c77b3f' },
  { name: 'IMAGINARIUM', port: 3013, icon: '🎨', desc: 'Procedural Art Generation',       color: '#A855F7' },
  { name: 'LUDUS',       port: 3014, icon: '🎮', desc: 'Game Mechanics + Rules',           color: '#EF4444' },
  { name: 'OCULUS',      port: 3015, icon: '👁️', desc: 'UI + Navigation',                 color: '#22C55E' },
  { name: 'OPERATUS',    port: 3016, icon: '💾', desc: 'Infrastructure + Persistence',     color: '#6B7280' },
];

export function PillarLauncher() {
  return (
    <div style={{ width: '100%' }}>
      {/* Main app card */}
      <a
        href={`http://localhost:${MAIN_APP.port}`}
        style={{
          display: 'block',
          padding: '1.25rem',
          border: `2px solid ${MAIN_APP.color}44`,
          borderRadius: '10px',
          marginBottom: '1rem',
          background: `${MAIN_APP.color}08`,
          transition: 'all 200ms ease-out',
          textAlign: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${MAIN_APP.color}14`;
          e.currentTarget.style.borderColor = MAIN_APP.color;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${MAIN_APP.color}08`;
          e.currentTarget.style.borderColor = `${MAIN_APP.color}44`;
        }}
      >
        <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{MAIN_APP.icon}</div>
        <div style={{ fontWeight: 600, color: MAIN_APP.color, fontSize: '0.9rem' }}>
          {MAIN_APP.name}
        </div>
        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.15rem' }}>
          {MAIN_APP.desc}
        </div>
        <div
          style={{
            marginTop: '0.5rem',
            fontSize: '0.7rem',
            opacity: 0.3,
            fontFamily: 'var(--font-geist-mono), monospace',
          }}
        >
          :{MAIN_APP.port}
        </div>
      </a>

      {/* Pillar grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {PILLAR_SERVERS.map((p) => (
          <a
            key={p.port}
            href={`http://localhost:${p.port}`}
            style={{
              display: 'block',
              padding: '1rem',
              border: '1px solid #222',
              borderRadius: '8px',
              transition: 'border-color 200ms ease-out',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = p.color)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#222')}
          >
            <div style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{p.icon}</div>
            <div style={{ fontWeight: 600, color: p.color, fontSize: '0.85rem' }}>{p.name}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.15rem' }}>{p.desc}</div>
            <div
              style={{
                fontSize: '0.65rem',
                opacity: 0.3,
                marginTop: '0.4rem',
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
