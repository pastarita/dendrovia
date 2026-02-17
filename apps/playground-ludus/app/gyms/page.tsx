import Link from 'next/link';
import GymClient from './GymClient';

const PAGES = [
  {
    name: 'Dendrite Observatory',
    href: '/gyms/dendrite',
    desc: 'Interactive 2D flow visualization of the LUDUS pipeline',
  },
];

export default function GymsPage(): React.JSX.Element {
  return (
    <div>
      <Link href="/" style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        &larr; LUDUS Dashboard
      </Link>
      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span>🏋️</span> Gyms — Combat Sandbox
      </h1>
      <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>
        Interactive sandbox (G modality) — Pick a class, pick an enemy, fight.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            style={{
              display: 'block',
              padding: '1.25rem',
              border: '1px solid #222',
              borderRadius: '8px',
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{p.name}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>{p.desc}</div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <GymClient />
      </div>
    </div>
  );
}
