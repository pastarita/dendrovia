'use client';

/**
 * /demo — Two demo modes available in this iteration:
 *
 * 1. Toy Scene (DemoScene) — 6 static dendrite cylinders, self-contained
 * 2. Real Engine (DendroviaQuest) — full ARCHITECTUS + OCULUS + LUDUS
 *
 * This iteration defaulted to the toy scene. The real engine was wired
 * late but exposed the integration gaps documented in RETROSPECTIVE.md.
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';

const DemoScene = dynamic(
  () => import('./DemoScene').then(m => ({ default: m.DemoScene })),
  {
    ssr: false,
    loading: () => (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Courier New', monospace",
        color: '#6dffaa',
        fontSize: '0.9rem',
        letterSpacing: '0.15em',
      }}>
        INITIALIZING DENDRITE RENDERER...
      </div>
    ),
  }
);

export default function DemoPage() {
  return (
    <>
      <DemoScene />
      <Link
        href="/"
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 50,
          padding: '6px 14px',
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid #4d9a6c',
          borderRadius: '6px',
          color: '#6dffaa',
          fontSize: '0.75rem',
          fontFamily: "'Courier New', monospace",
          backdropFilter: 'blur(10px)',
          letterSpacing: '0.1em',
        }}
      >
        {'\u{2190}'} HOME
      </Link>
    </>
  );
}
