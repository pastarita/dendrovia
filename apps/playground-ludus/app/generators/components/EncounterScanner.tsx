'use client';

import { useState, useMemo } from 'react';
import { scanAllEncounters, getEncounterDensity, createRngState } from '@dendrovia/ludus';
import type { ParsedFile, ParsedCommit, Hotspot } from '@dendrovia/shared';

const MOCK_FILES: ParsedFile[] = [
  { path: 'src/legacy/old-parser.ts', language: 'typescript', complexity: 28, lines: 450, functions: 15, classes: 3 },
  { path: 'src/core/engine.ts', language: 'typescript', complexity: 22, lines: 380, functions: 12, classes: 2 },
  { path: 'src/utils/helpers.ts', language: 'typescript', complexity: 18, lines: 200, functions: 20, classes: 0 },
  { path: 'src/combat/spells.ts', language: 'typescript', complexity: 12, lines: 150, functions: 8, classes: 1 },
  { path: 'src/state/store.ts', language: 'typescript', complexity: 8, lines: 90, functions: 5, classes: 0 },
  { path: 'src/parser/ast.ts', language: 'typescript', complexity: 15, lines: 220, functions: 10, classes: 2 },
];

const MOCK_COMMITS: ParsedCommit[] = [
  {
    hash: 'a1b2c3d4e5f6789012345678901234567890abcd',
    message: 'fix(parser): resolve null pointer in AST traversal',
    author: 'dev@example.com',
    date: '2024-06-15T10:30:00Z',
    insertions: 45,
    deletions: 12,
    filesChanged: ['src/parser/ast.ts', 'src/parser/visitor.ts'],
    isBugFix: true,
    isFeature: false,
    isMerge: false,
  },
  {
    hash: 'b2c3d4e5f6789012345678901234567890abcde1',
    message: 'fix(memory): patch memory leak in event listener cleanup',
    author: 'dev@example.com',
    date: '2024-06-14T14:20:00Z',
    insertions: 120,
    deletions: 30,
    filesChanged: ['src/core/engine.ts', 'src/events/listener.ts'],
    isBugFix: true,
    isFeature: false,
    isMerge: false,
  },
  {
    hash: 'd4e5f6789012345678901234567890abcde12345',
    message: 'fix(race): fix race condition in async state update',
    author: 'dev@example.com',
    date: '2024-06-12T16:45:00Z',
    insertions: 30,
    deletions: 8,
    filesChanged: ['src/state/store.ts'],
    isBugFix: true,
    isFeature: false,
    isMerge: false,
  },
];

const MOCK_HOTSPOTS: Hotspot[] = [
  { path: 'src/legacy/old-parser.ts', churnRate: 45, complexity: 28, riskScore: 8.5 },
  { path: 'src/core/engine.ts', churnRate: 30, complexity: 22, riskScore: 7.2 },
];

const TYPE_COLORS: Record<string, string> = {
  boss: '#EF4444',
  miniboss: '#F97316',
  bug: '#22C55E',
};

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#EF4444',
  water: '#3B82F6',
  earth: '#A16207',
  air: '#06B6D4',
  none: '#6B7280',
};

export default function EncounterScanner() {
  const [scanned, setScanned] = useState(false);

  const results = useMemo(() => {
    if (!scanned) return null;
    const rng = createRngState(42);
    return scanAllEncounters(MOCK_FILES, MOCK_COMMITS, MOCK_HOTSPOTS, rng);
  }, [scanned]);

  const density = useMemo(
    () => getEncounterDensity(MOCK_FILES, MOCK_COMMITS, MOCK_HOTSPOTS),
    [],
  );

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
        <button
          onClick={() => setScanned(true)}
          style={{
            padding: '0.4rem 1rem',
            borderRadius: '4px',
            border: '1px solid var(--pillar-accent)',
            background: scanned ? '#222' : 'transparent',
            color: 'var(--pillar-accent)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          Scan for Encounters
        </button>
        <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-geist-mono)', opacity: 0.6 }}>
          Density: {(density * 100).toFixed(0)}% ({MOCK_FILES.length} files scanned)
        </div>
      </div>

      {/* Results */}
      {results && results.encounters.length > 0 && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {results.encounters.map((entry, i) => (
            <div
              key={i}
              style={{
                padding: '1rem',
                border: '1px solid #222',
                borderRadius: '8px',
                background: '#111',
                borderLeft: `3px solid ${TYPE_COLORS[entry.encounter.type] ?? '#555'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{entry.encounter.monster.name}</div>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  background: TYPE_COLORS[entry.encounter.type] ?? '#333',
                  color: '#fff',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}>
                  {entry.encounter.type}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-geist-mono)', opacity: 0.5, marginBottom: '0.35rem' }}>
                {entry.file.path}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontFamily: 'var(--font-geist-mono)' }}>
                <span style={{ color: ELEMENT_COLORS[entry.encounter.monster.element] }}>{entry.encounter.monster.element}</span>
                <span>HP {entry.encounter.monster.stats.maxHealth}</span>
                <span>ATK {entry.encounter.monster.stats.attack}</span>
                <span>DEF {entry.encounter.monster.stats.defense}</span>
                <span style={{ color: '#22C55E' }}>XP {entry.encounter.monster.xpReward}</span>
              </div>
              {entry.encounter.triggerCondition.complexity && (
                <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.25rem' }}>
                  Trigger: complexity &gt; {entry.encounter.triggerCondition.complexity}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!scanned && (
        <div style={{ padding: '2rem', border: '1px dashed #333', borderRadius: '8px', textAlign: 'center', opacity: 0.4 }}>
          Click "Scan" to analyze mock codebase files for encounter triggers
        </div>
      )}
    </div>
  );
}
