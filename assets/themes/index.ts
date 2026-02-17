/**
 * Dendrovia Theme Index
 *
 * Programmatic access to all six pillar themes.
 * Each theme embodies the archetypal essence of its pillar.
 */

export interface PillarTheme {
  id: string;
  name: string;
  title: string;
  description: string;
  mood: string;
  bestFor: string[];
  palette: {
    primary: string;
    background: string;
    accent: string;
    highlight: string;
    shadow: string;
  };
  themePath: string;
}

export const CHRONOS: PillarTheme = {
  id: 'chronos',
  name: 'Chronos Dark - The Archaeologist',
  title: 'The Archaeologist',
  description: 'Weathered earth tones embodying archaeological discovery and temporal stratification',
  mood: 'Reverent discovery, patient stratification, timeless wisdom',
  bestFor: ['Git operations', 'Version control', 'Historical analysis', 'Documentation'],
  palette: {
    primary: '#d4a574',
    background: '#2a1f16',
    accent: '#dda15e',
    highlight: '#f5ead6',
    shadow: '#4a3822',
  },
  themePath: './chronos-dark.json',
};

export const IMAGINARIUM: PillarTheme = {
  id: 'imaginarium',
  name: 'Imaginarium Dark - The Compiler',
  title: 'The Compiler',
  description: 'Ethereal violets and alchemical purples for creative transformation',
  mood: 'Creative wonder, transformative revelation, mathematical beauty',
  bestFor: ['Shader coding', 'Creative work', 'Generative art', 'Procedural design'],
  palette: {
    primary: '#c6a0f6',
    background: '#1a0f1f',
    accent: '#da9ef7',
    highlight: '#f8f0ff',
    shadow: '#4a2d5f',
  },
  themePath: './imaginarium-dark.json',
};

export const ARCHITECTUS: PillarTheme = {
  id: 'architectus',
  name: 'Architectus Dark - The Renderer',
  title: 'The Renderer',
  description: 'Computational blues presenting pristine geometric clarity',
  mood: 'Sublime computational order, architectural transcendence, geometric revelation',
  bestFor: ['3D rendering', 'WebGPU programming', 'Graphics code', 'Spatial computing'],
  palette: {
    primary: '#8ab4f8',
    background: '#0d1824',
    accent: '#5dbaff',
    highlight: '#e8f4ff',
    shadow: '#1e3a5f',
  },
  themePath: './architectus-dark.json',
};

export const LUDUS: PillarTheme = {
  id: 'ludus',
  name: 'Ludus Dark - The Mechanics',
  title: 'The Mechanics',
  description: 'Vibrant greens conveying tactical gameplay and energetic growth',
  mood: 'Playful strategic excitement, tactical engagement, game-like wonder',
  bestFor: ['Game logic', 'State machines', 'Rules engines', 'Interactive systems'],
  palette: {
    primary: '#81c995',
    background: '#1a2820',
    accent: '#5ff59f',
    highlight: '#d4f5e3',
    shadow: '#2d4d3a',
  },
  themePath: './ludus-dark.json',
};

export const OCULUS: PillarTheme = {
  id: 'oculus',
  name: 'Oculus Dark - The Interface',
  title: 'The Interface',
  description: 'Warm amber promoting focused observational awareness',
  mood: 'Gentle mindful awareness, insightful clarity, observational wisdom',
  bestFor: ['UI/UX work', 'Component design', 'Interface development', 'Accessibility'],
  palette: {
    primary: '#f5a97f',
    background: '#1f1410',
    accent: '#ffb366',
    highlight: '#fff5ed',
    shadow: '#5f3d2d',
  },
  themePath: './oculus-dark.json',
};

export const OPERATUS: PillarTheme = {
  id: 'operatus',
  name: 'Operatus Dark - The Infrastructure',
  title: 'The Infrastructure',
  description: 'Industrial greys embodying reliable foundational strength',
  mood: 'Reliable quiet strength, dependable operation, engineered excellence',
  bestFor: ['Infrastructure code', 'DevOps', 'Configuration', 'System administration'],
  palette: {
    primary: '#9ca3af',
    background: '#1c1f23',
    accent: '#60a5fa',
    highlight: '#e5e7eb',
    shadow: '#374151',
  },
  themePath: './operatus-dark.json',
};

/**
 * All six pillar themes as array for iteration
 */
export const ALL_THEMES: PillarTheme[] = [CHRONOS, IMAGINARIUM, ARCHITECTUS, LUDUS, OCULUS, OPERATUS];

/**
 * Theme lookup by pillar ID
 */
export const THEMES_BY_ID: Record<string, PillarTheme> = {
  chronos: CHRONOS,
  imaginarium: IMAGINARIUM,
  architectus: ARCHITECTUS,
  ludus: LUDUS,
  oculus: OCULUS,
  operatus: OPERATUS,
};

/**
 * Get theme recommendation based on file type or work context
 */
export function recommendTheme(context: string): PillarTheme {
  const lowerContext = context.toLowerCase();

  // Git/version control
  if (
    lowerContext.includes('git') ||
    lowerContext.includes('history') ||
    lowerContext.includes('.md') ||
    lowerContext.includes('docs')
  ) {
    return CHRONOS;
  }

  // Shader/graphics
  if (
    lowerContext.includes('shader') ||
    lowerContext.includes('.glsl') ||
    lowerContext.includes('.wgsl') ||
    lowerContext.includes('creative')
  ) {
    return IMAGINARIUM;
  }

  // 3D/rendering
  if (
    lowerContext.includes('render') ||
    lowerContext.includes('webgpu') ||
    lowerContext.includes('3d') ||
    lowerContext.includes('graphics')
  ) {
    return ARCHITECTUS;
  }

  // Game logic
  if (
    lowerContext.includes('game') ||
    lowerContext.includes('logic') ||
    lowerContext.includes('state') ||
    lowerContext.includes('mechanic')
  ) {
    return LUDUS;
  }

  // UI/Interface
  if (
    lowerContext.includes('ui') ||
    lowerContext.includes('component') ||
    lowerContext.includes('.tsx') ||
    lowerContext.includes('interface')
  ) {
    return OCULUS;
  }

  // Infrastructure
  if (
    lowerContext.includes('config') ||
    lowerContext.includes('infra') ||
    lowerContext.includes('devops') ||
    lowerContext.includes('.yaml')
  ) {
    return OPERATUS;
  }

  // Default to CHRONOS for general work
  return CHRONOS;
}

/**
 * Export theme colors for use in terminal emulators
 */
export function exportForTerminal(theme: PillarTheme): {
  background: string;
  foreground: string;
  cursor: string;
  selection: string;
  ansi: string[];
} {
  // This would need to be expanded based on full theme JSON
  return {
    background: theme.palette.background,
    foreground: theme.palette.highlight,
    cursor: theme.palette.accent,
    selection: `${theme.palette.primary}40`, // with alpha
    ansi: [
      theme.palette.shadow,
      '#ff6b6b', // red (approximation)
      theme.palette.primary,
      theme.palette.accent,
      theme.palette.primary,
      theme.palette.accent,
      theme.palette.primary,
      theme.palette.highlight,
    ],
  };
}
