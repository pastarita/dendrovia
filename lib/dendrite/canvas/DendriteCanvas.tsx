"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useReactFlow,
} from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";
import type { StoreApi } from "zustand";
import { useStore } from "zustand";
import type { DendriteState } from "../types";
import { dendritenodeTypes } from "../nodes";
import { dendriteEdgeTypes } from "../edges";
import { DT } from "../design-tokens";
import { ColorLegend } from "../panels/ColorLegend";
import { NodeDetailPanel } from "../panels/NodeDetailPanel";
import { ContractDetailPanel } from "../panels/ContractDetailPanel";

// ---------------------------------------------------------------------------
// FitView helper — watches fitViewTrigger counter
// ---------------------------------------------------------------------------

function FitViewHelper({ store }: { store: StoreApi<DendriteState> }) {
  const fitViewTrigger = useStore(store, (s) => s.fitViewTrigger);
  const { fitView } = useReactFlow();
  const initial = useRef(true);

  useEffect(() => {
    // skip first render
    if (initial.current) {
      initial.current = false;
      // still fit on initial mount
      const t = setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50);
    return () => clearTimeout(t);
  }, [fitViewTrigger, fitView]);

  return null;
}

// ---------------------------------------------------------------------------
// Theme styles injected into the canvas
// ---------------------------------------------------------------------------

const THEME_CSS = `
.react-flow__attribution { display: none !important; }
.react-flow__background { background-color: ${DT.bg} !important; }
.react-flow__minimap { background-color: ${DT.panel} !important; }
.react-flow__controls button { background-color: ${DT.surface} !important; color: ${DT.text} !important; border-color: ${DT.border} !important; }
.react-flow__controls button:hover { background-color: ${DT.surfaceHover} !important; }
.react-flow__edge.animated path { animation-duration: 2s; }
`;

// ---------------------------------------------------------------------------
// Main Canvas
// ---------------------------------------------------------------------------

export interface DendriteCanvasProps {
  store: StoreApi<DendriteState>;
}

export function DendriteCanvas({ store }: DendriteCanvasProps) {
  const nodes = useStore(store, (s) => s.nodes);
  const edges = useStore(store, (s) => s.edges);
  const onNodesChange = useStore(store, (s) => s.onNodesChange);
  const onEdgesChange = useStore(store, (s) => s.onEdgesChange);
  const toggleCollapse = useStore(store, (s) => s.toggleCollapse);
  const selectNode = useStore(store, (s) => s.selectNode);
  const selectEdge = useStore(store, (s) => s.selectEdge);
  const clearSelection = useStore(store, (s) => s.clearSelection);
  const selectedNodeId = useStore(store, (s) => s.selectedNodeId);
  const selectedEdgeId = useStore(store, (s) => s.selectedEdgeId);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.data.hasChildren && node.data.kind === "phase") {
        toggleCollapse(node.id);
      }
      selectNode(node.id);
    },
    [toggleCollapse, selectNode]
  );

  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (edge.data?.relation === "pipeline-flow" && edge.data?.contracts) {
        selectEdge(edge.id);
      }
    },
    [selectEdge]
  );

  const handlePaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: DT.bg,
        position: "relative",
      }}
    >
      <style>{THEME_CSS}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={dendritenodeTypes}
        edgeTypes={dendriteEdgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{ type: "flowEdge" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={DT.border}
        />
        <FitViewHelper store={store} />
      </ReactFlow>
      <ColorLegend store={store} />
      {selectedNodeId && !selectedEdgeId && (
        <NodeDetailPanel store={store} />
      )}
      {selectedEdgeId && !selectedNodeId && (
        <ContractDetailPanel store={store} />
      )}
    </div>
  );
}
