/**
 * Dendrite Observatory Engine — Barrel Export
 *
 * 2D hierarchical flow visualization for the Dendrovia six-pillar pipeline.
 */

export type { DendriteCanvasProps } from './canvas/DendriteCanvas';
// Components
export { DendriteCanvas } from './canvas/DendriteCanvas';

// Coloring
export { resolveNodeColor } from './coloring';
// Contracts
export { BOUNDARY_CONTRACTS } from './contracts';
// Design tokens
export { DT, FIDELITY_COLORS, PILLAR_COLORS, RUNTIME_HEALTH_COLORS, STATUS_COLORS } from './design-tokens';
export { dendriteEdgeTypes } from './edges';
// Fixtures
export {
  architectusFixture,
  chronosFixture,
  dendroviaFixture,
  imaginariumFixture,
  ludusFixture,
  oculusFixture,
  operatusFixture,
} from './fixtures';
export { collapseAllIds, getCollapsibleIds, getHiddenNodeIds, getVisibleNodes } from './layout/collapse-manager';
// Layout
export { applyDagreLayout, buildDendriteLayout, transformFixtureToFlow } from './layout/layout-engine';
// Node & edge types (for advanced usage)
export { dendritenodeTypes } from './nodes';
export type {
  ColorLegendProps,
  ContractDetailPanelProps,
  LiveMetricsSectionProps,
  NodeDetailPanelProps,
} from './panels';
// Panels
export { ColorLegend, ContractDetailPanel, LiveMetricsSection, NodeDetailPanel } from './panels';
// Store
export { createDendriteStore } from './store/dendrite-store';
export type { RuntimeStoreState } from './store/runtime-store';
export { createRuntimeStore } from './store/runtime-store';
export type { DendriteToolbarProps } from './toolbar/DendriteToolbar';
export { DendriteToolbar } from './toolbar/DendriteToolbar';
// Types
export type {
  BoundaryContract,
  BoundaryEvent,
  BoundaryType,
  CollapseState,
  ColorMode,
  DendriteState,
  LayoutConfig,
  LayoutDirection,
  NodeAction,
  NodeKind,
  NodeStatus,
  PillarDomain,
  RuntimeEvent,
  RuntimeHealth,
  RuntimeMetric,
  RuntimeNodeState,
  SourceDiagram,
  SourceEdge,
  SourceNode,
} from './types';
