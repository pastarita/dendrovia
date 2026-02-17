'use client';

const PILLARS = [
  { name: 'ARCHITECTUS', color: '#3B82F6' },
  { name: 'LUDUS', color: '#EF4444' },
  { name: 'CHRONOS', color: '#c77b3f' },
  { name: 'IMAGINARIUM', color: '#A855F7' },
  { name: 'OPERATUS', color: '#6B7280' },
  { name: 'UNKNOWN', color: '#555' },
];

export function EventFilters({
  enabledPillars,
  onTogglePillar,
  textFilter,
  onTextFilterChange,
  onClear,
}: {
  enabledPillars: Set<string>;
  onTogglePillar: (pillar: string) => void;
  textFilter: string;
  onTextFilterChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      {PILLARS.map((p) => {
        const enabled = enabledPillars.has(p.name);
        return (
          <button
            key={p.name}
            onClick={() => onTogglePillar(p.name)}
            style={{
              padding: '0.3rem 0.6rem',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 500,
              border: `1px solid ${enabled ? p.color : '#333'}`,
              background: enabled ? `${p.color}22` : 'transparent',
              color: enabled ? p.color : '#555',
              cursor: 'pointer',
            }}
          >
            {p.name}
          </button>
        );
      })}

      <input
        value={textFilter}
        onChange={(e) => onTextFilterChange(e.target.value)}
        placeholder="Filter events..."
        style={{
          background: '#111',
          border: '1px solid #333',
          borderRadius: '4px',
          padding: '0.3rem 0.6rem',
          color: '#ededed',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-geist-mono)',
          width: '160px',
        }}
      />

      <button
        onClick={onClear}
        style={{
          padding: '0.3rem 0.6rem',
          background: '#222',
          border: '1px solid #444',
          borderRadius: '4px',
          color: '#ededed',
          fontSize: '0.75rem',
          cursor: 'pointer',
          marginLeft: 'auto',
        }}
      >
        Clear Log
      </button>
    </div>
  );
}
