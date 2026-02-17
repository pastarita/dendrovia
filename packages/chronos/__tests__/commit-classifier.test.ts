import { describe, expect, test } from 'bun:test';
import { type ClassifiedCommit, classifyCommit, commitFlags } from '../src/classifier/CommitClassifier';

// ---------------------------------------------------------------------------
// Tier 1: Conventional commit format
// ---------------------------------------------------------------------------
describe('classifyCommit — Tier 1 (conventional commits)', () => {
  test('parses "fix(auth): resolve login race condition"', () => {
    const result = classifyCommit('fix(auth): resolve login race condition');
    expect(result.type).toBe('bug-fix');
    expect(result.scope).toBe('auth');
    expect(result.isBreaking).toBe(false);
    expect(result.confidence).toBe('high');
  });

  test('parses "feat(api): add pagination endpoint"', () => {
    const result = classifyCommit('feat(api): add pagination endpoint');
    expect(result.type).toBe('feature');
    expect(result.scope).toBe('api');
    expect(result.confidence).toBe('high');
  });

  test('parses "refactor: simplify auth middleware"', () => {
    const result = classifyCommit('refactor: simplify auth middleware');
    expect(result.type).toBe('refactor');
    expect(result.scope).toBeUndefined();
    expect(result.confidence).toBe('high');
  });

  test('parses "docs: update README"', () => {
    const result = classifyCommit('docs: update README');
    expect(result.type).toBe('docs');
    expect(result.confidence).toBe('high');
  });

  test('parses "test: add unit tests for parser"', () => {
    const result = classifyCommit('test: add unit tests for parser');
    expect(result.type).toBe('test');
    expect(result.confidence).toBe('high');
  });

  test('parses "perf: optimize database queries"', () => {
    const result = classifyCommit('perf: optimize database queries');
    expect(result.type).toBe('performance');
    expect(result.confidence).toBe('high');
  });

  test('parses "revert: undo last migration"', () => {
    const result = classifyCommit('revert: undo last migration');
    expect(result.type).toBe('revert');
    expect(result.confidence).toBe('high');
  });

  test('parses "chore: bump dependencies"', () => {
    const result = classifyCommit('chore: bump dependencies');
    expect(result.type).toBe('chore');
    expect(result.confidence).toBe('high');
  });

  test('parses "style: format with prettier"', () => {
    const result = classifyCommit('style: format with prettier');
    expect(result.type).toBe('style');
    expect(result.confidence).toBe('high');
  });

  test('maps "build:" to chore', () => {
    const result = classifyCommit('build: update webpack config');
    expect(result.type).toBe('chore');
    expect(result.confidence).toBe('high');
  });

  test('maps "ci:" to chore', () => {
    const result = classifyCommit('ci: add GitHub Actions workflow');
    expect(result.type).toBe('chore');
    expect(result.confidence).toBe('high');
  });

  test('handles breaking change via "!" marker', () => {
    const result = classifyCommit('feat(api)!: remove deprecated endpoints');
    expect(result.type).toBe('breaking-change');
    expect(result.isBreaking).toBe(true);
    expect(result.scope).toBe('api');
    expect(result.confidence).toBe('high');
  });

  test('handles breaking fix with "!" marker', () => {
    const result = classifyCommit('fix!: change error response format');
    expect(result.type).toBe('breaking-change');
    expect(result.isBreaking).toBe(true);
    expect(result.confidence).toBe('high');
  });

  test('handles scope with dots/dashes', () => {
    const result = classifyCommit('feat(my-module): add feature');
    expect(result.scope).toBe('my-module');
    expect(result.type).toBe('feature');
  });

  test('unknown conventional type falls through to tier 2', () => {
    // "wip:" is not in the CONVENTIONAL_TYPE_MAP
    const result = classifyCommit('wip: in progress stuff');
    // Should not be 'high' confidence since it doesn't match conventional map
    expect(result.confidence).not.toBe('high');
  });
});

// ---------------------------------------------------------------------------
// Tier 2: Keyword matching
// ---------------------------------------------------------------------------
describe('classifyCommit — Tier 2 (keyword matching)', () => {
  test('detects merge commits', () => {
    const result = classifyCommit('Merge pull request #42 from feature-branch');
    expect(result.type).toBe('merge');
    expect(result.confidence).toBe('medium');
  });

  test('detects merge branch', () => {
    const result = classifyCommit('Merge branch "develop" into main');
    expect(result.type).toBe('merge');
  });

  test('detects revert via keyword', () => {
    const result = classifyCommit('Revert "add broken feature"');
    expect(result.type).toBe('revert');
    expect(result.confidence).toBe('medium');
  });

  test('detects rollback keyword', () => {
    const result = classifyCommit('rollback the database migration');
    expect(result.type).toBe('revert');
  });

  test('detects breaking change keyword', () => {
    const result = classifyCommit('BREAKING CHANGE: new API format');
    expect(result.type).toBe('breaking-change');
    expect(result.isBreaking).toBe(true);
  });

  test('detects migration as breaking change', () => {
    const result = classifyCommit('migrate users table to new schema');
    expect(result.type).toBe('breaking-change');
  });

  test('detects bug-fix keywords', () => {
    const fixes = [
      'Fix memory leak in parser',
      'Fixed crash on startup',
      'bug in the auth module',
      'hotfix for production error',
      'Resolve issue with login',
      'patch security vulnerability',
    ];
    for (const msg of fixes) {
      const result = classifyCommit(msg);
      expect(result.type).toBe('bug-fix');
    }
  });

  test('detects feature keywords', () => {
    const features = [
      'Add dark mode toggle',
      'Implement pagination',
      'Create user dashboard',
      'Introduce caching layer',
      'Added new API endpoint',
    ];
    for (const msg of features) {
      const result = classifyCommit(msg);
      expect(result.type).toBe('feature');
    }
  });

  test('detects refactor keywords', () => {
    const refactors = [
      'Refactor authentication service',
      'Restructure project layout',
      'Reorganize imports',
      'Clean up dead code',
    ];
    for (const msg of refactors) {
      const result = classifyCommit(msg);
      expect(result.type).toBe('refactor');
    }
  });

  test('detects docs keywords', () => {
    const docs = ['Update documentation for API', 'Readme improvements', 'Explain the config options'];
    for (const msg of docs) {
      const result = classifyCommit(msg);
      expect(result.type).toBe('docs');
    }
  });

  test('detects test keywords', () => {
    const tests = ['Improve test coverage', 'Spec for authentication module', 'Mock database service in tests'];
    for (const msg of tests) {
      const result = classifyCommit(msg);
      expect(result.type).toBe('test');
    }
  });

  test('detects performance keywords', () => {
    const perf = [
      'Optimize query performance',
      'Cache database results',
      'Make rendering faster',
      'Speed up build process',
    ];
    for (const msg of perf) {
      const result = classifyCommit(msg);
      expect(result.type).toBe('performance');
    }
  });

  test('detects dependency keywords', () => {
    const deps = ['Bump lodash to 4.17.21', 'Upgrade typescript to 5.0', 'Update version for react', 'Update deps'];
    for (const msg of deps) {
      const result = classifyCommit(msg);
      expect(result.type).toBe('dependency');
    }
  });

  test('detects style keywords', () => {
    const styles = ['Format code with prettier', 'Linting pass on all modules', 'Prettier formatted everything'];
    for (const msg of styles) {
      const result = classifyCommit(msg);
      expect(result.type).toBe('style');
    }
  });

  test('detects chore keywords', () => {
    const result = classifyCommit('Release version 2.0.0');
    expect(result.type).toBe('chore');
  });
});

// ---------------------------------------------------------------------------
// Tier 3: Body fallback + edge cases
// ---------------------------------------------------------------------------
describe('classifyCommit — Tier 3 (body fallback)', () => {
  test('falls back to body when subject is opaque', () => {
    const msg = 'WIP\n\nThis fixes a bug in the authentication flow';
    const result = classifyCommit(msg);
    expect(result.type).toBe('bug-fix');
    expect(result.confidence).toBe('low');
  });

  test('body fallback confidence is always low', () => {
    const msg = 'Updated things\n\nRefactored the entire module structure';
    // First line has "Updated" which matches feature keyword
    // So this should actually match tier 2 on first line
    const result = classifyCommit(msg);
    // "Updated" doesn't match — it's "update.*version" for deps; let's check
    // Actually "update" is not in keywords by itself — wait, let me check feature patterns
    // Feature: /\bfeat(ure)?\b|\badd(ed|s|ing)?\b|\bimplement(ed|s)?\b|\bcreate[sd]?\b|\bintroduce[sd]?\b/i
    // "Updated" doesn't match any of these, so tier 2 fails on first line
    // Then body: "Refactored" matches refactor
    expect(result.confidence).toBe('low');
    expect(result.type).toBe('refactor');
  });
});

describe('classifyCommit — edge cases', () => {
  test('empty message returns maintenance with low confidence', () => {
    const result = classifyCommit('');
    expect(result.type).toBe('maintenance');
    expect(result.confidence).toBe('low');
    expect(result.isBreaking).toBe(false);
  });

  test('gibberish message returns maintenance', () => {
    const result = classifyCommit('asdfghjkl qwertyuiop');
    expect(result.type).toBe('maintenance');
    expect(result.confidence).toBe('low');
  });

  test('message with only whitespace returns maintenance', () => {
    const result = classifyCommit('   \n\n  ');
    expect(result.type).toBe('maintenance');
    expect(result.confidence).toBe('low');
  });

  test('multiline message uses first line for tier 1/2', () => {
    const msg = 'feat(ui): add dark mode\n\nThis is a long body\nwith multiple lines';
    const result = classifyCommit(msg);
    expect(result.type).toBe('feature');
    expect(result.confidence).toBe('high');
  });

  test('keyword priority: merge wins over fix', () => {
    // "Merge pull request" pattern comes first in the keyword list
    const result = classifyCommit('Merge pull request #99 to fix auth');
    expect(result.type).toBe('merge');
  });
});

// ---------------------------------------------------------------------------
// commitFlags
// ---------------------------------------------------------------------------
describe('commitFlags', () => {
  test('sets isBugFix correctly', () => {
    const classified: ClassifiedCommit = {
      type: 'bug-fix',
      isBreaking: false,
      confidence: 'high',
    };
    const flags = commitFlags(classified);
    expect(flags.isBugFix).toBe(true);
    expect(flags.isFeature).toBe(false);
    expect(flags.isMerge).toBe(false);
    expect(flags.isBreaking).toBe(false);
  });

  test('sets isFeature correctly', () => {
    const flags = commitFlags({
      type: 'feature',
      isBreaking: false,
      confidence: 'high',
    });
    expect(flags.isFeature).toBe(true);
    expect(flags.isBugFix).toBe(false);
  });

  test('sets isMerge correctly', () => {
    const flags = commitFlags({
      type: 'merge',
      isBreaking: false,
      confidence: 'medium',
    });
    expect(flags.isMerge).toBe(true);
  });

  test('sets isBreaking from classified commit', () => {
    const flags = commitFlags({
      type: 'breaking-change',
      isBreaking: true,
      confidence: 'high',
    });
    expect(flags.isBreaking).toBe(true);
  });

  test('all flags false for chore commit', () => {
    const flags = commitFlags({
      type: 'chore',
      isBreaking: false,
      confidence: 'high',
    });
    expect(flags.isBugFix).toBe(false);
    expect(flags.isFeature).toBe(false);
    expect(flags.isMerge).toBe(false);
    expect(flags.isBreaking).toBe(false);
  });
});
