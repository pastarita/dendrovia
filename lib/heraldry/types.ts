/**
 * PR Heraldry Type System — Dendrovia
 *
 * Defines the complete type system for heraldic PR classification:
 * domains, tinctures, charges, shields, magnitudes, supporters, mottos.
 */

// ============================================================
// SECTION 1: Domain System (Dendrovia Six-Pillar Architecture)
// ============================================================

export type Domain =
  | 'chronos'
  | 'imaginarium'
  | 'architectus'
  | 'ludus'
  | 'oculus'
  | 'operatus'
  | 'shared'
  | 'app'
  | 'docs'
  | 'infra';

export const DOMAIN_FILE_PATTERNS: Record<Domain, RegExp[]> = {
  chronos: [/^packages\/chronos\//],
  imaginarium: [/^packages\/imaginarium\//],
  architectus: [/^packages\/architectus\//, /^packages\/dendrovia-engine\//],
  ludus: [/^packages\/ludus\//],
  oculus: [/^packages\/oculus\//, /^packages\/ui\//],
  operatus: [/^packages\/operatus\//, /^scripts\//],
  shared: [/^packages\/shared\//],
  app: [/^apps\//],
  docs: [/^docs\//],
  infra: [/^turbo\.json$/, /^\.github\//, /\.config\.\w+$/],
};

// ============================================================
// SECTION 2: Heraldic Tinctures
// ============================================================

export interface HeraldryTincture {
  name: string;
  hex: string;
  textColor: string; // Accessibility: contrasting text color
  type: 'metal' | 'color';
}

export const DOMAIN_TINCTURES: Record<Domain, HeraldryTincture> = {
  chronos: { name: 'Amber', hex: '#c77b3f', textColor: '#000000', type: 'color' },
  imaginarium: { name: 'Purpure', hex: '#A855F7', textColor: '#ffffff', type: 'color' },
  architectus: { name: 'Azure', hex: '#3B82F6', textColor: '#ffffff', type: 'color' },
  ludus: { name: 'Gules', hex: '#EF4444', textColor: '#ffffff', type: 'color' },
  oculus: { name: 'Vert', hex: '#22C55E', textColor: '#000000', type: 'color' },
  operatus: { name: 'Sable', hex: '#1F2937', textColor: '#ffffff', type: 'color' },
  shared: { name: 'Or', hex: '#FFD700', textColor: '#000000', type: 'metal' },
  app: { name: 'Argent', hex: '#E5E7EB', textColor: '#000000', type: 'metal' },
  docs: { name: 'Tenné', hex: '#CD853F', textColor: '#000000', type: 'color' },
  infra: { name: 'Gules', hex: '#EF4444', textColor: '#ffffff', type: 'color' },
};

// ============================================================
// SECTION 3: Charges (Commit Type Mapping)
// ============================================================

export type ChargeType = 'mullet' | 'cross' | 'bend' | 'eagle' | 'book' | 'scales' | 'hammer' | 'tower' | 'chevron';

export interface ChargeMapping {
  charge: ChargeType;
  symbol: string;
  blazon: string;
}

export const COMMIT_TYPE_CHARGES: Record<string, ChargeMapping> = {
  feat: { charge: 'mullet', symbol: 'star', blazon: 'a mullet' },
  fix: { charge: 'cross', symbol: 'cross', blazon: 'a cross' },
  refactor: { charge: 'bend', symbol: 'diagonal', blazon: 'a bend' },
  perf: { charge: 'eagle', symbol: 'eagle', blazon: 'an eagle displayed' },
  docs: { charge: 'book', symbol: 'book', blazon: 'a book open' },
  test: { charge: 'scales', symbol: 'scales', blazon: 'scales of justice' },
  chore: { charge: 'hammer', symbol: 'hammer', blazon: 'a hammer' },
  infra: { charge: 'tower', symbol: 'tower', blazon: 'a tower' },
  style: { charge: 'chevron', symbol: 'chevron', blazon: 'a chevron' },
};

// Keyword fallback for non-conventional commit messages
export const CHARGE_KEYWORDS: [RegExp, string][] = [
  [/\bfix(e[sd])?\b|\bbug\b|\bpatch\b|\bhotfix\b/i, 'fix'],
  [/\bfeat(ure)?\b|\badd(ed|s|ing)?\b|\bimplement/i, 'feat'],
  [/\brefactor|\brestructur|\bclean/i, 'refactor'],
  [/\bdoc(s|umentation)?\b|\breadme\b/i, 'docs'],
  [/\btest(s|ing)?\b|\bspec\b/i, 'test'],
  [/\bperf(ormance)?\b|\boptimiz/i, 'perf'],
];

// ============================================================
// SECTION 4: Shield Divisions
// ============================================================

export type ShieldDivision = 'plain' | 'per-pale' | 'per-chevron' | 'per-quarterly' | 'party-per-cross' | 'gyronny';

export function getDivisionForDomainCount(count: number): ShieldDivision {
  if (count <= 1) return 'plain';
  if (count === 2) return 'per-pale';
  if (count === 3) return 'per-chevron';
  if (count === 4) return 'per-quarterly';
  if (count <= 7) return 'party-per-cross';
  return 'gyronny';
}

// ============================================================
// SECTION 5: Magnitude
// ============================================================

export type Magnitude = 'trivial' | 'minor' | 'moderate' | 'major' | 'epic';

export const MAGNITUDE_SYMBOLS: Record<Magnitude, string> = {
  trivial: '+',
  minor: '*',
  moderate: '**',
  major: '***',
  epic: '****',
};

export interface MagnitudeFactors {
  fileCount: number;
  lineCount: number;
  domainCount: number;
  hasBreakingChanges: boolean;
  hasNewDependencies: boolean;
  hasMigrations: boolean;
  hasSchemaChanges: boolean;
}

export function computeMagnitude(factors: MagnitudeFactors): { magnitude: Magnitude; score: number } {
  let score = 0;
  score += Math.min(Math.ceil(factors.fileCount / 5), 5);
  score += Math.min(Math.ceil(factors.lineCount / 200), 5);
  score += Math.min(factors.domainCount, 4);
  if (factors.hasBreakingChanges) score += 3;
  if (factors.hasNewDependencies) score += 1;
  if (factors.hasMigrations) score += 2;
  if (factors.hasSchemaChanges) score += 2;

  if (score <= 4) return { magnitude: 'trivial', score };
  if (score <= 8) return { magnitude: 'minor', score };
  if (score <= 12) return { magnitude: 'moderate', score };
  if (score <= 18) return { magnitude: 'major', score };
  return { magnitude: 'epic', score };
}

// ============================================================
// SECTION 6: Supporters
// ============================================================

export type SupporterStatus = 'pass' | 'fail' | 'warn' | 'skip';

export const SUPPORTER_LABELS: Record<SupporterStatus, string> = {
  pass: 'pass',
  fail: 'FAIL',
  warn: 'WARN',
  skip: 'skip',
};

export interface Supporter {
  type: 'typecheck' | 'lint' | 'test' | 'build';
  status: SupporterStatus;
  details?: string;
}

// ============================================================
// SECTION 7: Coat of Arms Composition
// ============================================================

export interface PRCoatOfArms {
  branch: string;
  title: string;

  shield: {
    domains: Domain[];
    division: ShieldDivision;
    primaryTincture: HeraldryTincture;
    secondaryTincture?: HeraldryTincture;
  };

  charges: Array<{
    type: ChargeType;
    symbol: string;
    count: number;
    commitType: string;
  }>;

  supporters: Supporter[];

  crest: {
    magnitude: Magnitude;
    symbol: string;
    score: number;
    fileCount: number;
    linesAdded: number;
    linesRemoved: number;
  };

  motto: string;
  mottoTranslation?: string;
}
