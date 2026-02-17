import Link from 'next/link';
import SpatialDocsClient from './SpatialDocsClient';

export default function SpatialDocsPage(): React.JSX.Element {
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
        <span>📐</span> Spatial Docs — API Reference
      </h1>
      <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>Event system documentation and LUDUS module map.</p>
      <div style={{ marginTop: '1.5rem' }}>
        <SpatialDocsClient />
      </div>
    </div>
  );
}
