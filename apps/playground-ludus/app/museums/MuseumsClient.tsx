'use client';

import { useState } from 'react';
import BattleStatsExhibit from './components/BattleStatsExhibit';
import ProgressionExhibit from './components/ProgressionExhibit';
import DamageFormulaExhibit from './components/DamageFormulaExhibit';
import BalanceExhibit from './components/BalanceExhibit';

const TABS = [
  { id: 'battle-stats', label: 'Battle Stats' },
  { id: 'progression', label: 'Progression' },
  { id: 'damage-formula', label: 'Damage Formula' },
  { id: 'balance', label: 'Balance' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function MuseumsClient() {
  const [tab, setTab] = useState<TabId>('battle-stats');

  return (
    <div>
      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>
        {TABS.map(t => (
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
      {tab === 'battle-stats' && <BattleStatsExhibit />}
      {tab === 'progression' && <ProgressionExhibit />}
      {tab === 'damage-formula' && <DamageFormulaExhibit />}
      {tab === 'balance' && <BalanceExhibit />}
    </div>
  );
}
