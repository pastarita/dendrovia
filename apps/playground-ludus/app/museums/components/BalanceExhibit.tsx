'use client';

import { useState, useMemo } from 'react';
import { DEFAULT_BALANCE_CONFIG, EASY_CONFIG, HARD_CONFIG, simulateMatchup } from '@dendrovia/ludus';

const CONFIGS = [
  { key: 'default', label: 'DEFAULT', config: DEFAULT_BALANCE_CONFIG },
  { key: 'easy', label: 'EASY', config: EASY_CONFIG },
  { key: 'hard', label: 'HARD', config: HARD_CONFIG },
] as const;

const KEY_VALUES = [
  { path: 'damage.defenseConstant', label: 'Defense Constant' },
  { path: 'damage.baseCritChance', label: 'Base Crit Chance' },
  { path: 'damage.critMultiplier', label: 'Crit Multiplier' },
  { path: 'combat.healAttackRatio', label: 'Heal ATK Ratio' },
  { path: 'combat.shieldDefenseRatio', label: 'Shield DEF Ratio' },
  { path: 'combat.defendDefenseBonus', label: 'Defend Bonus' },
  { path: 'encounters.randomEncounterChance', label: 'Encounter Chance' },
  { path: 'encounters.encounterCooldown', label: 'Encounter Cooldown' },
  { path: 'monsters.severityStep', label: 'Severity Step' },
] as const;

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

const FLAG_COLORS: Record<string, string> = {
  ok: '#22C55E',
  'too-easy': '#3B82F6',
  'too-hard': '#EF4444',
  'draw-heavy': '#F97316',
};

export default function BalanceExhibit() {
  const [matchupResult, setMatchupResult] = useState<Array<{ config: string; winRate: number; avgTurns: number; flag: string }> | null>(null);
  const [running, setRunning] = useState(false);

  const runQuickMatchup = () => {
    setRunning(true);
    // Use setTimeout so the UI updates before the sync computation
    setTimeout(() => {
      const results = CONFIGS.map(c => {
        const result = simulateMatchup('tank', 10, 'null-pointer', 3, 0, {
          trials: 100,
          maxTurns: 100,
          lowWinThreshold: 0.30,
          highWinThreshold: 0.80,
          baseSeed: 12345,
        });
        return { config: c.label, winRate: result.winRate, avgTurns: result.avgTurns, flag: result.flag };
      });
      setMatchupResult(results);
      setRunning(false);
    }, 0);
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.7 }}>
        LUDUS ships three balance presets. Compare their key values and see how they affect win rates.
      </div>

      {/* Config Comparison Table */}
      <div style={{ padding: '1.25rem', border: '1px solid #222', borderRadius: '8px', background: '#111', marginBottom: '1.5rem', overflowX: 'auto' }}>
        <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Config Comparison</div>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.3rem 0.5rem', borderBottom: '1px solid #333', fontSize: '0.7rem', opacity: 0.5 }}>Parameter</th>
              {CONFIGS.map(c => (
                <th key={c.key} style={{ textAlign: 'right', padding: '0.3rem 0.5rem', borderBottom: '1px solid #333', fontSize: '0.75rem', fontWeight: 700 }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {KEY_VALUES.map(kv => (
              <tr key={kv.path}>
                <td style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderBottom: '1px solid #1a1a1a' }}>{kv.label}</td>
                {CONFIGS.map(c => {
                  const val = getNestedValue(c.config, kv.path);
                  const defaultVal = getNestedValue(DEFAULT_BALANCE_CONFIG, kv.path);
                  const isChanged = val !== defaultVal;
                  return (
                    <td
                      key={c.key}
                      style={{
                        textAlign: 'right',
                        padding: '0.25rem 0.5rem',
                        fontFamily: 'var(--font-geist-mono)',
                        fontSize: '0.8rem',
                        borderBottom: '1px solid #1a1a1a',
                        color: isChanged ? 'var(--pillar-accent)' : undefined,
                        fontWeight: isChanged ? 700 : 400,
                      }}
                    >
                      {typeof val === 'number' ? (val < 1 && val > 0 ? val.toFixed(3) : val) : String(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Matchup */}
      <button
        onClick={runQuickMatchup}
        disabled={running}
        style={{
          padding: '0.4rem 1rem',
          borderRadius: '4px',
          border: '1px solid var(--pillar-accent)',
          background: matchupResult ? '#222' : 'transparent',
          color: 'var(--pillar-accent)',
          cursor: running ? 'not-allowed' : 'pointer',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1rem',
          opacity: running ? 0.3 : 1,
        }}
      >
        {running ? 'Simulating...' : 'Quick Matchup (Tank Lv10 vs NullPointer S3)'}
      </button>

      {matchupResult && (
        <div style={{ padding: '1.25rem', border: '1px solid #222', borderRadius: '8px', background: '#111', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Quick Matchup Results (100 trials each)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {matchupResult.map(r => (
              <div key={r.config} style={{ padding: '0.75rem', border: '1px solid #222', borderRadius: '6px', background: '#1a1a1a' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>{r.config}</div>
                <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem' }}>
                  <div>Win Rate: <span style={{ fontWeight: 700 }}>{(r.winRate * 100).toFixed(1)}%</span></div>
                  <div>Avg Turns: {r.avgTurns.toFixed(1)}</div>
                  <div>
                    Flag: <span style={{ color: FLAG_COLORS[r.flag] ?? '#6B7280' }}>{r.flag}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Balance Flags */}
      <div style={{ padding: '1.25rem', border: '1px solid #222', borderRadius: '8px', background: '#111', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Balance Flags</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div><span style={{ color: FLAG_COLORS['ok'], fontWeight: 700 }}>ok</span> — Win rate 30-80%</div>
          <div><span style={{ color: FLAG_COLORS['too-easy'], fontWeight: 700 }}>too-easy</span> — Win rate &gt;80%</div>
          <div><span style={{ color: FLAG_COLORS['too-hard'], fontWeight: 700 }}>too-hard</span> — Win rate &lt;30%</div>
          <div><span style={{ color: FLAG_COLORS['draw-heavy'], fontWeight: 700 }}>draw-heavy</span> — Draw rate &gt;10%</div>
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>
        For full interactive balance simulation, visit <a href="/gyms/balance" style={{ color: 'var(--pillar-accent)' }}>/gyms/balance</a>
      </div>
    </div>
  );
}
