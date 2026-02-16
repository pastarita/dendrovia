'use client';

import { useState, useMemo } from 'react';
import {
  classifyGenus,
  buildTaxonomy,
  generateMorphology,
  generateLore,
  type FileContext,
  type FungalTaxonomy,
  type MushroomMorphology,
  type MushroomLore,
  type FungalGenus,
} from '@dendrovia/imaginarium';
import type { ParsedFile } from '@dendrovia/shared';
import { SPECIMEN_FILES } from '../museum-fixtures';

const TIER_COLORS: Record<string, string> = {
  common: '#888',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#FFD700',
};

interface ComputedSpecimen {
  file: ParsedFile;
  ctx: FileContext;
  genus: FungalGenus;
  taxonomy: FungalTaxonomy;
  morphology: MushroomMorphology;
  lore: MushroomLore;
}

function buildMockParsedFile(
  data: (typeof SPECIMEN_FILES)[number],
): ParsedFile {
  return {
    path: data.path,
    hash: `mock-${data.path}`,
    language: data.language,
    complexity: data.complexity,
    loc: data.loc,
    lastModified: new Date('2025-06-15'),
    author: 'exhibit',
  };
}

function buildMockFileContext(
  data: (typeof SPECIMEN_FILES)[number],
): FileContext {
  const isEntryPoint = /\/(index|main|app|server)\.[^/]+$/i.test(data.path);
  const isConfig =
    /\/(config|\.env|settings|constants|tsconfig|package\.json)/i.test(data.path);
  const isTest = /\/(test|spec|__tests__|__mocks__)\b/i.test(data.path);
  const isDeprecated = /\/(deprecated|legacy|old|archive)/i.test(data.path);

  return {
    isEntryPoint,
    isConfig,
    isTest,
    isDeprecated,
    dependentCount: Math.max(0, Math.floor(data.complexity * 0.8)),
    dependencyCount: Math.min(5, Math.floor(data.loc / 40)),
    hotspot: undefined,
    avgComplexity: 5,
    maxLoc: 200,
    fileAge: 30 * 24 * 60 * 60 * 1000,
    commitCount: Math.max(1, data.complexity * 2),
  };
}

export default function MycologyExhibit() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const specimens = useMemo<ComputedSpecimen[]>(() => {
    return SPECIMEN_FILES.map((data) => {
      const file = buildMockParsedFile(data);
      const ctx = buildMockFileContext(data);
      const genus = classifyGenus(file, ctx);
      const taxonomy = buildTaxonomy(file, ctx);
      const morphology = generateMorphology(file, ctx, genus);
      const lore = generateLore(file, ctx, taxonomy);
      return { file, ctx, genus, taxonomy, morphology, lore };
    });
  }, []);

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
            <div
              key={spec.file.path}
              onClick={() => setSelectedIndex(isSelected ? null : i)}
              style={{
                padding: '1rem',
                border: isSelected
                  ? '2px solid var(--pillar-accent)'
                  : '1px solid #333',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                background: '#111',
              }}
            >
              {/* Genus + species */}
              <div style={{ marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {spec.taxonomy.genus}
                </span>{' '}
                <span style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.85rem' }}>
                  {spec.taxonomy.species}
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
                {spec.file.path}
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
                    color: TIER_COLORS[spec.lore.tier] ?? '#888',
                    fontWeight: 600,
                  }}
                >
                  {spec.lore.tier}
                </span>
                <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                  {spec.morphology.capShape} cap &middot; stem {(spec.morphology.stem.height * 100).toFixed(0)}%
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
                {spec.lore.flavorText}
              </p>
            </div>
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
              {spec.lore.title}
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
                <div>Division: <span style={{ color: 'var(--pillar-accent)' }}>{spec.taxonomy.division}</span></div>
                <div>Class: <span style={{ color: 'var(--pillar-accent)' }}>{spec.taxonomy.class}</span></div>
                <div>Order: <span style={{ color: 'var(--pillar-accent)' }}>{spec.taxonomy.order}</span></div>
                <div>Family: <span style={{ color: 'var(--pillar-accent)' }}>{spec.taxonomy.family}</span></div>
                <div>Genus: <span style={{ color: 'var(--pillar-accent)' }}>{spec.taxonomy.genus}</span></div>
                <div>Species: <span style={{ color: 'var(--pillar-accent)' }}>{spec.taxonomy.species}</span></div>
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
                    ['Cap Shape', spec.morphology.capShape],
                    ['Cap Width', `${(spec.morphology.capWidth * 100).toFixed(0)}%`],
                    ['Cap Height', `${(spec.morphology.capHeight * 100).toFixed(0)}%`],
                    ['Gill Count', String(spec.morphology.gillCount)],
                    ['Gill Attachment', spec.morphology.gillAttachment],
                    ['Stem Height', `${(spec.morphology.stem.height * 100).toFixed(0)}%`],
                    ['Stem Thickness', `${(spec.morphology.stem.thickness * 100).toFixed(0)}%`],
                    ['Bioluminescence', spec.morphology.bioluminescence],
                    ['Spore Print', spec.morphology.sporePrintColor],
                    ['Size Class', spec.morphology.sizeClass],
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
            <div style={{ marginBottom: spec.lore.domainKnowledge ? '1rem' : 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Code Insight
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>
                {spec.lore.codeInsight}
              </p>
            </div>

            {/* Domain knowledge */}
            {spec.lore.domainKnowledge && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Domain Knowledge
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>
                  {spec.lore.domainKnowledge}
                </p>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
