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
} from "./types";

// Design tokens
export { DT, PILLAR_COLORS, STATUS_COLORS, FIDELITY_COLORS } from "./design-tokens";

// Coloring
export { resolveNodeColor } from "./coloring";

// Layout
export { buildDendriteLayout, transformFixtureToFlow, applyDagreLayout } from "./layout/layout-engine";
export { getHiddenNodeIds, getVisibleNodes, getCollapsibleIds, collapseAllIds } from "./layout/collapse-manager";

// Store
export { createDendriteStore } from "./store/dendrite-store";

// Components
export { DendriteCanvas } from "./canvas/DendriteCanvas";
export type { DendriteCanvasProps } from "./canvas/DendriteCanvas";
export { DendriteToolbar } from "./toolbar/DendriteToolbar";
export type { DendriteToolbarProps } from "./toolbar/DendriteToolbar";

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
