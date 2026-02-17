'use client';

import { useState } from 'react';
import ClassComparison from './components/ClassComparison';
import ItemRegistry from './components/ItemRegistry';
import MonsterBestiary from './components/MonsterBestiary';
import SpellCatalog from './components/SpellCatalog';
import StatusEffectReference from './components/StatusEffectReference';

const TABS = [
  { id: 'spells', label: 'Spells' },
  { id: 'monsters', label: 'Monsters' },
  { id: 'classes', label: 'Classes' },
  { id: 'effects', label: 'Effects' },
  { id: 'items', label: 'Items' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ZooClient(): React.JSX.Element {
  const [tab, setTab] = useState<TabId>('spells');

  return (
    <div>
      {/* Tab Nav */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #222',
          paddingBottom: '0.5rem',
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '4px 4px 0 0',
              border: 'none',
              background: tab === t.id ? '#222' : 'transparent',
              color: tab === t.id ? 'var(--pillar-accent)' : '#ededed',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: tab === t.id ? 700 : 400,
              opacity: tab === t.id ? 1 : 0.6,
              transition: 'opacity 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'spells' && <SpellCatalog />}
      {tab === 'monsters' && <MonsterBestiary />}
      {tab === 'classes' && <ClassComparison />}
      {tab === 'effects' && <StatusEffectReference />}
      {tab === 'items' && <ItemRegistry />}
    </div>
  );
}
