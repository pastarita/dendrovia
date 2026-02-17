'use client';

import { ReconStatusBar } from './recon-status';

export const ALL_PILLARS = [
  { name: 'ARCHITECTUS', port: 3011, emoji: '\u{1F3DB}\uFE0F', tincture: 'Azure', hex: '#3B82F6' },
  { name: 'CHRONOS', port: 3012, emoji: '\u{1F4DC}', tincture: 'Amber', hex: '#c77b3f' },
  { name: 'IMAGINARIUM', port: 3013, emoji: '\u{1F3A8}', tincture: 'Purpure', hex: '#A855F7' },
  { name: 'LUDUS', port: 3014, emoji: '\u{1F3AE}', tincture: 'Gules', hex: '#EF4444' },
  { name: 'OCULUS', port: 3015, emoji: '\u{1F441}\uFE0F', tincture: 'Vert', hex: '#22C55E' },
  { name: 'OPERATUS', port: 3016, emoji: '\u{1F4BE}', tincture: 'Sable', hex: '#6B7280' },
] as const;

export function PillarNav({ currentPillar }: { currentPillar: string }) {
  return (
    <>
      <div>
        <div
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            opacity: 0.4,
            marginBottom: '0.5rem',
          }}
        >
          Pillars
        </div>
        {ALL_PILLARS.map((p) => {
          const isCurrent = p.name === currentPillar;
          return (
            <a
              key={p.name}
              href={isCurrent ? '/' : `http://localhost:${p.port}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.85rem',
                borderLeft: isCurrent ? `3px solid ${p.hex}` : '3px solid transparent',
                background: isCurrent ? `${p.hex}15` : 'transparent',
                opacity: isCurrent ? 1 : 0.85,
                fontWeight: isCurrent ? 600 : 400,
              }}
            >
              <span>{p.emoji}</span>
              <span>{p.name}</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.4, marginLeft: 'auto' }}>
                {isCurrent ? '(you)' : `:${p.port}`}
              </span>
            </a>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <ReconStatusBar currentPillar={currentPillar} />
        <a
          href="http://localhost:3010"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            borderRadius: '4px',
            fontSize: '0.85rem',
            border: '1px solid #333',
          }}
        >
          {'\u{1F333}'} Dendrovia Quest{' '}
          <span style={{ fontSize: '0.7rem', opacity: 0.4, marginLeft: 'auto' }}>:3010</span>
        </a>
      </div>
    </>
  );
}
