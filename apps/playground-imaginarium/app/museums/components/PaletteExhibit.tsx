'use client';

import { DEFAULT_PALETTES, LANGUAGE_HUES } from '@dendrovia/imaginarium/fallbacks';
import { hexToOklch } from '@dendrovia/imaginarium/utils/color';
import { OrnateFrame } from '@dendrovia/oculus';
import { useState } from 'react';

const SWATCH_KEYS = ['primary', 'secondary', 'accent', 'background', 'glow'] as const;

function moodColor(mood: string): string {
  if (mood === 'warm') return '#ff6b4a';
  if (mood === 'cool') return '#4dabf7';
  return '#888';
}

export default function PaletteExhibit() {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const languages = Array.from(DEFAULT_PALETTES.keys());

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {languages.map((lang) => {
          const palette = DEFAULT_PALETTES.get(lang)!;
          const hue = LANGUAGE_HUES[lang];
          const isSelected = selectedLanguage === lang;

          return (
            <OrnateFrame
              key={lang}
              pillar="imaginarium"
              variant="panel"
              onClick={() => setSelectedLanguage(isSelected ? null : lang)}
              style={{
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                background: '#111',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{lang}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {hue !== undefined && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        background: '#222',
                        fontFamily: 'var(--font-geist-mono), monospace',
                      }}
                    >
                      {hue}&deg;
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      background: '#222',
                      color: moodColor(palette.mood),
                    }}
                  >
                    {palette.mood}
                  </span>
                </div>
              </div>

              {/* Swatch band */}
              <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden' }}>
                {SWATCH_KEYS.map((key) => (
                  <div
                    key={key}
                    style={{
                      flex: 1,
                      height: 40,
                      background: palette[key],
                    }}
                  />
                ))}
              </div>

              {/* Hex labels */}
              <div
                style={{
                  display: 'flex',
                  marginTop: '0.35rem',
                  gap: '0.15rem',
                }}
              >
                {SWATCH_KEYS.map((key) => (
                  <span
                    key={key}
                    style={{
                      flex: 1,
                      fontSize: '0.6rem',
                      fontFamily: 'var(--font-geist-mono), monospace',
                      opacity: 0.6,
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {palette[key]}
                  </span>
                ))}
              </div>
            </OrnateFrame>
          );
        })}
      </div>

      {/* Expanded detail panel */}
      {selectedLanguage &&
        (() => {
          const palette = DEFAULT_PALETTES.get(selectedLanguage)!;
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
                {selectedLanguage} — OKLCH Color Space
              </h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {SWATCH_KEYS.map((key) => {
                  const hex = palette[key];
                  const oklch = hexToOklch(hex);
                  return (
                    <div key={key} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          background: hex,
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          border: '1px solid #333',
                        }}
                      />
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          marginBottom: '0.25rem',
                        }}
                      >
                        {key}
                      </div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          fontFamily: 'var(--font-geist-mono), monospace',
                          opacity: 0.7,
                        }}
                      >
                        {hex}
                      </div>
                      <div
                        style={{
                          fontSize: '0.6rem',
                          fontFamily: 'var(--font-geist-mono), monospace',
                          opacity: 0.5,
                          marginTop: '0.15rem',
                        }}
                      >
                        L:{oklch.L.toFixed(2)} C:{oklch.C.toFixed(2)} H:{oklch.h.toFixed(0)}&deg;
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
