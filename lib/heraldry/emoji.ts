/**
 * Symbol and Motto Mappings for PR Heraldry
 */

import type { Magnitude } from './types.js';

// ============================================================
// Motto Registry
// ============================================================

interface Motto {
  latin: string;
  translation: string;
}

const MOTTO_TABLE: Record<string, Record<'formal' | 'standard' | 'casual', Motto>> = {
  feat: {
    formal:   { latin: 'Per aspera ad astra',    translation: 'Through hardship to the stars' },
    standard: { latin: 'Innovatio per iterationem', translation: 'Innovation through iteration' },
    casual:   { latin: 'Nova horizonta',          translation: 'New horizons' },
  },
  fix: {
    formal:   { latin: 'Correctio fundamentum',  translation: 'Correction is the foundation' },
    standard: { latin: 'Stabilitas restituta',    translation: 'Stability restored' },
    casual:   { latin: 'Via purgata',             translation: 'The path made clear' },
  },
  refactor: {
    formal:   { latin: 'Mutatio in melius',       translation: 'Change for the better' },
    standard: { latin: 'Per mutationem refinatum', translation: 'Refined through change' },
    casual:   { latin: 'Structura renovata',      translation: 'Structure renewed' },
  },
  perf: {
    formal:   { latin: 'Velocitas vincit',        translation: 'Speed conquers' },
    standard: { latin: 'Celer et certus',         translation: 'Swift and sure' },
    casual:   { latin: 'Celeritas elevata',       translation: 'Performance elevated' },
  },
  docs: {
    formal:   { latin: 'Scientia potentia est',   translation: 'Knowledge is power' },
    standard: { latin: 'Scientia conservata',     translation: 'Knowledge preserved' },
    casual:   { latin: 'Sapientia scripta',       translation: 'Wisdom documented' },
  },
  test: {
    formal:   { latin: 'Veritas in probatione',   translation: 'Truth in testing' },
    standard: { latin: 'Qualitas confirmata',     translation: 'Quality assured' },
    casual:   { latin: 'Aequilibrium servatum',   translation: 'Balance maintained' },
  },
  chore: {
    formal:   { latin: 'Fabrica fundamenta',      translation: 'The foundations of craft' },
    standard: { latin: 'Fundamentum firmatum',    translation: 'Foundation strengthened' },
    casual:   { latin: 'Instrumenta artis',       translation: 'Tools of the trade' },
  },
  infra: {
    formal:   { latin: 'Arx inconcussa',          translation: 'The unshaken fortress' },
    standard: { latin: 'Infrastructura munita',   translation: 'Infrastructure fortified' },
    casual:   { latin: 'Systemata tuta',          translation: 'Systems secured' },
  },
  style: {
    formal:   { latin: 'Forma sequitur functionem', translation: 'Form follows function' },
    standard: { latin: 'Elegantia in ordine',     translation: 'Elegance in order' },
    casual:   { latin: 'Pulchritudo renovata',    translation: 'Beauty renewed' },
  },
};

const UNIVERSAL_FALLBACKS: Motto[] = [
  { latin: 'Iterandum est',           translation: 'It must be iterated' },
  { latin: 'Ad usum, non ad fidem',   translation: 'For use, not for belief' },
  { latin: 'Probamus, non credimus',  translation: 'We test, we do not believe' },
];

/**
 * Select a motto based on commit type and magnitude.
 */
export function selectMotto(commitType: string, magnitude: Magnitude): Motto {
  const entry = MOTTO_TABLE[commitType];
  if (!entry) return UNIVERSAL_FALLBACKS[0];

  switch (magnitude) {
    case 'major':
    case 'epic':
      return entry.formal;
    case 'moderate':
      return entry.standard;
    case 'trivial':
    case 'minor':
    default:
      return entry.casual;
  }
}

// ============================================================
// Pillar Display Symbols
// ============================================================

export const PILLAR_SYMBOLS: Record<string, string> = {
  chronos:      'hourglass',
  imaginarium:  'palette',
  architectus:  'cube',
  ludus:        'sword',
  oculus:       'eye',
  operatus:     'gear',
};

export const PILLAR_NAMES: Record<string, string> = {
  chronos:      'CHRONOS — The Archaeologist',
  imaginarium:  'IMAGINARIUM — The Alchemist',
  architectus:  'ARCHITECTUS — The Architect',
  ludus:        'LUDUS — The Game Master',
  oculus:       'OCULUS — The Oracle',
  operatus:     'OPERATUS — The Engineer',
};
