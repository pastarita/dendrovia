'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const ComponentGallery = dynamic(() => import('./ComponentGallery').then((m) => m.ComponentGallery), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 'calc(100vh - 10rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.4,
      }}
    >
      Loading 3D engine...
    </div>
  ),
});

export default function ZoosPage() {
  return (
    <div>
      <Link href="/" style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        &larr; ARCHITECTUS Dashboard
      </Link>
      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          marginTop: '0.75rem',
          marginBottom: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        Component Zoo
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '1rem', fontSize: '0.85rem' }}>
        Catalog mode &mdash; Browse every ARCHITECTUS component with live 3D preview, props, and code snippets
      </p>
      <ComponentGallery />
    </div>
  );
}
