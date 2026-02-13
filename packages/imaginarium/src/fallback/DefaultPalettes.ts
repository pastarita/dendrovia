/**
 * Hand-tuned OKLCH-derived fallback palettes for 12+ languages.
 * These provide instant "Default Beautiful" output in <1ms.
 */

import type { ProceduralPalette } from '@dendrovia/shared';

export const DEFAULT_PALETTES: Map<string, ProceduralPalette> = new Map([
  ['typescript', {
    primary: '#3178c6',
    secondary: '#235a9e',
    accent: '#66b2ff',
    background: '#0a1628',
    glow: '#4d9fff',
    mood: 'cool',
  }],
  ['javascript', {
    primary: '#f0db4f',
    secondary: '#c4a819',
    accent: '#ffe066',
    background: '#1a1800',
    glow: '#ffd633',
    mood: 'warm',
  }],
  ['rust', {
    primary: '#ce422b',
    secondary: '#a3341f',
    accent: '#ff6b4a',
    background: '#1a0a07',
    glow: '#ff4d2e',
    mood: 'warm',
  }],
  ['python', {
    primary: '#3572a5',
    secondary: '#ffd43b',
    accent: '#4dabf7',
    background: '#0a1420',
    glow: '#339af0',
    mood: 'cool',
  }],
  ['go', {
    primary: '#00add8',
    secondary: '#007d9c',
    accent: '#41d1ff',
    background: '#001a22',
    glow: '#22c7e8',
    mood: 'cool',
  }],
  ['java', {
    primary: '#b07219',
    secondary: '#8c5a13',
    accent: '#e6a030',
    background: '#1a1005',
    glow: '#cc8f20',
    mood: 'warm',
  }],
  ['c', {
    primary: '#555555',
    secondary: '#a8b9cc',
    accent: '#88aacc',
    background: '#0a0e14',
    glow: '#6699bb',
    mood: 'cool',
  }],
  ['cpp', {
    primary: '#f34b7d',
    secondary: '#b03060',
    accent: '#ff6b99',
    background: '#1a0812',
    glow: '#ff4d88',
    mood: 'warm',
  }],
  ['ruby', {
    primary: '#cc342d',
    secondary: '#991f1f',
    accent: '#ff5555',
    background: '#1a0808',
    glow: '#ff3333',
    mood: 'warm',
  }],
  ['html', {
    primary: '#e34c26',
    secondary: '#b83c1f',
    accent: '#ff6b45',
    background: '#1a0c07',
    glow: '#ff5533',
    mood: 'warm',
  }],
  ['css', {
    primary: '#563d7c',
    secondary: '#3f2d5c',
    accent: '#7e57c2',
    background: '#0e0818',
    glow: '#6a3faa',
    mood: 'cool',
  }],
  ['json', {
    primary: '#40a070',
    secondary: '#2d7050',
    accent: '#55cc88',
    background: '#081a10',
    glow: '#44bb77',
    mood: 'cool',
  }],
  ['default', {
    primary: '#8b5cf6',
    secondary: '#6d28d9',
    accent: '#a78bfa',
    background: '#0f0720',
    glow: '#7c3aed',
    mood: 'cool',
  }],
]);

export function getDefaultPalette(language: string): ProceduralPalette {
  return DEFAULT_PALETTES.get(language.toLowerCase()) ?? DEFAULT_PALETTES.get('default')!;
}

// Language -> OKLCH base hue mapping (degrees)
export const LANGUAGE_HUES: Record<string, number> = {
  typescript: 250,
  javascript: 70,
  rust: 20,
  python: 220,
  go: 195,
  java: 40,
  c: 220,
  cpp: 340,
  ruby: 10,
  html: 25,
  css: 280,
  json: 155,
  markdown: 200,
  yaml: 180,
  toml: 45,
  shell: 120,
  sql: 210,
  graphql: 320,
  swift: 15,
  kotlin: 265,
  scala: 5,
  elixir: 290,
  haskell: 270,
};

export function getLanguageHue(language: string): number {
  return LANGUAGE_HUES[language.toLowerCase()] ?? 270; // Default: purple
}
