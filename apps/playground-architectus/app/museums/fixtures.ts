/**
 * Pre-built topology fixtures for the Museum showcase.
 *
 * Each fixture is a FileTreeNode representing a codebase structure.
 * These exercise the full CHRONOS → L-System → Turtle → GPU pipeline
 * with different scales and shapes.
 */

import type { FileTreeNode, Hotspot, ProceduralPalette } from '@dendrovia/shared';

// Helper to create file metadata
function file(
  name: string,
  path: string,
  opts: { loc?: number; complexity?: number; language?: string } = {},
): FileTreeNode {
  return {
    name,
    path,
    type: 'file',
    metadata: {
      path,
      hash: path.replace(/\W/g, '').slice(0, 8),
      language: opts.language ?? 'typescript',
      complexity: opts.complexity ?? 5,
      loc: opts.loc ?? 50,
      lastModified: new Date('2026-01-15'),
      author: 'dev',
    },
  };
}

function dir(name: string, path: string, children: FileTreeNode[]): FileTreeNode {
  return { name, path, type: 'directory', children };
}

// ---------------------------------------------------------------------------
// Fixture 1: Small Library (~8 files, simple tree)
// ---------------------------------------------------------------------------

export const SMALL_LIBRARY: FileTreeNode = dir('lib', 'lib', [
  file('index.ts', 'lib/index.ts', { loc: 20 }),
  file('parser.ts', 'lib/parser.ts', { loc: 120, complexity: 8 }),
  file('validator.ts', 'lib/validator.ts', { loc: 80, complexity: 6 }),
  dir('utils', 'lib/utils', [
    file('strings.ts', 'lib/utils/strings.ts', { loc: 60 }),
    file('numbers.ts', 'lib/utils/numbers.ts', { loc: 45 }),
  ]),
  dir('types', 'lib/types', [
    file('index.ts', 'lib/types/index.ts', { loc: 90 }),
    file('guards.ts', 'lib/types/guards.ts', { loc: 40 }),
  ]),
]);

// ---------------------------------------------------------------------------
// Fixture 2: Medium App (~20 files, moderate branching)
// ---------------------------------------------------------------------------

export const MEDIUM_APP: FileTreeNode = dir('src', 'src', [
  file('main.tsx', 'src/main.tsx', { loc: 15 }),
  file('App.tsx', 'src/App.tsx', { loc: 120, complexity: 8 }),
  dir('components', 'src/components', [
    file('Header.tsx', 'src/components/Header.tsx', { loc: 45, complexity: 3 }),
    file('Sidebar.tsx', 'src/components/Sidebar.tsx', { loc: 80, complexity: 5 }),
    file('Footer.tsx', 'src/components/Footer.tsx', { loc: 30, complexity: 2 }),
    file('Card.tsx', 'src/components/Card.tsx', { loc: 65, complexity: 4 }),
    file('Modal.tsx', 'src/components/Modal.tsx', { loc: 110, complexity: 7 }),
  ]),
  dir('hooks', 'src/hooks', [
    file('useAuth.ts', 'src/hooks/useAuth.ts', { loc: 95, complexity: 6 }),
    file('useData.ts', 'src/hooks/useData.ts', { loc: 70, complexity: 5 }),
    file('useTheme.ts', 'src/hooks/useTheme.ts', { loc: 40, complexity: 3 }),
  ]),
  dir('utils', 'src/utils', [
    file('helpers.ts', 'src/utils/helpers.ts', { loc: 200, complexity: 12 }),
    file('api.ts', 'src/utils/api.ts', { loc: 90, complexity: 6 }),
    file('format.ts', 'src/utils/format.ts', { loc: 55 }),
  ]),
  dir('types', 'src/types', [
    file('index.ts', 'src/types/index.ts', { loc: 150 }),
    file('api.ts', 'src/types/api.ts', { loc: 80 }),
  ]),
  dir('pages', 'src/pages', [
    file('Home.tsx', 'src/pages/Home.tsx', { loc: 90, complexity: 5 }),
    file('Settings.tsx', 'src/pages/Settings.tsx', { loc: 130, complexity: 8 }),
    file('Profile.tsx', 'src/pages/Profile.tsx', { loc: 75, complexity: 4 }),
  ]),
]);

// ---------------------------------------------------------------------------
// Fixture 3: Large Project (~35 files, deep hierarchy)
// ---------------------------------------------------------------------------

export const LARGE_PROJECT: FileTreeNode = dir('app', 'app', [
  file('index.ts', 'app/index.ts', { loc: 25 }),
  file('config.ts', 'app/config.ts', { loc: 80, complexity: 4 }),
  dir('core', 'app/core', [
    file('engine.ts', 'app/core/engine.ts', { loc: 300, complexity: 15 }),
    file('scheduler.ts', 'app/core/scheduler.ts', { loc: 180, complexity: 10 }),
    file('registry.ts', 'app/core/registry.ts', { loc: 120, complexity: 7 }),
    dir('plugins', 'app/core/plugins', [
      file('base.ts', 'app/core/plugins/base.ts', { loc: 90 }),
      file('loader.ts', 'app/core/plugins/loader.ts', { loc: 110, complexity: 8 }),
      file('validator.ts', 'app/core/plugins/validator.ts', { loc: 70, complexity: 5 }),
    ]),
  ]),
  dir('api', 'app/api', [
    file('router.ts', 'app/api/router.ts', { loc: 150, complexity: 9 }),
    file('middleware.ts', 'app/api/middleware.ts', { loc: 95, complexity: 6 }),
    dir('handlers', 'app/api/handlers', [
      file('users.ts', 'app/api/handlers/users.ts', { loc: 200, complexity: 11 }),
      file('auth.ts', 'app/api/handlers/auth.ts', { loc: 160, complexity: 9 }),
      file('data.ts', 'app/api/handlers/data.ts', { loc: 130, complexity: 7 }),
      file('admin.ts', 'app/api/handlers/admin.ts', { loc: 180, complexity: 10 }),
    ]),
  ]),
  dir('ui', 'app/ui', [
    file('theme.ts', 'app/ui/theme.ts', { loc: 60 }),
    dir('components', 'app/ui/components', [
      file('Button.tsx', 'app/ui/components/Button.tsx', { loc: 45 }),
      file('Input.tsx', 'app/ui/components/Input.tsx', { loc: 55 }),
      file('Table.tsx', 'app/ui/components/Table.tsx', { loc: 180, complexity: 10 }),
      file('Form.tsx', 'app/ui/components/Form.tsx', { loc: 220, complexity: 12 }),
      file('Layout.tsx', 'app/ui/components/Layout.tsx', { loc: 100, complexity: 5 }),
    ]),
    dir('pages', 'app/ui/pages', [
      file('Dashboard.tsx', 'app/ui/pages/Dashboard.tsx', { loc: 250, complexity: 13 }),
      file('UserList.tsx', 'app/ui/pages/UserList.tsx', { loc: 170, complexity: 9 }),
      file('Settings.tsx', 'app/ui/pages/Settings.tsx', { loc: 140, complexity: 7 }),
    ]),
  ]),
  dir('services', 'app/services', [
    file('database.ts', 'app/services/database.ts', { loc: 120, complexity: 8 }),
    file('cache.ts', 'app/services/cache.ts', { loc: 80, complexity: 5 }),
    file('queue.ts', 'app/services/queue.ts', { loc: 95, complexity: 6 }),
    file('email.ts', 'app/services/email.ts', { loc: 70, complexity: 4 }),
  ]),
  dir('tests', 'app/tests', [
    file('engine.test.ts', 'app/tests/engine.test.ts', { loc: 200 }),
    file('api.test.ts', 'app/tests/api.test.ts', { loc: 150 }),
    file('ui.test.ts', 'app/tests/ui.test.ts', { loc: 100 }),
  ]),
]);

// ---------------------------------------------------------------------------
// Fixture 4: Dendrovia Self-Portrait (simplified monorepo structure)
// ---------------------------------------------------------------------------

export const DENDROVIA_SELF: FileTreeNode = dir('dendrovia', 'dendrovia', [
  file('turbo.json', 'dendrovia/turbo.json', { loc: 30, language: 'json' }),
  file('package.json', 'dendrovia/package.json', { loc: 40, language: 'json' }),
  dir('packages', 'dendrovia/packages', [
    dir('chronos', 'dendrovia/packages/chronos', [
      file('parser.ts', 'dendrovia/packages/chronos/parser.ts', { loc: 250, complexity: 12 }),
      file('analyzer.ts', 'dendrovia/packages/chronos/analyzer.ts', { loc: 180, complexity: 9 }),
      file('types.ts', 'dendrovia/packages/chronos/types.ts', { loc: 100 }),
    ]),
    dir('imaginarium', 'dendrovia/packages/imaginarium', [
      file('palette.ts', 'dendrovia/packages/imaginarium/palette.ts', { loc: 160, complexity: 8 }),
      file('sdf.ts', 'dendrovia/packages/imaginarium/sdf.ts', { loc: 200, complexity: 11 }),
      file('noise.ts', 'dendrovia/packages/imaginarium/noise.ts', { loc: 130, complexity: 7 }),
    ]),
    dir('architectus', 'dendrovia/packages/architectus', [
      file('App.tsx', 'dendrovia/packages/architectus/App.tsx', { loc: 260, complexity: 10 }),
      file('LSystem.ts', 'dendrovia/packages/architectus/LSystem.ts', { loc: 240, complexity: 12 }),
      file('TurtleInterpreter.ts', 'dendrovia/packages/architectus/TurtleInterpreter.ts', { loc: 330, complexity: 14 }),
      file('BranchInstances.tsx', 'dendrovia/packages/architectus/BranchInstances.tsx', { loc: 120, complexity: 6 }),
      file('NodeInstances.tsx', 'dendrovia/packages/architectus/NodeInstances.tsx', { loc: 170, complexity: 8 }),
      file('CameraRig.tsx', 'dendrovia/packages/architectus/CameraRig.tsx', { loc: 160, complexity: 7 }),
    ]),
    dir('ludus', 'dendrovia/packages/ludus', [
      file('combat.ts', 'dendrovia/packages/ludus/combat.ts', { loc: 400, complexity: 18 }),
      file('spells.ts', 'dendrovia/packages/ludus/spells.ts', { loc: 200, complexity: 10 }),
      file('monsters.ts', 'dendrovia/packages/ludus/monsters.ts', { loc: 150, complexity: 7 }),
      file('encounter.ts', 'dendrovia/packages/ludus/encounter.ts', { loc: 180, complexity: 9 }),
    ]),
    dir('shared', 'dendrovia/packages/shared', [
      file('types.ts', 'dendrovia/packages/shared/types.ts', { loc: 460 }),
      file('EventBus.ts', 'dendrovia/packages/shared/EventBus.ts', { loc: 250, complexity: 8 }),
      file('contracts.ts', 'dendrovia/packages/shared/contracts.ts', { loc: 140 }),
    ]),
  ]),
]);

// ---------------------------------------------------------------------------
// Hotspot data for fixtures
// ---------------------------------------------------------------------------

export const MEDIUM_APP_HOTSPOTS: Hotspot[] = [
  { path: 'src/utils/helpers.ts', churnRate: 15, complexity: 12, riskScore: 0.85 },
  { path: 'src/components/Modal.tsx', churnRate: 10, complexity: 7, riskScore: 0.6 },
  { path: 'src/hooks/useAuth.ts', churnRate: 8, complexity: 6, riskScore: 0.5 },
];

export const LARGE_PROJECT_HOTSPOTS: Hotspot[] = [
  { path: 'app/core/engine.ts', churnRate: 20, complexity: 15, riskScore: 0.95 },
  { path: 'app/api/handlers/users.ts', churnRate: 14, complexity: 11, riskScore: 0.8 },
  { path: 'app/ui/pages/Dashboard.tsx', churnRate: 12, complexity: 13, riskScore: 0.75 },
  { path: 'app/ui/components/Form.tsx', churnRate: 10, complexity: 12, riskScore: 0.65 },
];

export const DENDROVIA_HOTSPOTS: Hotspot[] = [
  { path: 'dendrovia/packages/ludus/combat.ts', churnRate: 18, complexity: 18, riskScore: 0.9 },
  { path: 'dendrovia/packages/architectus/TurtleInterpreter.ts', churnRate: 12, complexity: 14, riskScore: 0.75 },
  { path: 'dendrovia/packages/shared/types.ts', churnRate: 16, complexity: 5, riskScore: 0.6 },
];

// ---------------------------------------------------------------------------
// Palette presets per fixture
// ---------------------------------------------------------------------------

export const FIXTURE_PALETTES: Record<string, ProceduralPalette> = {
  'small-library': {
    primary: '#0a4a6e',
    secondary: '#1a2a4e',
    accent: '#00ffcc',
    background: '#0a0a0a',
    glow: '#00ffff',
    mood: 'cool',
  },
  'medium-app': {
    primary: '#6e3a0a',
    secondary: '#4e2a1a',
    accent: '#ffcc00',
    background: '#0a0a0a',
    glow: '#ff6600',
    mood: 'warm',
  },
  'large-project': {
    primary: '#3a1a6e',
    secondary: '#2a1a4e',
    accent: '#cc66ff',
    background: '#050505',
    glow: '#9933ff',
    mood: 'cool',
  },
  'dendrovia-self': {
    primary: '#0a4e2a',
    secondary: '#1a3e1a',
    accent: '#00ff66',
    background: '#050a05',
    glow: '#00ff00',
    mood: 'cool',
  },
};

// ---------------------------------------------------------------------------
// Fixture registry
// ---------------------------------------------------------------------------

export interface ShowcaseFixture {
  id: string;
  name: string;
  description: string;
  fileCount: number;
  topology: FileTreeNode;
  hotspots: Hotspot[];
  palette: ProceduralPalette;
}

function countFiles(node: FileTreeNode): number {
  if (node.type === 'file') return 1;
  return (node.children ?? []).reduce((sum, c) => sum + countFiles(c), 0);
}

const TRON_PALETTE: ProceduralPalette = {
  primary: '#0a4a6e',
  secondary: '#1a2a4e',
  accent: '#00ffcc',
  background: '#0a0a0a',
  glow: '#00ffff',
  mood: 'cool',
};

export const FIXTURES: ShowcaseFixture[] = [
  {
    id: 'small-library',
    name: 'Small Library',
    description: 'A minimal utility library with ~8 files. Simple tree structure, shallow depth.',
    fileCount: countFiles(SMALL_LIBRARY),
    topology: SMALL_LIBRARY,
    hotspots: [],
    palette: FIXTURE_PALETTES['small-library'] ?? TRON_PALETTE,
  },
  {
    id: 'medium-app',
    name: 'Medium App',
    description: 'A typical web application with ~20 files. Components, hooks, utils, pages. Moderate branching.',
    fileCount: countFiles(MEDIUM_APP),
    topology: MEDIUM_APP,
    hotspots: MEDIUM_APP_HOTSPOTS,
    palette: FIXTURE_PALETTES['medium-app'] ?? TRON_PALETTE,
  },
  {
    id: 'large-project',
    name: 'Large Project',
    description: 'A full-stack application with ~35 files. Deep hierarchy: core engine, API, UI, services, tests.',
    fileCount: countFiles(LARGE_PROJECT),
    topology: LARGE_PROJECT,
    hotspots: LARGE_PROJECT_HOTSPOTS,
    palette: FIXTURE_PALETTES['large-project'] ?? TRON_PALETTE,
  },
  {
    id: 'dendrovia-self',
    name: 'Dendrovia Self-Portrait',
    description: 'This monorepo visualizing itself. Six pillars: CHRONOS, IMAGINARIUM, ARCHITECTUS, LUDUS, shared.',
    fileCount: countFiles(DENDROVIA_SELF),
    topology: DENDROVIA_SELF,
    hotspots: DENDROVIA_HOTSPOTS,
    palette: FIXTURE_PALETTES['dendrovia-self'] ?? TRON_PALETTE,
  },
];
