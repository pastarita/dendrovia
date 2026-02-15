"use client";

import { memo } from "react";
import { BaseEdge, getSmoothStepPath } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import { DT } from "../design-tokens";

function FlowEdgeInner(props: EdgeProps) {
  const {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    data,
    markerEnd,
  } = props;

  const relation = (data?.relation as string) ?? "containment";
  const isPipeline = relation === "pipeline-flow";

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: isPipeline ? DT.edgePipeline : DT.edgeContainment,
        strokeWidth: isPipeline ? 2 : 1,
        opacity: isPipeline ? 0.8 : 0.4,
      }}
    />
  );
}

export const FlowEdge = memo(FlowEdgeInner);
