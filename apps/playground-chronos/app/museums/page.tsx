import Link from 'next/link';

export default function MuseumsPage() {
  return (
    <div>
      <Link href="/" style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        &larr; CHRONOS Dashboard
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
        <span>🏛️</span> Museums
      </h1>
      <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>Exhibition mode (M modality) — Historical commit exhibitions</p>
      <div
        style={{
          marginTop: '2rem',
          padding: '2rem',
          border: '1px dashed #333',
          borderRadius: '8px',
          textAlign: 'center',
          opacity: 0.4,
        }}
      >
        Coming soon — CHRONOS museum exhibits
      </div>
    </div>
  );
}
