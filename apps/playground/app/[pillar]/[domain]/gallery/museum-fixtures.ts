/**
 * Static fixture data for museum exhibits.
 * Pipeline stage descriptions + synthetic file data for mycology specimens.
 */

export const PIPELINE_STAGES = [
  {
    name: 'TopologyReader',
    icon: '\u{1F4D6}',
    input: 'topology.json',
    output: 'CodeTopology',
    description:
      'Reads CHRONOS output \u2014 file tree, commits, hotspots, language distribution',
  },
  {
    name: 'ColorExtractor',
    icon: '\u{1F3A8}',
    input: 'CodeTopology',
    output: 'ProceduralPalette',
    description:
      'Derives OKLCH palettes from language distribution and complexity metrics',
  },
  {
    name: 'LSystemCompiler',
    icon: '\u{1F33F}',
    input: 'CodeTopology',
    output: 'LSystemRule',
    description:
      'Produces branching rules from file tree depth, capped at 5 iterations',
  },
  {
    name: 'SDFCompiler',
    icon: '\u{1F48E}',
    input: 'LSystemRule + Palette',
    output: 'SDFShader',
    description:
      'Generates SDF scene functions with smooth-union branch geometry',
  },
  {
    name: 'NoiseGenerator',
    icon: '\u{1F30A}',
    input: 'CodeTopology',
    output: 'NoiseFunction',
    description:
      'Creates FBM/Simplex/Perlin/Worley configs from codebase entropy',
  },
  {
    name: 'VariantGenerator',
    icon: '\u{1F500}',
    input: 'All distilled assets',
    output: '5 GLSL shaders',
    description:
      'Produces global, language, complexity, structural, and hotspot shader variants',
  },
  {
    name: 'MycologyPipeline',
    icon: '\u{1F344}',
    input: 'CodeTopology',
    output: 'FungalSpecimen[]',
    description:
      'Catalogs forest-floor specimens \u2014 20 genera mapped to code properties',
  },
  {
    name: 'ManifestGenerator',
    icon: '\u{1F4CB}',
    input: 'All generated assets',
    output: 'manifest.json',
    description:
      'Produces versioned asset manifest with SHA-256 checksums for OPERATUS',
  },
] as const;

export interface SpecimenFileData {
  path: string;
  language: string;
  complexity: number;
  loc: number;
}

export const SPECIMEN_FILES: SpecimenFileData[] = [
  { path: 'src/index.ts', language: 'typescript', complexity: 5, loc: 120 },
  { path: 'src/utils/helpers.ts', language: 'typescript', complexity: 2, loc: 30 },
  { path: 'src/__tests__/app.test.ts', language: 'typescript', complexity: 3, loc: 80 },
  { path: 'src/config.json', language: 'json', complexity: 1, loc: 25 },
  { path: 'src/api/routes.ts', language: 'typescript', complexity: 12, loc: 200 },
  { path: 'README.md', language: 'markdown', complexity: 1, loc: 50 },
  { path: 'src/db/migrations/001.sql', language: 'sql', complexity: 4, loc: 40 },
  { path: 'src/components/App.tsx', language: 'typescript', complexity: 8, loc: 150 },
];
