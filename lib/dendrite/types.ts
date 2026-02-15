/**
 * Dendrite Observatory Engine — Type System
 *
 * Defines the source fixture format, layout state, and configuration
 * for the 2D hierarchical flow visualization.
 */

// ---------------------------------------------------------------------------
// Source Fixture Types (authored by each pillar)
// ---------------------------------------------------------------------------

export type NodeKind = "root" | "phase" | "section";

export type NodeStatus =
  | "implemented"
  | "partial"
  | "scaffold"
  | "planned"
  | "deprecated";

export type PillarDomain =
  | "chronos"
  | "imaginarium"
  | "architectus"
  | "ludus"
  | "oculus"
  | "operatus"
  | "shared"
  | "app"
  | "infra";

export interface SourceNode {
  id: string;
  label: string;
  kind: NodeKind;
  status: NodeStatus;
  domain: PillarDomain;
  /** Child node IDs (containment hierarchy) */
  children?: string[];
  /** Descriptive tooltip */
  description?: string;
}

export interface SourceEdge {
  source: string;
  target: string;
  /** "pipeline-flow" = data flows between phases; "containment" = parent-child */
  relation: "pipeline-flow" | "containment";
}

export interface SourceDiagram {
  id: string;
  title: string;
  nodes: SourceNode[];
  edges: SourceEdge[];
}

// ---------------------------------------------------------------------------
// Layout & Rendering Types
// ---------------------------------------------------------------------------

export type LayoutDirection = "TB" | "LR";

export type ColorMode = "status" | "domain" | "fidelity";

export interface LayoutConfig {
  direction: LayoutDirection;
  nodeWidth: number;
  nodeHeight: number;
  rankSep: number;
  nodeSep: number;
}

export interface CollapseState {
  /** Set of node IDs that are collapsed */
  collapsed: Set<string>;
}

// ---------------------------------------------------------------------------
// Store State
// ---------------------------------------------------------------------------

export interface DendriteState {
  // Source data
  activeFixtureId: string;
  fixtures: Record<string, SourceDiagram>;

  // Layout
  direction: LayoutDirection;
  colorMode: ColorMode;
  collapseState: CollapseState;

  // ReactFlow-managed
  nodes: import("@xyflow/react").Node[];
  edges: import("@xyflow/react").Edge[];

  // FitView trigger counter
  fitViewTrigger: number;

  // Phase filter (null = show all)
  phaseFilter: string | null;

  // Actions
  setFixture: (id: string) => void;
  setDirection: (dir: LayoutDirection) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleCollapse: (nodeId: string) => void;
  collapseAll: () => void;
  expandAll: () => void;
  setPhaseFilter: (phase: string | null) => void;
  relayout: () => void;

  // ReactFlow callbacks
  onNodesChange: (changes: import("@xyflow/react").NodeChange[]) => void;
  onEdgesChange: (changes: import("@xyflow/react").EdgeChange[]) => void;
}
