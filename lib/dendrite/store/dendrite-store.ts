/**
 * Dendrite Store — Zustand + Immer state management.
 *
 * Manages fixture selection, layout direction, color mode,
 * collapse state, phase filtering, and ReactFlow node/edge state.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import { applyNodeChanges, applyEdgeChanges } from "@xyflow/react";

enableMapSet();
import type { NodeChange, EdgeChange } from "@xyflow/react";
import type {
  DendriteState,
  SourceDiagram,
  LayoutDirection,
  ColorMode,
} from "../types";
import { buildDendriteLayout } from "../layout/layout-engine";
import { collapseAllIds } from "../layout/collapse-manager";

function relayoutFromState(state: DendriteState): void {
  const diagram = state.fixtures[state.activeFixtureId];
  if (!diagram) return;

  const { nodes, edges } = buildDendriteLayout(
    diagram,
    state.collapseState.collapsed,
    state.direction,
    state.colorMode,
    state.phaseFilter
  );

  state.nodes = nodes;
  state.edges = edges;
  state.fitViewTrigger += 1;
}

export function createDendriteStore(
  fixtures: Record<string, SourceDiagram>,
  initialFixtureId: string
) {
  return create<DendriteState>()(
    immer((set) => {
      const initial = fixtures[initialFixtureId];
      const collapsed = new Set<string>();
      const { nodes, edges } = initial
        ? buildDendriteLayout(initial, collapsed, "TB", "status", null)
        : { nodes: [], edges: [] };

      return {
        activeFixtureId: initialFixtureId,
        fixtures,
        direction: "TB" as LayoutDirection,
        colorMode: "status" as ColorMode,
        collapseState: { collapsed },
        nodes,
        edges,
        fitViewTrigger: 0,
        phaseFilter: null,

        setFixture: (id: string) =>
          set((state) => {
            state.activeFixtureId = id;
            state.collapseState.collapsed = new Set();
            state.phaseFilter = null;
            relayoutFromState(state);
          }),

        setDirection: (dir: LayoutDirection) =>
          set((state) => {
            state.direction = dir;
            relayoutFromState(state);
          }),

        setColorMode: (mode: ColorMode) =>
          set((state) => {
            state.colorMode = mode;
            relayoutFromState(state);
          }),

        toggleCollapse: (nodeId: string) =>
          set((state) => {
            const c = state.collapseState.collapsed;
            if (c.has(nodeId)) {
              c.delete(nodeId);
            } else {
              c.add(nodeId);
            }
            relayoutFromState(state);
          }),

        collapseAll: () =>
          set((state) => {
            const diagram = state.fixtures[state.activeFixtureId];
            if (!diagram) return;
            state.collapseState.collapsed = collapseAllIds(diagram);
            relayoutFromState(state);
          }),

        expandAll: () =>
          set((state) => {
            state.collapseState.collapsed = new Set();
            relayoutFromState(state);
          }),

        setPhaseFilter: (phase: string | null) =>
          set((state) => {
            state.phaseFilter = phase;
            relayoutFromState(state);
          }),

        relayout: () =>
          set((state) => {
            relayoutFromState(state);
          }),

        onNodesChange: (changes: NodeChange[]) =>
          set((state) => {
            state.nodes = applyNodeChanges(changes, state.nodes);
          }),

        onEdgesChange: (changes: EdgeChange[]) =>
          set((state) => {
            state.edges = applyEdgeChanges(changes, state.edges);
          }),
      };
    })
  );
}
