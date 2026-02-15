'use client';

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
}

export default function StatBar({ label, current, max, color }: StatBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  return (
    <div style={{ marginBottom: '0.35rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
        <span style={{ opacity: 0.7 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-geist-mono)' }}>{current}/{max}</span>
      </div>
      <div style={{ height: '8px', background: '#222', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
