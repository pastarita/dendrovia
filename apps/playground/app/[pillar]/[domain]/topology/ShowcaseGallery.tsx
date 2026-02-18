'use client';

import { useState } from 'react';
import { FIXTURES, type ShowcaseFixture } from './fixtures';
import { ShowcaseViewer } from './ShowcaseViewer';

function FixtureCard({
  fixture,
  onOpen,
}: {
  fixture: ShowcaseFixture;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '1.25rem',
        background: '#111',
        border: '1px solid #333',
        borderRadius: '8px',
        cursor: 'pointer',
        color: '#ededed',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--pillar-accent)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#333'; }}
    >
      {/* Color swatch strip */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '0.75rem',
      }}>
        {[fixture.palette.primary, fixture.palette.secondary, fixture.palette.accent, fixture.palette.glow].map((color, i) => (
          <div
            key={i}
            style={{
              width: 24,
              height: 8,
              borderRadius: '2px',
              background: color,
            }}
          />
        ))}
      </div>

      <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.35rem' }}>
        {fixture.name}
      </div>
      <div style={{ fontSize: '0.8rem', opacity: 0.5, lineHeight: 1.5, marginBottom: '0.75rem' }}>
        {fixture.description}
      </div>

      {/* Metadata chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{
          padding: '0.2rem 0.5rem',
          background: '#1a1a2e',
          borderRadius: '4px',
          fontSize: '0.7rem',
          fontFamily: 'var(--font-geist-mono), monospace',
        }}>
          {fixture.fileCount} files
        </span>
        {fixture.hotspots.length > 0 && (
          <span style={{
            padding: '0.2rem 0.5rem',
            background: '#2e1a1a',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-geist-mono), monospace',
            color: '#ff8888',
          }}>
            {fixture.hotspots.length} hotspots
          </span>
        )}
        <span style={{
          padding: '0.2rem 0.5rem',
          background: '#1a2e1a',
          borderRadius: '4px',
          fontSize: '0.7rem',
          fontFamily: 'var(--font-geist-mono), monospace',
          color: '#88ff88',
        }}>
          {fixture.palette.mood}
        </span>
      </div>
    </button>
  );
}

export function ShowcaseGallery() {
  const [viewingId, setViewingId] = useState<string | null>(null);

  const viewingFixture = viewingId
    ? FIXTURES.find((f) => f.id === viewingId) ?? null
    : null;

  if (viewingFixture) {
    return (
      <ShowcaseViewer
        fixture={viewingFixture}
        onClose={() => setViewingId(null)}
      />
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '1rem',
    }}>
      {FIXTURES.map((fixture) => (
        <FixtureCard
          key={fixture.id}
          fixture={fixture}
          onOpen={() => setViewingId(fixture.id)}
        />
      ))}
    </div>
  );
}
