'use client';

import { useState } from 'react';
import {
  DEFAULT_SDFS,
  type SDFTier,
} from '@dendrovia/imaginarium/fallbacks';
import { countInstructions } from '@dendrovia/imaginarium/utils/glsl';
import { OrnateFrame } from '@dendrovia/oculus';

const TIER_ORDER: { tier: SDFTier; threshold: string }[] = [
  { tier: 'simple-trunk', threshold: '\u22643' },
  { tier: 'binary-branch', threshold: '\u22646' },
  { tier: 'complex-tree', threshold: '\u226410' },
  { tier: 'dense-canopy', threshold: '\u226415' },
  { tier: 'twisted-spire', threshold: '>15' },
];

const GLSL_KEYWORDS = /\b(float|vec2|vec3|vec4|return|void|mat2|mat3|mat4|int|bool)\b/g;
const GLSL_NUMBERS = /\b(\d+\.\d+|\d+)\b/g;
const GLSL_COMMENTS = /(\/\/.*$)/gm;

function countPrimitives(source: string): { capsules: number; spheres: number; unions: number } {
  const capsules = (source.match(/sdCapsule/g) || []).length;
  const spheres = (source.match(/sdSphere/g) || []).length + (source.match(/sdRoundCone/g) || []).length;
  const unions = (source.match(/opSmoothUnion/g) || []).length;
  return { capsules, spheres, unions };
}

function highlightGlsl(source: string): React.ReactNode[] {
  const lines = source.split('\n');
  return lines.map((line, i) => {
    // Process comments first
    const commentMatch = line.match(GLSL_COMMENTS);
    if (commentMatch) {
      const commentIdx = line.indexOf('//');
      const before = line.slice(0, commentIdx);
      const comment = line.slice(commentIdx);
      return (
        <div key={i}>
          {highlightLine(before)}
          <span style={{ color: '#666' }}>{comment}</span>
        </div>
      );
    }
    return <div key={i}>{highlightLine(line)}</div>;
  });
}

function highlightLine(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let lastIndex = 0;
  const combined = new RegExp(
    `(${GLSL_KEYWORDS.source})|(${GLSL_NUMBERS.source})`,
    'g',
  );

  let match;
  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      // keyword
      tokens.push(
        <span key={match.index} style={{ color: 'var(--pillar-accent)' }}>
          {match[0]}
        </span>,
      );
    } else {
      // number
      tokens.push(
        <span key={match.index} style={{ color: '#22C55E' }}>
          {match[0]}
        </span>,
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }
  return tokens;
}

export default function ShaderExhibit() {
  const [expandedTier, setExpandedTier] = useState<SDFTier | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {TIER_ORDER.map(({ tier, threshold }) => {
        const source = DEFAULT_SDFS.get(tier)!;
        const instructions = countInstructions(source);
        const prims = countPrimitives(source);
        const isExpanded = expandedTier === tier;

        return (
          <OrnateFrame
            key={tier}
            pillar="imaginarium"
            variant="panel"
            style={{
              background: '#111',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              onClick={() => setExpandedTier(isExpanded ? null : tier)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                cursor: 'pointer',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: 140 }}>
                {tier}
              </span>

              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  background: '#222',
                  fontFamily: 'var(--font-geist-mono), monospace',
                }}
              >
                complexity {threshold}
              </span>

              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  background: '#1a1a2e',
                  color: 'var(--pillar-accent)',
                  fontFamily: 'var(--font-geist-mono), monospace',
                }}
              >
                {instructions} instr
              </span>

              <span
                style={{
                  fontSize: '0.7rem',
                  opacity: 0.5,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  marginLeft: 'auto',
                }}
              >
                {prims.capsules} capsule{prims.capsules !== 1 ? 's' : ''}
                {prims.spheres > 0 && ` + ${prims.spheres} sphere${prims.spheres !== 1 ? 's' : ''}`}
                {' + '}{prims.unions} union{prims.unions !== 1 ? 's' : ''}
              </span>

              <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>
                {isExpanded ? '\u25B2' : '\u25BC'}
              </span>
            </div>

            {/* GLSL Source */}
            {isExpanded && (
              <pre
                style={{
                  margin: 0,
                  padding: '1rem',
                  background: '#0a0a0a',
                  borderTop: '1px solid #222',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  overflowX: 'auto',
                }}
              >
                {highlightGlsl(source.trim())}
              </pre>
            )}
          </OrnateFrame>
        );
      })}
    </div>
  );
}
