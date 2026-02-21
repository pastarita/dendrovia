/**
 * HoverCodeReader — Floating panel for file inspection.
 * Activates on hover over a tree node, shows file content via
 * Drei→Oculus handoff pattern.
 */

import React from "react";

export interface HoverCodeReaderProps {
  filePath?: string;
  content?: string;
  visible?: boolean;
  position?: { x: number; y: number };
}

export const HoverCodeReader: React.FC<HoverCodeReaderProps> = ({
  filePath,
  content,
  visible = false,
  position,
}) => {
  if (!visible || !filePath) return null;

  return (
    <div
      className="ornithicus-hover-code-reader"
      style={{
        position: "absolute",
        left: position?.x ?? 0,
        top: position?.y ?? 0,
      }}
    >
      <div className="code-reader-header">{filePath}</div>
      <pre className="code-reader-content">{content}</pre>
    </div>
  );
};
