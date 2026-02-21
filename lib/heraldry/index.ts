/**
 * PR Heraldry Module — Dendrovia
 *
 * Heraldic classification system for pull requests.
 * Maps PR metadata to a formal coat of arms with
 * domains, tinctures, charges, magnitude, and mottos.
 */

// Types and constants
export {
  type Domain,
  type HeraldryTincture,
  type ChargeType,
  type ChargeMapping,
  type ShieldDivision,
  type Magnitude,
  type MagnitudeFactors,
  type SupporterStatus,
  type Supporter,
  type PRCoatOfArms,
  DOMAIN_FILE_PATTERNS,
  DOMAIN_TINCTURES,
  COMMIT_TYPE_CHARGES,
  CHARGE_KEYWORDS,
  MAGNITUDE_SYMBOLS,
  SUPPORTER_LABELS,
  getDivisionForDomainCount,
  computeMagnitude,
} from './types';

// Analysis
export {
  type BranchAnalysis,
  analyzeForHeraldry,
  detectDomains,
  countCharges,
  runSupporter,
} from './analyzer';

// Symbols and mottos
export {
  selectMotto,
  PILLAR_SYMBOLS,
  PILLAR_NAMES,
} from './emoji';

// Mermaid diagram generation
export {
  generateDomainDiagram,
  generatePipelineDiagram,
  generateHeraldryDiagram,
} from './mermaid';
