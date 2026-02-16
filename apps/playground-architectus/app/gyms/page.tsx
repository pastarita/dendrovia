'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

const LSystemSandbox = dynamic(() => import('./LSystemSandbox').then(m => m.LSystemSandbox), {
  ssr: false,
  loading: () => (
    <div style={{ height: 'calc(100vh - 10rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
      Loading 3D engine...
    </div>
  ),
});

export default function GymsPage() {
  return (
    <div>
      <Link href="/" style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        &larr; ARCHITECTUS Dashboard
      </Link>
      <h1 style={{
        fontSize: '1.75rem',
        fontWeight: 700,
        marginTop: '0.75rem',
        marginBottom: '0.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        L-System Gym
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '1rem', fontSize: '0.85rem' }}>
        Interactive sandbox &mdash; Edit L-system parameters and watch dendrites grow in real-time
      </p>
      <LSystemSandbox />
    </div>
  );
}
