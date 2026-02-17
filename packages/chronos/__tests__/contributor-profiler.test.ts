import { describe, test, expect } from 'bun:test';
import {
  profileContributors,
  type ContributorProfile,
  type Archetype,
  type TimeArchetype,
} from '../src/builder/ContributorProfiler';
import type { ParsedCommit } from '@dendrovia/shared';

// ---------------------------------------------------------------------------
// Helper: create test commits
// ---------------------------------------------------------------------------
function makeCommit(
  author: string,
  message: string,
  opts: Partial<ParsedCommit> = {},
): ParsedCommit {
  return {
    hash: Math.random().toString(36).slice(2, 10),
    message,
    author,
    date: new Date('2025-06-15T14:00:00Z'),
    filesChanged: ['src/index.ts'],
    insertions: 10,
    deletions: 5,
    isMerge: false,
    ...opts,
  };
}

/**
 * Create N commits of a given type pattern for an author.
 */
function makeCommitsOfType(
  author: string,
  conventionalPrefix: string,
  count: number,
  fileBase: string = 'src/file',
): ParsedCommit[] {
  return Array.from({ length: count }, (_, i) =>
    makeCommit(author, `${conventionalPrefix}: change ${i}`, {
      filesChanged: [`${fileBase}${i}.ts`],
    }),
  );
}

// ---------------------------------------------------------------------------
// Archetype classification
// ---------------------------------------------------------------------------
describe('profileContributors — archetype classification', () => {
  test('guardian: >50% chore/style commits', () => {
    const commits = [
      ...makeCommitsOfType('Alice', 'chore', 6),
      ...makeCommitsOfType('Alice', 'feat', 2),
      ...makeCommitsOfType('Alice', 'fix', 2),
    ];
    const profiles = profileContributors(commits);
    expect(profiles.length).toBe(1);
    expect(profiles[0].archetype).toBe('guardian');
    expect(profiles[0].characterClass).toBe('tank');
  });

  test('healer: >50% fix commits', () => {
    const commits = [
      ...makeCommitsOfType('Bob', 'fix', 6),
      ...makeCommitsOfType('Bob', 'feat', 2),
      ...makeCommitsOfType('Bob', 'chore', 2),
    ];
    const profiles = profileContributors(commits);
    expect(profiles[0].archetype).toBe('healer');
    expect(profiles[0].characterClass).toBe('healer');
  });

  test('striker: >50% feat commits', () => {
    const commits = [
      ...makeCommitsOfType('Carol', 'feat', 6),
      ...makeCommitsOfType('Carol', 'fix', 2),
      ...makeCommitsOfType('Carol', 'chore', 2),
    ];
    const profiles = profileContributors(commits);
    expect(profiles[0].archetype).toBe('striker');
    expect(profiles[0].characterClass).toBe('dps');
  });

  test('sage: >40% docs+test commits', () => {
    const commits = [
      ...makeCommitsOfType('Dan', 'docs', 3),
      ...makeCommitsOfType('Dan', 'test', 3),
      ...makeCommitsOfType('Dan', 'feat', 4),
    ];
    const profiles = profileContributors(commits);
    // docs+test = 6/10 = 60% > 40%
    expect(profiles[0].archetype).toBe('sage');
    expect(profiles[0].characterClass).toBe('healer');
  });

  test('artificer: >40% performance+chore commits', () => {
    const commits = [
      ...makeCommitsOfType('Eve', 'perf', 3),
      ...makeCommitsOfType('Eve', 'chore', 3),
      ...makeCommitsOfType('Eve', 'feat', 4),
    ];
    const profiles = profileContributors(commits);
    // perf+chore = 6/10 = 60% — but check: guardian requires chore+style > 50%
    // chore alone is 3/10 = 30%, style is 0 => chore+style = 30% < 50%
    // So guardian check fails. Then healer (fix > 50%) fails. striker (feat > 50%) fails.
    // sage (docs+test > 40%) fails. artificer (perf+chore > 40%) => 60% => yes!
    expect(profiles[0].archetype).toBe('artificer');
    expect(profiles[0].characterClass).toBe('tank');
  });

  test('berserker: >15% breaking change ratio', () => {
    const commits = [
      ...Array.from({ length: 3 }, (_, i) =>
        makeCommit('Frank', `feat!: breaking change ${i}`),
      ),
      ...makeCommitsOfType('Frank', 'feat', 7),
    ];
    const profiles = profileContributors(commits);
    // breaking changes are classified via the '!' marker => type becomes 'breaking-change'
    // 3/10 = 30% > 15%
    expect(profiles[0].archetype).toBe('berserker');
    expect(profiles[0].characterClass).toBe('dps');
  });

  test('ranger: high file diversity relative to commits', () => {
    // Need fileDiversity > 5 (fileCount / commitCount)
    // 10 commits, but each touches 6 unique files = 60 unique files / 10 commits = 6 > 5
    const commits = Array.from({ length: 10 }, (_, i) =>
      makeCommit('Grace', `misc update ${i}`, {
        filesChanged: Array.from({ length: 6 }, (_, j) => `src/file_${i}_${j}.ts`),
      }),
    );
    const profiles = profileContributors(commits);
    expect(profiles[0].archetype).toBe('ranger');
    expect(profiles[0].characterClass).toBe('dps');
  });

  test('adventurer: no dominant pattern', () => {
    const commits = [
      ...makeCommitsOfType('Hank', 'feat', 3),
      ...makeCommitsOfType('Hank', 'fix', 3),
      ...makeCommitsOfType('Hank', 'chore', 2),
      ...makeCommitsOfType('Hank', 'docs', 2),
    ];
    const profiles = profileContributors(commits);
    // feat 30%, fix 30%, chore 20%, docs 20%
    // None hit their thresholds (no guardian 50%, no healer 50%, etc.)
    // fileDiversity: 10 unique files / 10 commits = 1 (not > 5)
    expect(profiles[0].archetype).toBe('adventurer');
    expect(profiles[0].characterClass).toBe('dps');
  });
});

// ---------------------------------------------------------------------------
// Time archetype
// ---------------------------------------------------------------------------
describe('profileContributors — time archetype', () => {
  test('dawn: peak hour between 5-8', () => {
    const commits = Array.from({ length: 10 }, (_, i) =>
      makeCommit('Dev', `commit ${i}`, {
        date: new Date(`2025-06-15T07:${String(i).padStart(2, '0')}:00`),
      }),
    );
    const profiles = profileContributors(commits);
    expect(profiles[0].timeArchetype).toBe('dawn');
    expect(profiles[0].peakHour).toBe(7);
  });

  test('daylight: peak hour between 9-16', () => {
    const commits = Array.from({ length: 10 }, (_, i) =>
      makeCommit('Dev', `commit ${i}`, {
        date: new Date(`2025-06-15T14:${String(i).padStart(2, '0')}:00`),
      }),
    );
    const profiles = profileContributors(commits);
    expect(profiles[0].timeArchetype).toBe('daylight');
  });

  test('twilight: peak hour between 17-20', () => {
    const commits = Array.from({ length: 10 }, (_, i) =>
      makeCommit('Dev', `commit ${i}`, {
        date: new Date(`2025-06-15T19:${String(i).padStart(2, '0')}:00`),
      }),
    );
    const profiles = profileContributors(commits);
    expect(profiles[0].timeArchetype).toBe('twilight');
  });

  test('midnight: peak hour 21-4', () => {
    const commits = Array.from({ length: 10 }, (_, i) =>
      makeCommit('Dev', `commit ${i}`, {
        date: new Date(`2025-06-15T02:${String(i).padStart(2, '0')}:00`),
      }),
    );
    const profiles = profileContributors(commits);
    expect(profiles[0].timeArchetype).toBe('midnight');
  });

  test('midnight covers hour 23', () => {
    const commits = Array.from({ length: 10 }, (_, i) =>
      makeCommit('Dev', `commit ${i}`, {
        date: new Date(`2025-06-15T23:${String(i).padStart(2, '0')}:00`),
      }),
    );
    const profiles = profileContributors(commits);
    expect(profiles[0].timeArchetype).toBe('midnight');
  });

  test('dawn boundary: hour 5 is dawn', () => {
    const commits = Array.from({ length: 5 }, (_, i) =>
      makeCommit('Dev', `commit ${i}`, {
        date: new Date(`2025-06-15T05:${String(i).padStart(2, '0')}:00`),
      }),
    );
    const profiles = profileContributors(commits);
    expect(profiles[0].timeArchetype).toBe('dawn');
  });

  test('daylight boundary: hour 9 is daylight', () => {
    const commits = Array.from({ length: 5 }, (_, i) =>
      makeCommit('Dev', `commit ${i}`, {
        date: new Date(`2025-06-15T09:${String(i).padStart(2, '0')}:00`),
      }),
    );
    const profiles = profileContributors(commits);
    expect(profiles[0].timeArchetype).toBe('daylight');
  });
});

// ---------------------------------------------------------------------------
// Personality facets
// ---------------------------------------------------------------------------
describe('profileContributors — personality facets', () => {
  test('facets are all between 0 and 100', () => {
    const commits = [
      ...makeCommitsOfType('Dev', 'feat', 5),
      ...makeCommitsOfType('Dev', 'fix', 5),
    ];
    const profiles = profileContributors(commits);
    const f = profiles[0].facets;

    expect(f.energy).toBeGreaterThanOrEqual(0);
    expect(f.energy).toBeLessThanOrEqual(100);
    expect(f.discipline).toBeGreaterThanOrEqual(0);
    expect(f.discipline).toBeLessThanOrEqual(100);
    expect(f.creativity).toBeGreaterThanOrEqual(0);
    expect(f.creativity).toBeLessThanOrEqual(100);
    expect(f.protectiveness).toBeGreaterThanOrEqual(0);
    expect(f.protectiveness).toBeLessThanOrEqual(100);
    expect(f.breadth).toBeGreaterThanOrEqual(0);
    expect(f.breadth).toBeLessThanOrEqual(100);
    expect(f.collaboration).toBeGreaterThanOrEqual(0);
    expect(f.collaboration).toBeLessThanOrEqual(100);
  });

  test('discipline reflects conventional commit adherence', () => {
    const conventional = makeCommitsOfType('Alice', 'feat', 10);
    const nonConventional = Array.from({ length: 10 }, (_, i) =>
      makeCommit('Bob', `did some stuff ${i}`),
    );

    const profiles = profileContributors([...conventional, ...nonConventional]);
    const alice = profiles.find(p => p.name === 'Alice')!;
    const bob = profiles.find(p => p.name === 'Bob')!;

    // Alice uses conventional commits (high confidence) -> high discipline
    expect(alice.facets.discipline).toBeGreaterThan(bob.facets.discipline);
  });

  test('creativity reflects feature ratio', () => {
    const featureHeavy = makeCommitsOfType('Alice', 'feat', 10);
    const fixHeavy = makeCommitsOfType('Bob', 'fix', 10);

    const profiles = profileContributors([...featureHeavy, ...fixHeavy]);
    const alice = profiles.find(p => p.name === 'Alice')!;
    const bob = profiles.find(p => p.name === 'Bob')!;

    expect(alice.facets.creativity).toBeGreaterThan(bob.facets.creativity);
  });

  test('protectiveness reflects fix+test ratio', () => {
    const fixAndTest = [
      ...makeCommitsOfType('Alice', 'fix', 5),
      ...makeCommitsOfType('Alice', 'test', 5),
    ];
    const featureOnly = makeCommitsOfType('Bob', 'feat', 10);

    const profiles = profileContributors([...fixAndTest, ...featureOnly]);
    const alice = profiles.find(p => p.name === 'Alice')!;
    const bob = profiles.find(p => p.name === 'Bob')!;

    expect(alice.facets.protectiveness).toBeGreaterThan(bob.facets.protectiveness);
  });

  test('collaboration reflects merge ratio', () => {
    const mergeHeavy = Array.from({ length: 5 }, (_, i) =>
      makeCommit('Alice', `Merge pull request #${i} from branch`, {
        isMerge: true,
      }),
    );
    const soloWork = makeCommitsOfType('Bob', 'feat', 5);

    const profiles = profileContributors([...mergeHeavy, ...soloWork]);
    const alice = profiles.find(p => p.name === 'Alice')!;
    const bob = profiles.find(p => p.name === 'Bob')!;

    expect(alice.facets.collaboration).toBeGreaterThan(bob.facets.collaboration);
  });
});

// ---------------------------------------------------------------------------
// Profile metadata
// ---------------------------------------------------------------------------
describe('profileContributors — metadata', () => {
  test('profiles are sorted by commit count descending', () => {
    const commits = [
      ...makeCommitsOfType('Prolific', 'feat', 20),
      ...makeCommitsOfType('Occasional', 'feat', 3),
      ...makeCommitsOfType('Regular', 'feat', 10),
    ];
    const profiles = profileContributors(commits);
    expect(profiles[0].name).toBe('Prolific');
    expect(profiles[1].name).toBe('Regular');
    expect(profiles[2].name).toBe('Occasional');
  });

  test('tracks commit count correctly', () => {
    const commits = makeCommitsOfType('Dev', 'feat', 7);
    const profiles = profileContributors(commits);
    expect(profiles[0].commitCount).toBe(7);
  });

  test('tracks firstCommit and lastCommit dates', () => {
    const commits = [
      makeCommit('Dev', 'first', {
        date: new Date('2024-01-01T10:00:00Z'),
      }),
      makeCommit('Dev', 'middle', {
        date: new Date('2024-06-15T10:00:00Z'),
      }),
      makeCommit('Dev', 'last', {
        date: new Date('2025-01-01T10:00:00Z'),
      }),
    ];
    const profiles = profileContributors(commits);
    expect(profiles[0].firstCommit.getTime()).toBe(new Date('2024-01-01T10:00:00Z').getTime());
    expect(profiles[0].lastCommit.getTime()).toBe(new Date('2025-01-01T10:00:00Z').getTime());
  });

  test('counts unique files touched', () => {
    const commits = [
      makeCommit('Dev', 'feat: a', { filesChanged: ['a.ts', 'b.ts'] }),
      makeCommit('Dev', 'feat: b', { filesChanged: ['b.ts', 'c.ts'] }),
    ];
    const profiles = profileContributors(commits);
    // Unique files: a.ts, b.ts, c.ts = 3
    expect(profiles[0].uniqueFilesTouched).toBe(3);
  });

  test('peakHour is the hour with most commits', () => {
    const commits = [
      // 3 commits at 10am
      ...Array.from({ length: 3 }, (_, i) =>
        makeCommit('Dev', `morning ${i}`, {
          date: new Date(`2025-06-15T10:${String(i * 10).padStart(2, '0')}:00`),
        }),
      ),
      // 1 commit at 3pm
      makeCommit('Dev', 'afternoon', {
        date: new Date('2025-06-15T15:00:00'),
      }),
    ];
    const profiles = profileContributors(commits);
    expect(profiles[0].peakHour).toBe(10);
  });

  test('typeDistribution records counts per type', () => {
    const commits = [
      ...makeCommitsOfType('Dev', 'feat', 3),
      ...makeCommitsOfType('Dev', 'fix', 2),
      ...makeCommitsOfType('Dev', 'chore', 1),
    ];
    const profiles = profileContributors(commits);
    expect(profiles[0].typeDistribution['feature']).toBe(3);
    expect(profiles[0].typeDistribution['bug-fix']).toBe(2);
    expect(profiles[0].typeDistribution['chore']).toBe(1);
  });

  test('email defaults to empty string', () => {
    const commits = makeCommitsOfType('Dev', 'feat', 1);
    const profiles = profileContributors(commits);
    expect(profiles[0].email).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe('profileContributors — edge cases', () => {
  test('empty commits list produces empty profiles', () => {
    const profiles = profileContributors([]);
    expect(profiles).toEqual([]);
  });

  test('single commit produces valid profile', () => {
    const commits = [makeCommit('Solo', 'feat: initial commit')];
    const profiles = profileContributors(commits);
    expect(profiles.length).toBe(1);
    expect(profiles[0].commitCount).toBe(1);
    expect(profiles[0].firstCommit.getTime()).toBe(profiles[0].lastCommit.getTime());
  });

  test('all commits same type still produces valid profile', () => {
    const commits = makeCommitsOfType('Dev', 'fix', 10);
    const profiles = profileContributors(commits);
    expect(profiles[0].archetype).toBe('healer');
  });

  test('multiple contributors produce separate profiles', () => {
    const commits = [
      ...makeCommitsOfType('Alice', 'feat', 5),
      ...makeCommitsOfType('Bob', 'fix', 5),
      ...makeCommitsOfType('Carol', 'chore', 5),
    ];
    const profiles = profileContributors(commits);
    expect(profiles.length).toBe(3);
    const names = profiles.map(p => p.name);
    expect(names).toContain('Alice');
    expect(names).toContain('Bob');
    expect(names).toContain('Carol');
  });
});
