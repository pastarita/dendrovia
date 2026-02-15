'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

const ShowcaseGallery = dynamic(() => import('./ShowcaseGallery').then(m => m.ShowcaseGallery), {
  ssr: false,
  loading: () => (
    <div style={{ height: 'calc(100vh - 10rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
      Loading gallery...
    </div>
  ),
});

export default function MuseumsPage() {
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
        Topology Museum
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        Exhibition mode &mdash; Explore pre-built codebase topologies rendered as dendrites
      </p>
      <ShowcaseGallery />
    </div>
  );
}
