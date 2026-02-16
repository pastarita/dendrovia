/**
 * Dendrite Observatory Engine — Barrel Export
 *
 * 2D hierarchical flow visualization for the Dendrovia six-pillar pipeline.
 */

// Types
export type {
  NodeKind,
  NodeStatus,
  PillarDomain,
  SourceNode,
  SourceEdge,
  SourceDiagram,
  LayoutDirection,
  ColorMode,
  LayoutConfig,
  CollapseState,
  DendriteState,
  BoundaryType,
  BoundaryEvent,
  BoundaryContract,
  RuntimeHealth,
  RuntimeMetric,
  NodeAction,
  RuntimeNodeState,
  RuntimeEvent,
} from "./types";

// Design tokens
export { DT, PILLAR_COLORS, STATUS_COLORS, FIDELITY_COLORS, RUNTIME_HEALTH_COLORS } from "./design-tokens";

// Coloring
export { resolveNodeColor } from "./coloring";

// Layout
export { buildDendriteLayout, transformFixtureToFlow, applyDagreLayout } from "./layout/layout-engine";
export { getHiddenNodeIds, getVisibleNodes, getCollapsibleIds, collapseAllIds } from "./layout/collapse-manager";

// Store
export { createDendriteStore } from "./store/dendrite-store";
export { createRuntimeStore } from "./store/runtime-store";
export type { RuntimeStoreState } from "./store/runtime-store";

// Components
export { DendriteCanvas } from "./canvas/DendriteCanvas";
export type { DendriteCanvasProps } from "./canvas/DendriteCanvas";
export { DendriteToolbar } from "./toolbar/DendriteToolbar";
export type { DendriteToolbarProps } from "./toolbar/DendriteToolbar";

// Panels
export { ColorLegend, NodeDetailPanel, ContractDetailPanel, LiveMetricsSection } from "./panels";
export type { ColorLegendProps, NodeDetailPanelProps, ContractDetailPanelProps, LiveMetricsSectionProps } from "./panels";

// Contracts
export { BOUNDARY_CONTRACTS } from "./contracts";

// Node & edge types (for advanced usage)
export { dendritenodeTypes } from "./nodes";
export { dendriteEdgeTypes } from "./edges";

// Fixtures
export {
  chronosFixture,
  imaginariumFixture,
  architectusFixture,
  ludusFixture,
  oculusFixture,
  operatusFixture,
  dendroviaFixture,
} from "./fixtures";
