'use client';

import { useState, useMemo } from 'react';
import { createCharacter, createMonster, createRngState, simulateBattle, createBattleStatistics } from '@dendrovia/ludus';

const STAT_DESCRIPTIONS: Array<{ key: string; label: string; category: string; description: string }> = [
  { key: 'totalBattles', label: 'Total Battles', category: 'Meta', description: 'Total number of battles fought' },
  { key: 'victories', label: 'Victories', category: 'Meta', description: 'Number of battles won' },
  { key: 'defeats', label: 'Defeats', category: 'Meta', description: 'Number of battles lost' },
  { key: 'totalDamageDealt', label: 'Damage Dealt', category: 'Offense', description: 'Cumulative damage dealt across all battles' },
  { key: 'totalSpellsCast', label: 'Spells Cast', category: 'Offense', description: 'Total number of spells used in combat' },
  { key: 'criticalHits', label: 'Critical Hits', category: 'Offense', description: 'Number of critical hits landed' },
  { key: 'totalDamageReceived', label: 'Damage Received', category: 'Defense', description: 'Total damage taken from enemies' },
  { key: 'totalHealing', label: 'Total Healing', category: 'Defense', description: 'Cumulative HP restored from spells and items' },
  { key: 'totalTurns', label: 'Total Turns', category: 'Meta', description: 'Sum of turns across all battles' },
  { key: 'monstersDefeated', label: 'Monsters Defeated', category: 'Offense', description: 'Individual monsters killed' },
  { key: 'bossesDefeated', label: 'Bosses Defeated', category: 'Offense', description: 'Boss-tier enemies defeated' },
  { key: 'longestBattle', label: 'Longest Battle', category: 'Meta', description: 'Most turns in a single battle' },
  { key: 'fastestVictory', label: 'Fastest Victory', category: 'Meta', description: 'Fewest turns to win a battle' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Offense: '#EF4444',
  Defense: '#3B82F6',
  Meta: '#6B7280',
};

export default function BattleStatsExhibit() {
  const [simulated, setSimulated] = useState(false);

  const sampleResult = useMemo(() => {
    if (!simulated) return null;
    const player = createCharacter('tank', 'Test Tank', 5);
    const rng = createRngState(42);
    const [monster] = createMonster('null-pointer', 2, 0, rng);
    return simulateBattle(player, monster, 42);
  }, [simulated]);

  const blankStats = createBattleStatistics();

  return (
    <div>
      <div style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.7 }}>
        The <code style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--pillar-accent)' }}>BattleStatistics</code> interface tracks 13 metrics across offense, defense, and meta categories.
      </div>

      {/* Stat Descriptions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {STAT_DESCRIPTIONS.map(stat => (
          <div
            key={stat.key}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #222',
              borderRadius: '8px',
              background: '#111',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{stat.label}</span>
              <span style={{
                fontSize: '0.6rem',
                padding: '0.1rem 0.3rem',
                borderRadius: '3px',
                background: CATEGORY_COLORS[stat.category] ?? '#333',
                color: '#fff',
              }}>
                {stat.category}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.25rem' }}>{stat.description}</div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-geist-mono)', opacity: 0.4 }}>
              {stat.key}: {(blankStats as any)[stat.key] === Infinity ? 'Infinity' : (blankStats as any)[stat.key]}
            </div>
          </div>
        ))}
      </div>

      {/* Simulate */}
      <button
        onClick={() => setSimulated(true)}
        style={{
          padding: '0.4rem 1rem',
          borderRadius: '4px',
          border: '1px solid var(--pillar-accent)',
          background: simulated ? '#222' : 'transparent',
          color: 'var(--pillar-accent)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}
      >
        Simulate Sample Battle
      </button>

      {sampleResult && (
        <div style={{ padding: '1.25rem', border: '1px solid #222', borderRadius: '8px', background: '#111' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Sample Battle: Tank (Lv5) vs NullPointerException (S2)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem' }}>
            <div>
              <span style={{ opacity: 0.5 }}>Result:</span>{' '}
              <span style={{ color: sampleResult.result === 'victory' ? '#22C55E' : '#EF4444', fontWeight: 700 }}>
                {sampleResult.result.toUpperCase()}
              </span>
            </div>
            <div><span style={{ opacity: 0.5 }}>Turns:</span> {sampleResult.turns}</div>
            <div><span style={{ opacity: 0.5 }}>Player HP:</span> {sampleResult.playerHPRemaining}</div>
          </div>
        </div>
      )}
    </div>
  );
}
