'use client';

import { useState } from 'react';
import { ALL_DOMAINS, PILLAR_DOMAIN_AFFINITY, type PillarName } from './domain-registry';
import { ALL_PILLARS } from './pillar-nav';

/** Maps affinity score 1-5 to a background color with intensity */
function scoreToColor(score: number, pillarHex: string): string {
  const alpha = [0, 0.08, 0.18, 0.32, 0.52, 0.75][score] ?? 0;
  return `${pillarHex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')}`;
}

function scoreToBorderColor(score: number, pillarHex: string): string {
  if (score >= 5) return pillarHex;
  if (score >= 3) return `${pillarHex}66`;
  return 'transparent';
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Minimal',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Primary',
};

interface TooltipData {
  pillar: string;
  domain: string;
  score: number;
  pillarHex: string;
}

export function AffinityMap({ currentPillar }: { currentPillar?: string }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent, data: TooltipData) {
    setTooltip(data);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          opacity: 0.4,
          marginBottom: '0.75rem',
        }}
      >
        Pillar-Domain Affinity Map
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            fontSize: '0.8rem',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: '0.4rem 0.5rem',
                  textAlign: 'left',
                  borderBottom: '1px solid #333',
                  fontSize: '0.7rem',
                  opacity: 0.5,
                  fontWeight: 500,
                }}
              />
              {ALL_PILLARS.map((p) => {
                const isCurrent = p.name === currentPillar;
                return (
                  <th
                    key={p.name}
                    style={{
                      padding: '0.4rem 0.3rem',
                      textAlign: 'center',
                      borderBottom: isCurrent ? `2px solid ${p.hex}` : '1px solid #333',
                      fontSize: '0.65rem',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? p.hex : undefined,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div>{p.emoji}</div>
                    <div style={{ marginTop: '0.15rem' }}>{p.name.slice(0, 4)}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ALL_DOMAINS.map((d) => (
              <tr key={d.slug}>
                <td
                  style={{
                    padding: '0.4rem 0.5rem',
                    borderBottom: '1px solid #1a1a1a',
                    whiteSpace: 'nowrap',
                    fontSize: '0.75rem',
                  }}
                >
                  <span style={{ marginRight: '0.35rem' }}>{d.icon}</span>
                  {d.name}
                </td>
                {ALL_PILLARS.map((p) => {
                  const score = PILLAR_DOMAIN_AFFINITY[p.name as PillarName]?.[d.slug] ?? 0;
                  const isCurrent = p.name === currentPillar;
                  const isHero = score >= 5;

                  return (
                    <td
                      key={p.name}
                      onMouseMove={(e) =>
                        handleMouseMove(e, {
                          pillar: p.name,
                          domain: d.name,
                          score,
                          pillarHex: p.hex,
                        })
                      }
                      onMouseLeave={handleMouseLeave}
                      style={{
                        padding: '0.35rem 0.3rem',
                        textAlign: 'center',
                        borderBottom: '1px solid #1a1a1a',
                        background: scoreToColor(score, p.hex),
                        border: `1px solid ${scoreToBorderColor(score, p.hex)}`,
                        borderRadius: '3px',
                        cursor: 'default',
                        fontWeight: isHero ? 700 : 400,
                        fontSize: isHero ? '0.9rem' : '0.8rem',
                        color: isCurrent && isHero ? p.hex : undefined,
                        transition: 'background 0.15s',
                      }}
                    >
                      {score}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginTop: '0.75rem',
          fontSize: '0.65rem',
          opacity: 0.5,
          flexWrap: 'wrap',
        }}
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                background: scoreToColor(s, '#888888'),
                border: s >= 5 ? '1px solid #888' : s >= 3 ? '1px solid #88888866' : '1px solid #333',
              }}
            />
            {s} {SCORE_LABELS[s]}
          </span>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 8,
            background: '#1a1a1a',
            border: `1px solid ${tooltip.pillarHex}55`,
            borderRadius: '6px',
            padding: '0.5rem 0.75rem',
            fontSize: '0.8rem',
            pointerEvents: 'none',
            zIndex: 1000,
            minWidth: '140px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: '0.25rem',
              color: tooltip.pillarHex,
            }}
          >
            {tooltip.pillar}
          </div>
          <div style={{ opacity: 0.7, marginBottom: '0.35rem' }}>{tooltip.domain}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{tooltip.score}</span>
            <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>/ 5 &mdash; {SCORE_LABELS[tooltip.score]}</span>
          </div>
          <div
            style={{
              marginTop: '0.3rem',
              height: '3px',
              borderRadius: '2px',
              background: '#222',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(tooltip.score / 5) * 100}%`,
                height: '100%',
                background: tooltip.pillarHex,
                borderRadius: '2px',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
