'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameStateViewer } from './components/GameStateViewer';
import { ImportExportPanel } from './components/ImportExportPanel';
import { MigrationTester } from './components/MigrationTester';
import { SaveSlotList } from './components/SaveSlotList';

type OperatusMod = typeof import('@dendrovia/operatus');

export function PersistenceSandboxClient() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modRef = useRef<OperatusMod | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    import('@dendrovia/operatus')
      .then(async (mod) => {
        if (cancelled) return;
        modRef.current = mod;
        await mod.waitForHydration();
        if (!cancelled) setReady(true);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <div style={{ marginTop: '2rem', color: '#ef4444' }}>Error: {error}</div>;
  }

  if (!ready || !modRef.current) {
    return <div style={{ marginTop: '2rem', opacity: 0.5 }}>Initializing OPERATUS persistence...</div>;
  }

  const mod = modRef.current;

  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* State modifier panel */}
      <StateModifier mod={mod} onModify={refresh} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <SaveSlotList mod={mod} refreshKey={refreshKey} />
        <GameStateViewer mod={mod} refreshKey={refreshKey} />
      </div>

      <ImportExportPanel mod={mod} onImport={refresh} />
      <MigrationTester mod={mod} onMigrate={refresh} />
    </div>
  );
}

function StateModifier({ mod, onModify }: { mod: OperatusMod; onModify: () => void }) {
  const [level, setLevel] = useState(1);
  const [name, setName] = useState('');
  const [flagKey, setFlagKey] = useState('');

  const store = mod.useGameStore;

  useEffect(() => {
    const state = store.getState();
    setLevel(state.character.level);
    setName(state.character.name);
  }, [store]);

  return (
    <div style={{ padding: '1rem 1.25rem', border: '1px solid #222', borderRadius: '8px' }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>State Modifier</h3>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: '0.7rem', opacity: 0.5, display: 'block' }}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', opacity: 0.5, display: 'block' }}>Level</label>
          <input
            type="number"
            min={1}
            max={99}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            style={{ ...inputStyle, width: '70px' }}
          />
        </div>
        <button
          onClick={() => {
            store.getState().setCharacter({ name, level });
            onModify();
          }}
          style={btnStyle}
        >
          Apply
        </button>
        <button
          onClick={() => {
            store.getState().gainExperience(100);
            onModify();
          }}
          style={btnStyle}
        >
          +100 XP
        </button>
        <button
          onClick={() => {
            store.getState().addItem({
              id: `item-${Date.now()}`,
              name: 'Debug Potion',
              description: 'A debug potion for testing',
              type: 'consumable',
              effect: { type: 'heal-hp', value: 50 },
            });
            onModify();
          }}
          style={btnStyle}
        >
          + Item
        </button>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.7rem', opacity: 0.5, display: 'block' }}>Flag key</label>
            <input
              value={flagKey}
              onChange={(e) => setFlagKey(e.target.value)}
              placeholder="e.g. tutorial_done"
              style={{ ...inputStyle, width: '140px' }}
            />
          </div>
          <button
            onClick={() => {
              if (flagKey.trim()) {
                store.getState().setGameFlag(flagKey.trim(), true);
                setFlagKey('');
                onModify();
              }
            }}
            style={btnStyle}
          >
            Set Flag
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#111',
  border: '1px solid #333',
  borderRadius: '4px',
  padding: '0.4rem 0.6rem',
  color: '#ededed',
  fontSize: '0.85rem',
  fontFamily: 'var(--font-geist-mono)',
};

const btnStyle: React.CSSProperties = {
  padding: '0.4rem 0.75rem',
  background: '#222',
  border: '1px solid #444',
  borderRadius: '4px',
  color: '#ededed',
  fontSize: '0.8rem',
  cursor: 'pointer',
};
