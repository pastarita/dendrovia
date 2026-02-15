"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { DT } from "../design-tokens";

function PipelineRootNodeInner({ data }: NodeProps) {
  const fill = (data.fill as string) ?? DT.accent;
  const textColor = (data.textColor as string) ?? "#000000";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: fill,
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: DT.accent,
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: "0.85rem",
        color: textColor,
        letterSpacing: "0.04em",
      }}
    >
      {data.label as string}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

export const PipelineRootNode = memo(PipelineRootNodeInner);
