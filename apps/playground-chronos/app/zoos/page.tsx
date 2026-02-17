import Link from 'next/link';
import { loadTopologyData } from '../../lib/load-data';

const SECTIONS = [
  {
    name: 'Overview',
    href: '/zoos/overview',
    icon: '📊',
    desc: 'Repository metadata, language distribution, contributor summary',
  },
  {
    name: 'Files',
    href: '/zoos/files',
    icon: '📂',
    desc: 'Sortable file catalog with complexity badges and language tags',
  },
  { name: 'Commits', href: '/zoos/commits', icon: '📝', desc: 'Commit timeline with type, scope, confidence badges' },
  { name: 'Hotspots', href: '/zoos/hotspots', icon: '🔥', desc: 'Risk-ranked files by churn x complexity' },
  { name: 'Contributors', href: '/zoos/contributors', icon: '🧙', desc: 'NPC archetype cards with personality facets' },
  { name: 'Couplings', href: '/zoos/couplings', icon: '🔗', desc: 'Temporal coupling pairs ranked by strength' },
  { name: 'Complexity', href: '/zoos/complexity', icon: '🧬', desc: 'Per-function complexity drill-down by file' },
  {
    name: 'Contract',
    href: '/zoos/contract',
    icon: '✅',
    desc: 'Validate enriched contract fields exist and are well-formed',
  },
];

export default async function ZoosPage() {
  const data = await loadTopologyData();

  const counts: Record<string, number> = {
    Overview: 1,
    Files: data.topology?.files.length ?? 0,
    Commits: data.commits?.length ?? 0,
    Hotspots: data.hotspots?.hotspots.length ?? 0,
    Contributors: data.contributors?.contributors.length ?? 0,
    Couplings: data.hotspots?.temporalCouplings.length ?? 0,
    Complexity: data.complexity?.files.length ?? 0,
    Contract: 0,
  };

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
        <span>🦁</span> Zoos
      </h1>
      <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>Catalog mode (Z modality) — Parsed artifact catalogs</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
        }}
      >
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            style={{
              display: 'block',
              padding: '1.25rem',
              border: '1px solid #333',
              borderRadius: '8px',
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
              <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{s.name}</span>
              {(counts[s.name] ?? 0) > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.75rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '10px',
                    background: '#c77b3f22',
                    color: '#c77b3f',
                    fontWeight: 600,
                  }}
                >
                  {counts[s.name]}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>{s.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
