'use client';

/**
 * WorldLibrary — Interactive gallery of all analyzed codebase worlds.
 *
 * Sort controls + responsive card grid using the existing WorldCard
 * component (OrnateFrame variant).
 */

import { useState, useMemo, useCallback } from 'react';
import { WorldCard } from '../components/WorldCard';
import type { WorldEntry } from './page';

type SortField = 'name' | 'magnitude' | 'status' | 'fileCount' | 'commitCount';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'magnitude', label: 'Magnitude' },
  { field: 'status', label: 'Status' },
  { field: 'fileCount', label: 'Files' },
  { field: 'commitCount', label: 'Commits' },
];

const STATUS_ORDER: Record<string, number> = {
  playable: 0,
  analyzing: 1,
  pending: 2,
};

function compareWorlds(a: WorldEntry, b: WorldEntry, sort: SortState): number {
  let cmp = 0;

  switch (sort.field) {
    case 'name':
      cmp = a.name.localeCompare(b.name);
      break;
    case 'magnitude':
      cmp = a.magnitude.score - b.magnitude.score;
      break;
    case 'status':
      cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      break;
    case 'fileCount':
      cmp = a.stats.fileCount - b.stats.fileCount;
      break;
    case 'commitCount':
      cmp = a.stats.commitCount - b.stats.commitCount;
      break;
  }

  return sort.direction === 'desc' ? -cmp : cmp;
}

export function WorldLibrary({ worlds }: { worlds: WorldEntry[] }) {
  const [sort, setSort] = useState<SortState>({ field: 'name', direction: 'asc' });
  const [animKey, setAnimKey] = useState(0);

  const sorted = useMemo(
    () => [...worlds].sort((a, b) => compareWorlds(a, b, sort)),
    [worlds, sort],
  );

  const handleSort = useCallback((field: SortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setAnimKey((k) => k + 1);
  }, []);

  return (
    <div>
      {/* Header */}
      <header style={{ marginBottom: '2rem', marginTop: '1rem' }}>
        <a
          href="/"
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-geist-mono), monospace',
            opacity: 0.4,
            display: 'inline-block',
            marginBottom: '1rem',
            transition: 'opacity 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; }}
        >
          &larr; Home
        </a>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-geist-mono), monospace',
            margin: 0,
            color: 'var(--foreground, #ededed)',
          }}
        >
          World Library
        </h1>
        <p
          style={{
            opacity: 0.5,
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-geist-sans), sans-serif',
          }}
        >
          Browse all analyzed codebase worlds
        </p>
      </header>

      {/* Sort controls */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            opacity: 0.35,
            fontFamily: 'var(--font-geist-mono), monospace',
            alignSelf: 'center',
            marginRight: '4px',
          }}
        >
          Sort
        </span>
        {SORT_OPTIONS.map(({ field, label }) => {
          const isActive = sort.field === field;
          return (
            <button
              key={field}
              onClick={() => handleSort(field)}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                border: `1px solid ${isActive ? 'var(--oculus-amber, #c77b3f)' : 'rgba(255,255,255,0.1)'}`,
                background: isActive ? 'rgba(199,123,63,0.15)' : 'rgba(255,255,255,0.03)',
                color: isActive ? 'var(--oculus-amber, #c77b3f)' : 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.72rem',
                cursor: 'pointer',
                transition: 'all 150ms',
                letterSpacing: '0.03em',
              }}
            >
              {label}
              {isActive && (
                <span style={{ marginLeft: '4px', fontSize: '0.65rem' }}>
                  {sort.direction === 'asc' ? '\u2191' : '\u2193'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      <div
        key={animKey}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px',
        }}
      >
        {sorted.map((world, i) => (
          <WorldCard
            key={world.slug}
            slug={world.slug}
            name={world.name}
            owner={world.owner}
            repo={world.repo}
            description={world.description}
            status={world.status}
            stats={world.stats}
            magnitude={world.magnitude}
            tincture={world.tincture}
            framePillar={world.framePillar}
            index={i}
          />
        ))}
      </div>

      {worlds.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            opacity: 0.4,
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.85rem',
          }}
        >
          No worlds analyzed yet.
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: '3rem',
          paddingBottom: '2rem',
          opacity: 0.2,
          fontSize: '0.65rem',
          textAlign: 'center',
          fontFamily: 'var(--font-geist-mono), monospace',
        }}
      >
        {worlds.length} world{worlds.length !== 1 ? 's' : ''} indexed
      </footer>
    </div>
  );
}
