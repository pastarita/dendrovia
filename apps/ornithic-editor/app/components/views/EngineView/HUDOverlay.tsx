/**
 * HUDOverlay — Injects ornithicus-ui components over the 3D canvas.
 */

import React from "react";

export interface HUDOverlayProps {
  repoUrl: string;
  onBack: () => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({ repoUrl, onBack }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {/* Top header */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "auto",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(15, 12, 8, 0.85)",
            border: "1px solid rgba(199,123,63,0.4)",
            borderRadius: 8,
            color: "#e8dcc8",
            padding: "4px 12px",
            cursor: "pointer",
          }}
        >
          Back
        </button>
        <span style={{ opacity: 0.6, fontSize: 12 }}>{repoUrl}</span>
      </div>
    </div>
  );
};
