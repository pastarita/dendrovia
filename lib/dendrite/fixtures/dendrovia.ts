import { BOUNDARY_CONTRACTS } from '../contracts';
import type { SourceDiagram } from '../types';

/**
 * Unified Dendrovia pipeline fixture — shows all 6 pillars
 * as phases of the root "Dendrovia Pipeline" node, with
 * top-level modules as sections beneath each pillar.
 */
export const dendroviaFixture: SourceDiagram = {
  id: 'dendrovia',
  title: 'Dendrovia Pipeline',
  nodes: [
    { id: 'dend-root', label: 'Dendrovia Pipeline', kind: 'root', status: 'implemented', domain: 'shared' },

    // --- CHRONOS ---
    {
      id: 'dend-chronos',
      label: 'CHRONOS',
      kind: 'phase',
      status: 'implemented',
      domain: 'chronos',
      children: ['dend-chr-parse', 'dend-chr-analyze', 'dend-chr-build', 'dend-chr-classify'],
    },
    {
      id: 'dend-chr-parse',
      label: 'Parse',
      kind: 'section',
      status: 'implemented',
      domain: 'chronos',
      description: 'GitParser + ASTParser',
    },
    {
      id: 'dend-chr-analyze',
      label: 'Analyze',
      kind: 'section',
      status: 'implemented',
      domain: 'chronos',
      description: 'ComplexityAnalyzer + HotspotDetector',
    },
    {
      id: 'dend-chr-build',
      label: 'Build',
      kind: 'section',
      status: 'implemented',
      domain: 'chronos',
      description: 'TopologyBuilder + TreeBuilder + ContributorProfiler',
    },
    {
      id: 'dend-chr-classify',
      label: 'Classify',
      kind: 'section',
      status: 'implemented',
      domain: 'chronos',
      description: 'CommitClassifier',
    },

    // --- IMAGINARIUM ---
    {
      id: 'dend-imaginarium',
      label: 'IMAGINARIUM',
      kind: 'phase',
      status: 'implemented',
      domain: 'imaginarium',
      children: ['dend-img-generate', 'dend-img-distill', 'dend-img-mycology', 'dend-img-mesh', 'dend-img-cache'],
    },
    {
      id: 'dend-img-generate',
      label: 'Generate',
      kind: 'section',
      status: 'implemented',
      domain: 'imaginarium',
      description: 'ArtGen + PromptBuilder',
    },
    {
      id: 'dend-img-distill',
      label: 'Distill',
      kind: 'section',
      status: 'implemented',
      domain: 'imaginarium',
      description: 'Color + SDF + LSystem + Noise + Turtle',
    },
    {
      id: 'dend-img-mycology',
      label: 'Mycology',
      kind: 'section',
      status: 'implemented',
      domain: 'imaginarium',
      description: 'GenusMapper + Morphology + MycelialNetwork + Lore + Catalog',
    },
    {
      id: 'dend-img-mesh',
      label: 'Mesh',
      kind: 'section',
      status: 'implemented',
      domain: 'imaginarium',
      description: 'HalfEdge + MeshPipeline + GenusPipelines + MeshOps',
    },
    {
      id: 'dend-img-cache',
      label: 'Cache',
      kind: 'section',
      status: 'implemented',
      domain: 'imaginarium',
      description: 'DeterministicCache + DefaultPalettes + DefaultSDFs',
    },

    // --- ARCHITECTUS ---
    {
      id: 'dend-architectus',
      label: 'ARCHITECTUS',
      kind: 'phase',
      status: 'partial',
      domain: 'architectus',
      children: ['dend-arc-load', 'dend-arc-render', 'dend-arc-instances', 'dend-arc-systems'],
    },
    {
      id: 'dend-arc-load',
      label: 'Load',
      kind: 'section',
      status: 'implemented',
      domain: 'architectus',
      description: 'AssetBridge',
    },
    {
      id: 'dend-arc-render',
      label: 'Render',
      kind: 'section',
      status: 'partial',
      domain: 'architectus',
      description: 'DendriteWorld + Camera + Lighting + PostFX + Perf',
    },
    {
      id: 'dend-arc-instances',
      label: 'Instances',
      kind: 'section',
      status: 'partial',
      domain: 'architectus',
      description: 'Branch + Node + Mushroom instances',
    },
    {
      id: 'dend-arc-systems',
      label: 'Systems',
      kind: 'section',
      status: 'implemented',
      domain: 'architectus',
      description: 'LSystem + TurtleInterpreter',
    },

    // --- LUDUS ---
    {
      id: 'dend-ludus',
      label: 'LUDUS',
      kind: 'phase',
      status: 'implemented',
      domain: 'ludus',
      children: [
        'dend-lud-character',
        'dend-lud-combat',
        'dend-lud-quest',
        'dend-lud-progression',
        'dend-lud-simulation',
      ],
    },
    {
      id: 'dend-lud-character',
      label: 'Character',
      kind: 'section',
      status: 'implemented',
      domain: 'ludus',
      description: 'CharacterSystem',
    },
    {
      id: 'dend-lud-combat',
      label: 'Combat',
      kind: 'section',
      status: 'implemented',
      domain: 'ludus',
      description: 'TurnBased + CombatMath + EnemyAI + MonsterFactory + StatusEffects',
    },
    {
      id: 'dend-lud-quest',
      label: 'Quest',
      kind: 'section',
      status: 'implemented',
      domain: 'ludus',
      description: 'QuestGenerator + EncounterSystem',
    },
    {
      id: 'dend-lud-progression',
      label: 'Progression',
      kind: 'section',
      status: 'implemented',
      domain: 'ludus',
      description: 'ProgressionSystem + SpellFactory + Inventory',
    },
    {
      id: 'dend-lud-simulation',
      label: 'Simulation',
      kind: 'section',
      status: 'implemented',
      domain: 'ludus',
      description: 'Harness + GameStore + Events + Save + Balance + RNG',
    },

    // --- OCULUS ---
    {
      id: 'dend-oculus',
      label: 'OCULUS',
      kind: 'phase',
      status: 'implemented',
      domain: 'oculus',
      children: ['dend-ocu-components', 'dend-ocu-primitives', 'dend-ocu-hooks', 'dend-ocu-store'],
    },
    {
      id: 'dend-ocu-components',
      label: 'Components',
      kind: 'section',
      status: 'implemented',
      domain: 'oculus',
      description: 'HUD + BattleUI + CodeReader + Minimap + QuestLog + Billboard + Falcon + Miller',
    },
    {
      id: 'dend-ocu-primitives',
      label: 'Primitives',
      kind: 'section',
      status: 'implemented',
      domain: 'oculus',
      description: 'Panel + IconBadge + ProgressBar + StatLabel + Tooltip',
    },
    {
      id: 'dend-ocu-hooks',
      label: 'Hooks',
      kind: 'section',
      status: 'implemented',
      domain: 'oculus',
      description: 'useCodeLoader + useEventSubscriptions + useInputCapture + useKeyboardShortcuts',
    },
    {
      id: 'dend-ocu-store',
      label: 'Store',
      kind: 'section',
      status: 'implemented',
      domain: 'oculus',
      description: 'OculusProvider + useOculusStore',
    },

    // --- OPERATUS ---
    {
      id: 'dend-operatus',
      label: 'OPERATUS',
      kind: 'phase',
      status: 'implemented',
      domain: 'operatus',
      children: [
        'dend-ops-cache',
        'dend-ops-loader',
        'dend-ops-manifest',
        'dend-ops-persist',
        'dend-ops-sync',
        'dend-ops-perf',
      ],
    },
    {
      id: 'dend-ops-cache',
      label: 'Cache',
      kind: 'section',
      status: 'implemented',
      domain: 'operatus',
      description: 'CacheManager + IDB + OPFS',
    },
    {
      id: 'dend-ops-loader',
      label: 'Loader',
      kind: 'section',
      status: 'implemented',
      domain: 'operatus',
      description: 'AssetLoader + CDNLoader',
    },
    {
      id: 'dend-ops-manifest',
      label: 'Manifest',
      kind: 'section',
      status: 'implemented',
      domain: 'operatus',
      description: 'ManifestGenerator',
    },
    {
      id: 'dend-ops-persist',
      label: 'Persistence',
      kind: 'section',
      status: 'implemented',
      domain: 'operatus',
      description: 'StatePersistence + AutoSave + GameStore + StateAdapter',
    },
    {
      id: 'dend-ops-sync',
      label: 'Sync',
      kind: 'section',
      status: 'implemented',
      domain: 'operatus',
      description: 'CrossTabSync + MultiplayerClient + ServiceWorker',
    },
    {
      id: 'dend-ops-perf',
      label: 'Perf',
      kind: 'section',
      status: 'implemented',
      domain: 'operatus',
      description: 'PerfMonitor',
    },
  ],
  edges: [
    // Main pipeline flow: CHRONOS → IMAGINARIUM → ARCHITECTUS, then ARCHITECTUS feeds runtime pillars
    { source: 'dend-root', target: 'dend-chronos', relation: 'pipeline-flow', label: 'Git Repository' },
    {
      source: 'dend-chronos',
      target: 'dend-imaginarium',
      relation: 'pipeline-flow',
      label: 'CodeTopology',
      contracts: BOUNDARY_CONTRACTS['dend-chronos->dend-imaginarium'],
    },
    {
      source: 'dend-imaginarium',
      target: 'dend-architectus',
      relation: 'pipeline-flow',
      label: 'Shaders + Palettes + Meshes',
      contracts: BOUNDARY_CONTRACTS['dend-imaginarium->dend-architectus'],
    },
    {
      source: 'dend-architectus',
      target: 'dend-ludus',
      relation: 'pipeline-flow',
      label: 'Spatial Events',
      contracts: BOUNDARY_CONTRACTS['dend-architectus->dend-ludus'],
    },
    {
      source: 'dend-architectus',
      target: 'dend-oculus',
      relation: 'pipeline-flow',
      label: 'World State',
      contracts: BOUNDARY_CONTRACTS['dend-architectus->dend-oculus'],
    },
    {
      source: 'dend-architectus',
      target: 'dend-operatus',
      relation: 'pipeline-flow',
      label: 'Asset Manifest',
      contracts: BOUNDARY_CONTRACTS['dend-architectus->dend-operatus'],
    },

    // Containment for CHRONOS
    { source: 'dend-chronos', target: 'dend-chr-parse', relation: 'containment' },
    { source: 'dend-chronos', target: 'dend-chr-analyze', relation: 'containment' },
    { source: 'dend-chronos', target: 'dend-chr-build', relation: 'containment' },
    { source: 'dend-chronos', target: 'dend-chr-classify', relation: 'containment' },

    // Containment for IMAGINARIUM
    { source: 'dend-imaginarium', target: 'dend-img-generate', relation: 'containment' },
    { source: 'dend-imaginarium', target: 'dend-img-distill', relation: 'containment' },
    { source: 'dend-imaginarium', target: 'dend-img-mycology', relation: 'containment' },
    { source: 'dend-imaginarium', target: 'dend-img-mesh', relation: 'containment' },
    { source: 'dend-imaginarium', target: 'dend-img-cache', relation: 'containment' },

    // Containment for ARCHITECTUS
    { source: 'dend-architectus', target: 'dend-arc-load', relation: 'containment' },
    { source: 'dend-architectus', target: 'dend-arc-render', relation: 'containment' },
    { source: 'dend-architectus', target: 'dend-arc-instances', relation: 'containment' },
    { source: 'dend-architectus', target: 'dend-arc-systems', relation: 'containment' },

    // Containment for LUDUS
    { source: 'dend-ludus', target: 'dend-lud-character', relation: 'containment' },
    { source: 'dend-ludus', target: 'dend-lud-combat', relation: 'containment' },
    { source: 'dend-ludus', target: 'dend-lud-quest', relation: 'containment' },
    { source: 'dend-ludus', target: 'dend-lud-progression', relation: 'containment' },
    { source: 'dend-ludus', target: 'dend-lud-simulation', relation: 'containment' },

    // Containment for OCULUS
    { source: 'dend-oculus', target: 'dend-ocu-components', relation: 'containment' },
    { source: 'dend-oculus', target: 'dend-ocu-primitives', relation: 'containment' },
    { source: 'dend-oculus', target: 'dend-ocu-hooks', relation: 'containment' },
    { source: 'dend-oculus', target: 'dend-ocu-store', relation: 'containment' },

    // Containment for OPERATUS
    { source: 'dend-operatus', target: 'dend-ops-cache', relation: 'containment' },
    { source: 'dend-operatus', target: 'dend-ops-loader', relation: 'containment' },
    { source: 'dend-operatus', target: 'dend-ops-manifest', relation: 'containment' },
    { source: 'dend-operatus', target: 'dend-ops-persist', relation: 'containment' },
    { source: 'dend-operatus', target: 'dend-ops-sync', relation: 'containment' },
    { source: 'dend-operatus', target: 'dend-ops-perf', relation: 'containment' },
  ],
};
