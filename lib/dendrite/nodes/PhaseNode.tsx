"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { DT } from "../design-tokens";

function PhaseNodeInner({ data }: NodeProps) {
  const fill = (data.fill as string) ?? DT.surface;
  const textColor = (data.textColor as string) ?? DT.text;
  const isCollapsed = data.isCollapsed as boolean;
  const hasChildren = data.hasChildren as boolean;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: fill,
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: DT.border,
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.35rem",
        fontSize: "0.8rem",
        fontWeight: 600,
        color: textColor,
        cursor: hasChildren ? "pointer" : "default",
      }}
      title={data.description as string}
    >
      {hasChildren && (
        <span style={{ fontSize: "0.65rem", opacity: 0.6 }}>
          {isCollapsed ? "+" : "-"}
        </span>
      )}
      {data.label as string}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

export const PhaseNode = memo(PhaseNodeInner);
