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

const PAGES = [
  { name: "Dendrite Observatory", href: "/gyms/dendrite", desc: "Interactive 2D flow visualization of the ARCHITECTUS pipeline" },
];

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            style={{
              display: "block",
              padding: "1.25rem",
              border: "1px solid #222",
              borderRadius: "8px",
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{p.name}</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.5 }}>{p.desc}</div>
          </Link>
        ))}
      </div>

      <LSystemSandbox />
    </div>
  );
}
