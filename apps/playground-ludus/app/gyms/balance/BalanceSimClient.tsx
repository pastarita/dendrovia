'use client';

import { useState, useCallback } from 'react';
import type { CharacterClass, BugType } from '@dendrovia/shared';
import {
  runFullSimulation,
  formatCSV,
  DEFAULT_BALANCE_CONFIG,
  EASY_CONFIG,
  HARD_CONFIG,
  createBalanceConfig,
} from '@dendrovia/ludus';
import type { BalanceConfig, SimulationReport, SimulationConfig, MatchupResult } from '@dendrovia/ludus';
import HeatmapCell from './components/HeatmapCell';
import ConfigSliders from './components/ConfigSliders';

const ALL_CLASSES: CharacterClass[] = ['tank', 'healer', 'dps'];
const ALL_BUG_TYPES: BugType[] = ['null-pointer', 'memory-leak', 'race-condition', 'off-by-one'];

const PRESETS: { label: string; config: BalanceConfig }[] = [
  { label: 'Default', config: DEFAULT_BALANCE_CONFIG },
  { label: 'Easy', config: EASY_CONFIG },
  { label: 'Hard', config: HARD_CONFIG },
];

const selectStyle: React.CSSProperties = {
  padding: '0.35rem 0.5rem',
  borderRadius: '4px',
  border: '1px solid #333',
  background: '#1a1a1a',
  color: '#ededed',
  fontSize: '0.8rem',
};

export default function BalanceSimClient() {
  const [level, setLevel] = useState(5);
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [trials, setTrials] = useState(100);
  const [config, setConfig] = useState<BalanceConfig>(DEFAULT_BALANCE_CONFIG);
  const [report, setReport] = useState<SimulationReport | null>(null);
  const [running, setRunning] = useState(false);

  const runSim = useCallback(() => {
    setRunning(true);
    // Use requestAnimationFrame to let the "running" state render
    requestAnimationFrame(() => {
      const simConfig: SimulationConfig = {
        trials,
        maxTurns: 100,
        lowWinThreshold: 0.30,
        highWinThreshold: 0.80,
        baseSeed: 12345,
      };
      const result = runFullSimulation(level, severity, 0, simConfig);
      setReport(result);
      setRunning(false);
    });
  }, [level, severity, trials]);

  const handlePreset = (idx: number) => {
    setConfig(PRESETS[idx].config);
  };

  const handleSliderChange = (section: string, key: string, value: number) => {
    setConfig(prev => createBalanceConfig({ ...prev, [section]: { ...(prev as Record<string, any>)[section], [key]: value } }));
  };

  const exportCSV = () => {
    if (!report) return;
    const csv = formatCSV(report.matchups);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ludus-balance-lv${level}-s${severity}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!report) return;
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ludus-balance-lv${level}-s${severity}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build matchup lookup from report
  const getMatchup = (cls: CharacterClass, bug: BugType): MatchupResult | undefined => {
    return report?.matchups.find(m => m.playerClass === cls && m.monsterType === bug);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
      {/* Left sidebar — controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Simulation Setup */}
        <div style={{ padding: '1rem', border: '1px solid #222', borderRadius: '8px', background: '#111' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Simulation Setup</div>

          <label style={{ fontSize: '0.75rem', opacity: 0.5 }}>Player Level: {level}</label>
          <input type="range" min={1} max={30} value={level} onChange={e => setLevel(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--pillar-accent)' }} />

          <label style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.5rem', display: 'block' }}>Monster Severity</label>
          <select style={{ ...selectStyle, width: '100%' }} value={severity} onChange={e => setSeverity(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}>
            {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>Severity {s}</option>)}
          </select>

          <label style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.5rem', display: 'block' }}>Trials per matchup</label>
          <select style={{ ...selectStyle, width: '100%' }} value={trials} onChange={e => setTrials(Number(e.target.value))}>
            {[50, 100, 250, 500, 1000].map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <label style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.5rem', display: 'block' }}>Config Preset</label>
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
            {PRESETS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => handlePreset(i)}
                style={{
                  ...selectStyle,
                  cursor: 'pointer',
                  borderColor: config === p.config ? 'var(--pillar-accent)' : '#333',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={runSim}
            disabled={running}
            style={{
              marginTop: '0.75rem',
              width: '100%',
              padding: '0.6rem',
              borderRadius: '6px',
              border: '2px solid var(--pillar-accent)',
              background: running ? '#333' : 'transparent',
              color: running ? '#888' : 'var(--pillar-accent)',
              cursor: running ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            {running ? 'Running...' : 'Run Simulation'}
          </button>
        </div>

        {/* Config Sliders */}
        <ConfigSliders config={config} onChange={handleSliderChange} />
      </div>

      {/* Right — results */}
      <div>
        {!report && !running && (
          <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed #333', borderRadius: '8px', opacity: 0.4 }}>
            Configure parameters and click "Run Simulation"
          </div>
        )}

        {report && (
          <div>
            {/* Summary */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
              <div style={{ padding: '0.5rem 0.75rem', border: '1px solid #222', borderRadius: '6px', background: '#111' }}>
                <span style={{ opacity: 0.5 }}>Overall Win Rate: </span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-geist-mono)' }}>{(report.overallWinRate * 100).toFixed(1)}%</span>
              </div>
              <div style={{ padding: '0.5rem 0.75rem', border: '1px solid #222', borderRadius: '6px', background: '#111' }}>
                <span style={{ opacity: 0.5 }}>Total Trials: </span>
                <span style={{ fontFamily: 'var(--font-geist-mono)' }}>{report.totalTrials}</span>
              </div>
              <div style={{ padding: '0.5rem 0.75rem', border: '1px solid #222', borderRadius: '6px', background: '#111' }}>
                <span style={{ opacity: 0.5 }}>Duration: </span>
                <span style={{ fontFamily: 'var(--font-geist-mono)' }}>{report.durationMs}ms</span>
              </div>
              <div style={{ padding: '0.5rem 0.75rem', border: '1px solid #222', borderRadius: '6px', background: report.flaggedMatchups.length > 0 ? '#5f1e1e' : '#111' }}>
                <span style={{ opacity: 0.5 }}>Flagged: </span>
                <span style={{ fontWeight: 700 }}>{report.flaggedMatchups.length}</span>
              </div>
            </div>

            {/* Heatmap Matrix */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Matchup Heatmap (Win Rate %)</div>

              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <div />
                {ALL_BUG_TYPES.map(bug => (
                  <div key={bug} style={{ textAlign: 'center', fontSize: '0.7rem', opacity: 0.5 }}>{bug}</div>
                ))}
              </div>

              {/* Data rows */}
              {ALL_CLASSES.map(cls => (
                <div key={cls} style={{ display: 'grid', gridTemplateColumns: '100px repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', fontWeight: 600 }}>{cls}</div>
                  {ALL_BUG_TYPES.map(bug => {
                    const matchup = getMatchup(cls, bug);
                    if (!matchup) return <div key={bug} />;
                    return <HeatmapCell key={bug} result={matchup} />;
                  })}
                </div>
              ))}

              {/* Legend */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.7rem', opacity: 0.6 }}>
                <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#22C55E', borderRadius: '2px', marginRight: '0.25rem' }} />55-65% balanced</span>
                <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#EAB308', borderRadius: '2px', marginRight: '0.25rem' }} />30-55% hard</span>
                <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#EF4444', borderRadius: '2px', marginRight: '0.25rem' }} />&lt;30% too hard</span>
                <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#F97316', borderRadius: '2px', marginRight: '0.25rem' }} />65-80% easy</span>
                <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#991B1B', borderRadius: '2px', marginRight: '0.25rem' }} />&gt;80% too easy</span>
              </div>
            </div>

            {/* Export */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={exportCSV}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #333',
                  background: '#1a1a1a',
                  color: '#ededed',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                Export CSV
              </button>
              <button
                onClick={exportJSON}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #333',
                  background: '#1a1a1a',
                  color: '#ededed',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                Export JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
