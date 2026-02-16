'use client';

import type { MatchupResult } from '@dendrovia/ludus';

interface HeatmapCellProps {
  result: MatchupResult;
}

function getColor(winRate: number): string {
  if (winRate >= 0.80) return '#991B1B'; // too easy - dark red
  if (winRate >= 0.65) return '#F97316'; // slightly easy - orange
  if (winRate >= 0.55) return '#22C55E'; // balanced - green
  if (winRate >= 0.30) return '#EAB308'; // slightly hard - yellow
  return '#EF4444'; // too hard - red
}

export default function HeatmapCell({ result }: HeatmapCellProps): React.JSX.Element {
  const bg = getColor(result.winRate);
  const winPct = (result.winRate * 100).toFixed(1);

  return (
    <div
      style={{
        padding: '0.75rem',
        borderRadius: '6px',
        background: bg,
        color: '#fff',
        textAlign: 'center',
        fontSize: '0.8rem',
      }}
      title={`${result.playerClass} vs ${result.monsterType}: ${winPct}% win, avg ${result.avgTurns.toFixed(1)} turns, flag: ${result.flag}`}
    >
      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{winPct}%</div>
      <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{result.avgTurns.toFixed(1)} turns</div>
      {result.flag !== 'ok' && (
        <div style={{ fontSize: '0.65rem', marginTop: '0.2rem', opacity: 0.9 }}>{result.flag}</div>
      )}
    </div>
  );
}
