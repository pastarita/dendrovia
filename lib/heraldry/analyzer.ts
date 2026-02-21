/**
 * Branch Analyzer — Extracts heraldry metadata from git state
 *
 * Parses git log/diff output to produce the data needed
 * for Coat of Arms generation.
 */

import {
  type Domain,
  type ChargeType,
  type Magnitude,
  type MagnitudeFactors,
  type Supporter,
  type SupporterStatus,
  type PRCoatOfArms,
  DOMAIN_FILE_PATTERNS,
  DOMAIN_TINCTURES,
  COMMIT_TYPE_CHARGES,
  CHARGE_KEYWORDS,
  MAGNITUDE_SYMBOLS,
  getDivisionForDomainCount,
  computeMagnitude,
} from './types';
import { selectMotto } from './emoji';

// Conventional commit regex
const CONVENTIONAL_RE = /^(\w+)(?:\([^)]+\))?!?:\s*/;

export interface BranchAnalysis {
  branch: string;
  commits: Array<{ hash: string; message: string }>;
  filesChanged: string[];
  linesAdded: number;
  linesRemoved: number;
}

/**
 * Analyze a branch and produce a complete Coat of Arms.
 */
export function analyzeForHeraldry(analysis: BranchAnalysis): PRCoatOfArms {
  const domains = detectDomains(analysis.filesChanged);
  const chargeCounts = countCharges(analysis.commits.map(c => c.message));
  const primaryCharge = chargeCounts[0];

  const factors: MagnitudeFactors = {
    fileCount: analysis.filesChanged.length,
    lineCount: analysis.linesAdded + analysis.linesRemoved,
    domainCount: domains.length,
    hasBreakingChanges: analysis.commits.some(c => /BREAKING|breaking/i.test(c.message)),
    hasNewDependencies: analysis.commits.some(c => /deps?|dependenc|upgrade|bump/i.test(c.message)),
    hasMigrations: analysis.commits.some(c => /migrat/i.test(c.message)),
    hasSchemaChanges: analysis.commits.some(c => /schema/i.test(c.message)),
  };

  const { magnitude, score } = computeMagnitude(factors);
  const division = getDivisionForDomainCount(domains.length);
  const primaryDomain = domains[0] || 'shared';
  const primaryTincture = DOMAIN_TINCTURES[primaryDomain];
  const secondaryTincture = domains.length > 1 ? DOMAIN_TINCTURES[domains[1]] : undefined;

  const motto = selectMotto(primaryCharge?.commitType || 'chore', magnitude);

  return {
    branch: analysis.branch,
    title: analysis.branch.replace(/^(feat|fix|refactor|docs|chore|epic)\//, ''),

    shield: {
      domains,
      division,
      primaryTincture,
      secondaryTincture,
    },

    charges: chargeCounts,

    supporters: [], // Populated by caller after running checks

    crest: {
      magnitude,
      symbol: MAGNITUDE_SYMBOLS[magnitude],
      score,
      fileCount: analysis.filesChanged.length,
      linesAdded: analysis.linesAdded,
      linesRemoved: analysis.linesRemoved,
    },

    motto: motto.latin,
    mottoTranslation: motto.translation,
  };
}

/**
 * Detect which domains are touched by the changed files.
 */
export function detectDomains(files: string[]): Domain[] {
  const domainSet = new Set<Domain>();

  for (const file of files) {
    for (const [domain, patterns] of Object.entries(DOMAIN_FILE_PATTERNS)) {
      if (patterns.some(p => p.test(file))) {
        domainSet.add(domain as Domain);
        break; // First match wins per file
      }
    }
  }

  return Array.from(domainSet);
}

/**
 * Count commit type charges from commit messages.
 */
export function countCharges(
  messages: string[],
): Array<{ type: ChargeType; symbol: string; count: number; commitType: string }> {
  const counts = new Map<string, number>();

  for (const msg of messages) {
    const commitType = detectCommitType(msg);
    counts.set(commitType, (counts.get(commitType) || 0) + 1);
  }

  const charges = [];
  for (const [commitType, count] of counts) {
    const mapping = COMMIT_TYPE_CHARGES[commitType];
    if (mapping) {
      charges.push({
        type: mapping.charge,
        symbol: mapping.symbol,
        count,
        commitType,
      });
    }
  }

  // Sort by count descending (primary charge first)
  charges.sort((a, b) => b.count - a.count);
  return charges;
}

/**
 * Detect commit type from a message.
 * Tries conventional commit format first, then keyword fallback.
 */
function detectCommitType(message: string): string {
  // Conventional commit
  const match = CONVENTIONAL_RE.exec(message);
  if (match && COMMIT_TYPE_CHARGES[match[1]]) {
    return match[1];
  }

  // Keyword fallback
  for (const [pattern, type] of CHARGE_KEYWORDS) {
    if (pattern.test(message)) return type;
  }

  return 'chore';
}

/**
 * Run a validation check and return a Supporter result.
 */
export async function runSupporter(
  type: Supporter['type'],
  command: string,
  cwd: string,
): Promise<Supporter> {
  try {
    const proc = Bun.spawn(['sh', '-c', command], {
      cwd,
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const exitCode = await proc.exited;
    const status: SupporterStatus = exitCode === 0 ? 'pass' : 'fail';

    return { type, status };
  } catch {
    return { type, status: 'skip', details: 'Command not available' };
  }
}
