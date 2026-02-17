import Link from 'next/link';
import { loadTopologyData } from '../../../lib/load-data';
import { FilesTable } from './files-table';

export default async function FilesPage() {
  const data = await loadTopologyData();
  const files = data.topology?.files ?? [];

  return (
    <div>
      <Link href="/zoos" style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        &larr; Zoos
      </Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '1rem' }}>📂 Files</h1>
      <p style={{ opacity: 0.5, marginTop: '0.25rem', fontSize: '0.85rem' }}>
        {files.length} files parsed — sortable by complexity, LOC, language
      </p>

      <FilesTable files={files} />
    </div>
  );
}
