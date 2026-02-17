/**
 * PR Heraldry Module — Dendrovia
 *
 * Heraldic classification system for pull requests.
 * Maps PR metadata to a formal coat of arms with
 * domains, tinctures, charges, magnitude, and mottos.
 */

// Analysis
export {
  analyzeForHeraldry,
  type BranchAnalysis,
  countCharges,
  detectDomains,
  runSupporter,
} from './analyzer.js';
// Symbols and mottos
export {
  PILLAR_NAMES,
  PILLAR_SYMBOLS,
  selectMotto,
} from './emoji.js';
// Mermaid diagram generation
export {
  generateDomainDiagram,
  generateHeraldryDiagram,
  generatePipelineDiagram,
} from './mermaid.js';
// Types and constants
export {
  CHARGE_KEYWORDS,
  type ChargeMapping,
  type ChargeType,
  COMMIT_TYPE_CHARGES,
  computeMagnitude,
  DOMAIN_FILE_PATTERNS,
  DOMAIN_TINCTURES,
  type Domain,
  getDivisionForDomainCount,
  type HeraldryTincture,
  MAGNITUDE_SYMBOLS,
  type Magnitude,
  type MagnitudeFactors,
  type PRCoatOfArms,
  type ShieldDivision,
  SUPPORTER_LABELS,
  type Supporter,
  type SupporterStatus,
} from './types.js';
