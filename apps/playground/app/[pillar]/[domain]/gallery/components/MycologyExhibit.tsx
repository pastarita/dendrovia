'use client';

import { useState } from 'react';
import { OrnateFrame } from '@dendrovia/oculus';

const TIER_COLORS: Record<string, string> = {
  common: '#888',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#FFD700',
};

export interface SpecimenData {
  path: string;
  genus: string;
  species: string;
  division: string;
  class: string;
  order: string;
  family: string;
  capShape: string;
  capWidth: number;
  capHeight: number;
  gillCount: number;
  gillAttachment: string;
  stemHeight: number;
  stemThickness: number;
  bioluminescence: string;
  sporePrintColor: string;
  sizeClass: string;
  tier: string;
  title: string;
  flavorText: string;
  codeInsight: string;
  domainKnowledge?: string;
}

export default function MycologyExhibit({ specimens }: { specimens: SpecimenData[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {specimens.map((spec, i) => {
          const isSelected = selectedIndex === i;
          return (
            <OrnateFrame
              key={spec.path}
              pillar="imaginarium"
              variant="panel"
              onClick={() => setSelectedIndex(isSelected ? null : i)}
              style={{
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                background: '#111',
              }}
            >
              {/* Genus + species */}
              <div style={{ marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {spec.genus}
                </span>{' '}
                <span style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.85rem' }}>
                  {spec.species}
                </span>
              </div>

              {/* File path */}
              <div
                style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.7rem',
                  opacity: 0.4,
                  marginBottom: '0.5rem',
                }}
              >
                {spec.path}
              </div>

              {/* Tier badge + morphology summary */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: '#222',
                    color: TIER_COLORS[spec.tier] ?? '#888',
                    fontWeight: 600,
                  }}
                >
                  {spec.tier}
                </span>
                <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                  {spec.capShape} cap &middot; stem {(spec.stemHeight * 100).toFixed(0)}%
                </span>
              </div>

              {/* Flavor text */}
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  fontStyle: 'italic',
                  opacity: 0.5,
                  lineHeight: 1.4,
                }}
              >
                {spec.flavorText}
              </p>
            </OrnateFrame>
          );
        })}
      </div>

      {/* Expanded detail */}
      {selectedIndex !== null && (() => {
        const spec = specimens[selectedIndex];
        if (!spec) return null;
        return (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              border: '1px solid var(--pillar-accent)',
              borderRadius: '8px',
              background: '#0a0a0a',
            }}
          >
            <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>
              {spec.title}
            </h3>

            {/* Taxonomy tree */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Taxonomy
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.75rem',
                  lineHeight: 1.8,
                  paddingLeft: '0.5rem',
                  borderLeft: '2px solid #333',
                }}
              >
                <div>Division: <span style={{ color: 'var(--pillar-accent)' }}>{spec.division}</span></div>
                <div>Class: <span style={{ color: 'var(--pillar-accent)' }}>{spec.class}</span></div>
                <div>Order: <span style={{ color: 'var(--pillar-accent)' }}>{spec.order}</span></div>
                <div>Family: <span style={{ color: 'var(--pillar-accent)' }}>{spec.family}</span></div>
                <div>Genus: <span style={{ color: 'var(--pillar-accent)' }}>{spec.genus}</span></div>
                <div>Species: <span style={{ color: 'var(--pillar-accent)' }}>{spec.species}</span></div>
              </div>
            </div>

            {/* Morphology table */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Morphology
              </div>
              <table
                style={{
                  width: '100%',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-geist-mono), monospace',
                  borderCollapse: 'collapse',
                }}
              >
                <tbody>
                  {([
                    ['Cap Shape', spec.capShape],
                    ['Cap Width', `${(spec.capWidth * 100).toFixed(0)}%`],
                    ['Cap Height', `${(spec.capHeight * 100).toFixed(0)}%`],
                    ['Gill Count', String(spec.gillCount)],
                    ['Gill Attachment', spec.gillAttachment],
                    ['Stem Height', `${(spec.stemHeight * 100).toFixed(0)}%`],
                    ['Stem Thickness', `${(spec.stemThickness * 100).toFixed(0)}%`],
                    ['Bioluminescence', spec.bioluminescence],
                    ['Spore Print', spec.sporePrintColor],
                    ['Size Class', spec.sizeClass],
                  ] as const).map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '0.3rem 0.5rem', opacity: 0.5 }}>{label}</td>
                      <td style={{ padding: '0.3rem 0.5rem' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Code insight */}
            <div style={{ marginBottom: spec.domainKnowledge ? '1rem' : 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Code Insight
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>
                {spec.codeInsight}
              </p>
            </div>

            {/* Domain knowledge */}
            {spec.domainKnowledge && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Domain Knowledge
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>
                  {spec.domainKnowledge}
                </p>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
