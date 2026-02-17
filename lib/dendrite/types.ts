/**
 * Dendrite Observatory Engine — Type System
 *
 * Defines the source fixture format, layout state, and configuration
 * for the 2D hierarchical flow visualization.
 */

// ---------------------------------------------------------------------------
// Source Fixture Types (authored by each pillar)
// ---------------------------------------------------------------------------

export type NodeKind = 'root' | 'phase' | 'section';

export type NodeStatus = 'implemented' | 'partial' | 'scaffold' | 'planned' | 'deprecated';

export type PillarDomain =
  | 'chronos'
  | 'imaginarium'
  | 'architectus'
  | 'ludus'
  | 'oculus'
  | 'operatus'
  | 'shared'
  | 'app'
  | 'infra';

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
  relation: 'pipeline-flow' | 'containment';
  /** Data type label displayed on pipeline-flow edges */
  label?: string;
  /** Boundary contract for pillar-to-pillar edges (L1) */
  contracts?: BoundaryContract;
}

// ---------------------------------------------------------------------------
// Boundary Contract Types (L1 — Contracts & Interfaces)
// ---------------------------------------------------------------------------

export interface BoundaryType {
  name: string;
  /** Package source, e.g. "@dendrovia/shared" */
  source: string;
  description: string;
  fields?: string[];
}

export interface BoundaryEvent {
  /** GameEvents constant name */
  name: string;
  /** Event key, e.g. "player:moved" */
  key: string;
  direction: 'emit' | 'consume';
  payloadType?: string;
}

export interface BoundaryContract {
  types: BoundaryType[];
  events: BoundaryEvent[];
  schema?: string;
}

export interface SourceDiagram {
  id: string;
  title: string;
  nodes: SourceNode[];
  edges: SourceEdge[];
}

// ---------------------------------------------------------------------------
// Runtime State Types (for live subsystem observation)
// ---------------------------------------------------------------------------

export type RuntimeHealth = 'healthy' | 'degraded' | 'error' | 'idle';

export interface RuntimeMetric {
  key: string;
  value: string | number | boolean;
  unit?: string;
}

export interface NodeAction {
  id: string;
  label: string;
  handler: () => void | Promise<void>;
  confirm?: string;
  category?: 'default' | 'danger' | 'info';
}

export interface RuntimeNodeState {
  nodeId: string;
  health: RuntimeHealth;
  metrics: RuntimeMetric[];
  actions: NodeAction[];
  lastUpdated: number;
  statusText?: string;
}

export interface RuntimeEvent {
  event: string;
  timestamp: number;
  summary?: string;
}

// ---------------------------------------------------------------------------
// Layout & Rendering Types
// ---------------------------------------------------------------------------

export type LayoutDirection = 'TB' | 'LR';

export type ColorMode = 'status' | 'domain' | 'fidelity' | 'runtime';

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
  nodes: import('@xyflow/react').Node[];
  edges: import('@xyflow/react').Edge[];

  // FitView trigger counter
  fitViewTrigger: number;

  // Phase filter (null = show all)
  phaseFilter: string | null;

  // Selection
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // Runtime health map (for runtime color mode)
  runtimeHealthMap: Map<string, RuntimeHealth> | null;

  // Actions
  setFixture: (id: string) => void;
  setDirection: (dir: LayoutDirection) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleCollapse: (nodeId: string) => void;
  collapseAll: () => void;
  expandAll: () => void;
  setPhaseFilter: (phase: string | null) => void;
  selectNode: (nodeId: string) => void;
  selectEdge: (edgeId: string) => void;
  clearSelection: () => void;
  setRuntimeHealthMap: (map: Map<string, RuntimeHealth> | null) => void;
  relayout: () => void;

  // ReactFlow callbacks
  onNodesChange: (changes: import('@xyflow/react').NodeChange[]) => void;
  onEdgesChange: (changes: import('@xyflow/react').EdgeChange[]) => void;
}
