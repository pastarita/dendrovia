import Link from 'next/link';
import { ManifestCatalogClient } from './ManifestCatalogClient';

export default function ManifestPage() {
  return (
    <div>
      <Link href="/zoos" style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        &larr; Zoos
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
        <span>📋</span> Manifest Catalog
      </h1>
      <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>Browsable catalog of manifest.json entries</p>
      <ManifestCatalogClient />
    </div>
  );
}
