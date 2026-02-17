/**
 * Mock data for OCULUS playground pages.
 * Provides realistic sample data for all OCULUS components.
 */

import type { Bug, FileTreeNode, Hotspot, Quest, Spell } from '@dendrovia/shared';

// ── Quests ──────────────────────────────────────────────

export const MOCK_QUESTS: Quest[] = [
  {
    id: 'q1',
    title: 'Hunt the Null Pointer',
    description: 'Track down the null pointer exception haunting the auth module',
    type: 'bug-hunt',
    status: 'active',
    requirements: ['Navigate to auth/', 'Find the Bug'],
    rewards: [{ type: 'experience', value: 150 }],
  },
  {
    id: 'q2',
    title: 'Refactor the Gateway',
    description: 'Simplify the API gateway middleware chain',
    type: 'refactor',
    status: 'available',
    requirements: ['Read gateway.ts', 'Reduce complexity below 10'],
    rewards: [
      { type: 'experience', value: 200 },
      { type: 'knowledge', value: 'middleware-patterns' },
    ],
  },
  {
    id: 'q3',
    title: 'Archive the Ancient Logs',
    description: 'Explore the oldest commits and document the founding patterns',
    type: 'archaeology',
    status: 'completed',
    requirements: ['Visit 5 ancient files'],
    rewards: [{ type: 'experience', value: 100 }],
  },
];

// ── Bug (enemy) ─────────────────────────────────────────

export const MOCK_BUG: Bug = {
  id: 'bug-1',
  type: 'null-pointer',
  severity: 3,
  health: 75,
  position: [5, 0, -3],
  sourceCommit: 'a1b2c3d',
};

// ── Spells ──────────────────────────────────────────────

export const MOCK_SPELLS: Spell[] = [
  {
    id: 'spell-blame',
    name: 'Git Blame',
    description: 'Trace the origin of the bug',
    manaCost: 10,
    cooldown: 2,
    effect: { type: 'damage', target: 'enemy', value: 15 },
    element: 'fire',
  },
  {
    id: 'spell-bisect',
    name: 'Git Bisect',
    description: 'Binary search for the root cause',
    manaCost: 20,
    cooldown: 3,
    effect: { type: 'damage', target: 'enemy', value: 30 },
    element: 'air',
  },
  {
    id: 'spell-stash',
    name: 'Git Stash',
    description: 'Shield yourself by stashing changes',
    manaCost: 15,
    cooldown: 4,
    effect: { type: 'shield', target: 'self', value: 25 },
    element: 'earth',
  },
];

// ── Topology ────────────────────────────────────────────

export const MOCK_TOPOLOGY: FileTreeNode = {
  name: 'dendrovia',
  path: '.',
  type: 'directory',
  children: [
    {
      name: 'src',
      path: 'src',
      type: 'directory',
      children: [
        {
          name: 'components',
          path: 'src/components',
          type: 'directory',
          children: [
            {
              name: 'App.tsx',
              path: 'src/components/App.tsx',
              type: 'file',
              metadata: {
                path: 'src/components/App.tsx',
                hash: 'a1',
                language: 'typescript',
                complexity: 5,
                loc: 120,
                lastModified: new Date(),
                author: 'explorer',
              },
            },
            {
              name: 'Header.tsx',
              path: 'src/components/Header.tsx',
              type: 'file',
              metadata: {
                path: 'src/components/Header.tsx',
                hash: 'a2',
                language: 'typescript',
                complexity: 3,
                loc: 45,
                lastModified: new Date(),
                author: 'explorer',
              },
            },
            {
              name: 'Footer.tsx',
              path: 'src/components/Footer.tsx',
              type: 'file',
              metadata: {
                path: 'src/components/Footer.tsx',
                hash: 'a3',
                language: 'typescript',
                complexity: 2,
                loc: 30,
                lastModified: new Date(),
                author: 'explorer',
              },
            },
          ],
        },
        {
          name: 'utils',
          path: 'src/utils',
          type: 'directory',
          children: [
            {
              name: 'helpers.ts',
              path: 'src/utils/helpers.ts',
              type: 'file',
              metadata: {
                path: 'src/utils/helpers.ts',
                hash: 'b1',
                language: 'typescript',
                complexity: 8,
                loc: 200,
                lastModified: new Date(),
                author: 'explorer',
              },
            },
            {
              name: 'api.ts',
              path: 'src/utils/api.ts',
              type: 'file',
              metadata: {
                path: 'src/utils/api.ts',
                hash: 'b2',
                language: 'typescript',
                complexity: 12,
                loc: 350,
                lastModified: new Date(),
                author: 'explorer',
              },
            },
          ],
        },
        {
          name: 'index.ts',
          path: 'src/index.ts',
          type: 'file',
          metadata: {
            path: 'src/index.ts',
            hash: 'c1',
            language: 'typescript',
            complexity: 1,
            loc: 10,
            lastModified: new Date(),
            author: 'explorer',
          },
        },
      ],
    },
    { name: 'package.json', path: 'package.json', type: 'file' },
    { name: 'README.md', path: 'README.md', type: 'file' },
  ],
};

export const MOCK_HOTSPOTS: Hotspot[] = [
  { path: 'src/utils/api.ts', churnRate: 42, complexity: 12, riskScore: 0.85 },
  { path: 'src/utils/helpers.ts', churnRate: 28, complexity: 8, riskScore: 0.6 },
  { path: 'src/components/App.tsx', churnRate: 15, complexity: 5, riskScore: 0.35 },
];

// ── Battle Log ──────────────────────────────────────────

export const MOCK_BATTLE_LOG = [
  'A wild null-pointer appeared!',
  'Turn 1: Your turn begins',
  'Explorer cast Git Blame on null-pointer: damage for 15',
  'Turn 1: Enemy turn begins',
  'null-pointer dealt 8 none damage to Explorer',
  'Turn 2: Your turn begins',
];
