/**
 * CommitClassifier — Three-tier commit message classification
 *
 * Cascade: conventional-commits parse → keyword regex → fallback
 */

export type CommitType =
  | 'bug-fix'
  | 'feature'
  | 'refactor'
  | 'docs'
  | 'test'
  | 'performance'
  | 'merge'
  | 'revert'
  | 'dependency'
  | 'breaking-change'
  | 'chore'
  | 'style'
  | 'maintenance';

export interface ClassifiedCommit {
  type: CommitType;
  scope?: string;
  isBreaking: boolean;
  confidence: 'high' | 'medium' | 'low';
}

// Conventional commit regex: type(scope)!: subject
const CONVENTIONAL_RE = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)/;

const CONVENTIONAL_TYPE_MAP: Record<string, CommitType> = {
  fix: 'bug-fix',
  feat: 'feature',
  refactor: 'refactor',
  docs: 'docs',
  test: 'test',
  perf: 'performance',
  revert: 'revert',
  chore: 'chore',
  style: 'style',
  build: 'chore',
  ci: 'chore',
};

// Keyword patterns ordered by specificity (first match wins)
const KEYWORD_PATTERNS: [RegExp, CommitType][] = [
  [/\bMerge\s+(pull request|branch|remote)/i, 'merge'],
  [/\brevert\b|\bundo\b|\brollback\b/i, 'revert'],
  [/\bbreaking\b|\bBREAKING[- ]CHANGE\b|\bmigrat(e|ion)\b/i, 'breaking-change'],
  [/\bfix(e[sd])?\b|\bbug\b|\bpatch\b|\bhotfix\b|\bissue\b|\bresolve[sd]?\b/i, 'bug-fix'],
  [/\bfeat(ure)?\b|\badd(ed|s|ing)?\b|\bimplement(ed|s)?\b|\bcreate[sd]?\b|\bintroduce[sd]?\b/i, 'feature'],
  [/\brefactor(ed|s|ing)?\b|\brestructur(e|ed|ing)\b|\breorganiz(e|ed|ing)\b|\bclean(ed|s|up)?\b/i, 'refactor'],
  [/\bdoc(s|umentation)?\b|\breadme\b|\bcomment(s|ed)?\b|\bexplain(ed|s)?\b/i, 'docs'],
  [/\btest(s|ing|ed)?\b|\bspec\b|\bassert(ion)?\b|\bcoverage\b|\bmock(s|ed)?\b/i, 'test'],
  [/\bperf(ormance)?\b|\bspeed\b|\boptimiz(e|ed|ation)\b|\bcache[sd]?\b|\bfast(er)?\b/i, 'performance'],
  [/\bbump(ed|s)?\b|\bupgrad(e|ed)\b|\bupdate.*version\b|\bdeps?\b|\bdependenc(y|ies)\b/i, 'dependency'],
  [/\bstyle[sd]?\b|\bformat(ted|ting)?\b|\blint(ed|ing)?\b|\bwhitespace\b|\bprettier\b/i, 'style'],
  [/\bchore\b|\bbuild\b|\bci\b|\brelease\b|\bconfig(ure)?\b/i, 'chore'],
];

/**
 * Classify a commit message into a type using a three-tier cascade.
 */
export function classifyCommit(message: string): ClassifiedCommit {
  const firstLine = message.split('\n')[0].trim();

  // Tier 1: Conventional commit format
  const conventional = parseConventional(firstLine);
  if (conventional) return conventional;

  // Tier 2: Keyword matching
  const keyword = matchKeywords(firstLine);
  if (keyword) return keyword;

  // Tier 3: Fallback — check the full message body
  const bodyMatch = matchKeywords(message);
  if (bodyMatch) return { ...bodyMatch, confidence: 'low' };

  return { type: 'maintenance', isBreaking: false, confidence: 'low' };
}

function parseConventional(line: string): ClassifiedCommit | null {
  const match = CONVENTIONAL_RE.exec(line);
  if (!match) return null;

  const [, rawType, scope, bang] = match;
  const type = CONVENTIONAL_TYPE_MAP[rawType.toLowerCase()];
  if (!type) return null;

  const isBreaking = !!bang;

  return {
    type: isBreaking ? 'breaking-change' : type,
    scope: scope || undefined,
    isBreaking,
    confidence: 'high',
  };
}

function matchKeywords(text: string): ClassifiedCommit | null {
  for (const [pattern, type] of KEYWORD_PATTERNS) {
    if (pattern.test(text)) {
      return {
        type,
        isBreaking: type === 'breaking-change',
        confidence: 'medium',
      };
    }
  }
  return null;
}

