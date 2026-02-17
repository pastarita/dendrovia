import Link from 'next/link';

const PAGES = [
  {
    name: 'Primitives Gallery',
    href: '/zoos/primitives',
    desc: 'All 6 OCULUS primitives — filterable, sortable, with live prop inspector and variant galleries',
  },
  {
    name: 'View Components',
    href: '/zoos/views',
    desc: 'HUD, Minimap, QuestLog, BattleUI, CodeReader, MillerColumns with mock data',
  },
  {
    name: 'Compositions',
    href: '/zoos/compositions',
    desc: 'Full HUD layout with all corners populated, combat and exploration modes',
  },
  {
    name: 'Ornate Frames',
    href: '/zoos/frames',
    desc: 'Every OrnateFrame pillar \u00d7 variant with upstream data specimens from @dendrovia/shared',
  },
];

export default function ZoosPage() {
  return (
    <div>
      <Link href="/" style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        &larr; OCULUS Dashboard
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
      <p style={{ opacity: 0.5, marginTop: '0.5rem', marginBottom: '2rem' }}>
        Catalog mode (Z modality) — Every OCULUS component rendered in isolation
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
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
    </div>
  );
}
