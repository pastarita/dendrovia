'use client';

/**
 * DENDROVIA — Narrative Landing Page
 *
 * Open-source showcase: vision, pipeline, "Enter the World" CTA,
 * pillar links, and GitHub call-to-action.
 */

import Link from 'next/link';

const PILLARS = [
  { name: 'CHRONOS',     icon: '\u{1F4DC}', desc: 'Git history + AST parsing',        color: '#c77b3f', stat: '9 modules' },
  { name: 'IMAGINARIUM', icon: '\u{1F3A8}', desc: 'Procedural art + mycology',         color: '#A855F7', stat: '181 tests' },
  { name: 'ARCHITECTUS', icon: '\u{1F3DB}', desc: '3D rendering engine (R3F)',          color: '#3B82F6', stat: 'WebGPU' },
  { name: 'LUDUS',       icon: '\u{1F3AE}', desc: 'Turn-based combat engine',          color: '#EF4444', stat: '251 tests' },
  { name: 'OCULUS',      icon: '\u{1F441}', desc: 'HUD + UI component library',        color: '#22C55E', stat: '29 events' },
  { name: 'OPERATUS',    icon: '\u{1F4BE}', desc: 'Infrastructure + persistence',      color: '#6B7280', stat: 'OPFS' },
];

const PIPELINE_STEPS = [
  { label: 'PARSE',    pillar: 'CHRONOS',     color: '#c77b3f', output: 'topology.json' },
  { label: 'DISTILL',  pillar: 'IMAGINARIUM', color: '#A855F7', output: 'shaders + palette' },
  { label: 'RENDER',   pillar: 'ARCHITECTUS', color: '#3B82F6', output: '3D world' },
];

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#ededed',
      fontFamily: "var(--font-geist-mono), 'Courier New', monospace",
    }}>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(77,154,108,0.15) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -60%)',
          pointerEvents: 'none',
        }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: '#ededed',
            marginBottom: '0.5rem',
          }}>
            DENDROVIA
          </h1>

          <p style={{
            fontSize: 'clamp(0.75rem, 2vw, 1rem)',
            opacity: 0.5,
            letterSpacing: '0.1em',
            marginBottom: '2.5rem',
          }}>
            Autogamification of Codebase Archaeologization
          </p>

          <p style={{
            fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)',
            maxWidth: 540,
            lineHeight: 1.7,
            opacity: 0.7,
            margin: '0 auto 3rem',
          }}>
            Transform any Git repository into an explorable 3D RPG world.
            Bugs become monsters. Commits become quests. Code becomes terrain.
          </p>

          {/* CTA */}
          <Link href="/demo" style={{
            display: 'inline-block',
            padding: '14px 40px',
            border: '2px solid #6dffaa',
            borderRadius: '8px',
            color: '#6dffaa',
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            transition: 'all 0.25s',
            cursor: 'pointer',
            background: 'rgba(109, 255, 170, 0.05)',
          }}>
            Enter the World
          </Link>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          opacity: 0.3,
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          {'\u{2193}'} SCROLL {'\u{2193}'}
        </div>
      </section>

      {/* ── Pipeline ──────────────────────────────────────── */}
      <section style={{
        padding: '5rem 2rem',
        maxWidth: 800,
        margin: '0 auto',
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '0.85rem',
          letterSpacing: '0.2em',
          opacity: 0.4,
          marginBottom: '3rem',
          textTransform: 'uppercase',
        }}>
          The Pipeline
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}>
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                padding: '1rem 1.5rem',
                border: `1px solid ${step.color}`,
                borderRadius: '8px',
                textAlign: 'center',
                background: `${step.color}08`,
                minWidth: 140,
              }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.25rem' }}>
                  {step.pillar}
                </div>
                <div style={{ fontWeight: 700, color: step.color, fontSize: '1.1rem' }}>
                  {step.label}
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.25rem' }}>
                  {step.output}
                </div>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <span style={{ color: '#4d9a6c', fontSize: '1.2rem', opacity: 0.6 }}>{'\u{2192}'}</span>
              )}
            </div>
          ))}
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '0.85rem',
          opacity: 0.5,
          lineHeight: 1.8,
        }}>
          CHRONOS parses your repository into a topology graph.
          IMAGINARIUM distills it into shaders, palettes, and procedural art.
          ARCHITECTUS renders a navigable 3D world.
        </p>
      </section>

      {/* ── Six Pillars ───────────────────────────────────── */}
      <section style={{
        padding: '4rem 2rem 5rem',
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '0.85rem',
          letterSpacing: '0.2em',
          opacity: 0.4,
          marginBottom: '2.5rem',
          textTransform: 'uppercase',
        }}>
          Six Pillars
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}>
          {PILLARS.map((p) => (
            <div
              key={p.name}
              style={{
                padding: '1.25rem',
                border: '1px solid #1a1a1a',
                borderRadius: '8px',
                transition: 'border-color 0.2s, background 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = p.color;
                e.currentTarget.style.background = `${p.color}08`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1a1a1a';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.3, color: p.color }}>{p.stat}</span>
              </div>
              <div style={{ fontWeight: 600, color: p.color, marginBottom: '0.25rem' }}>{p.name}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── What Happens In-World ─────────────────────────── */}
      <section style={{
        padding: '4rem 2rem',
        maxWidth: 700,
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: '0.85rem',
          letterSpacing: '0.2em',
          opacity: 0.4,
          marginBottom: '2rem',
          textTransform: 'uppercase',
        }}>
          What Happens In-World
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          textAlign: 'left',
        }}>
          {[
            { label: 'Files', become: 'Dendrite branches' },
            { label: 'Bugs', become: 'Monsters to battle' },
            { label: 'Commits', become: 'Quests to complete' },
            { label: 'Complexity', become: 'Terrain height' },
            { label: 'Contributors', become: 'Oracle NPCs' },
            { label: 'Dependencies', become: 'Mycelial networks' },
          ].map((row) => (
            <div key={row.label} style={{
              padding: '0.75rem 1rem',
              borderLeft: '2px solid #4d9a6c',
              fontSize: '0.85rem',
            }}>
              <span style={{ opacity: 0.5 }}>{row.label}</span>
              <span style={{ opacity: 0.3 }}> {'\u{2192}'} </span>
              <span style={{ color: '#6dffaa' }}>{row.become}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Repeat ────────────────────────────────────── */}
      <section style={{
        padding: '4rem 2rem 5rem',
        textAlign: 'center',
      }}>
        <Link href="/demo" style={{
          display: 'inline-block',
          padding: '14px 40px',
          border: '2px solid #6dffaa',
          borderRadius: '8px',
          color: '#6dffaa',
          fontSize: '1rem',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          background: 'rgba(109, 255, 170, 0.05)',
        }}>
          Enter the World
        </Link>

        <p style={{
          marginTop: '1.5rem',
          fontSize: '0.8rem',
          opacity: 0.3,
        }}>
          Open Source · MIT License
        </p>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer style={{
        padding: '2rem',
        borderTop: '1px solid #111',
        textAlign: 'center',
        fontSize: '0.7rem',
        opacity: 0.25,
      }}>
        Six-Pillar Architecture · SDF + Hex Hybrid · Built with Bun + TurboRepo
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </main>
  );
}
