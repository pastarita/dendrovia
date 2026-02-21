/**
 * LanderView — 2D entry page with bird hero, URL input, and cached repo grid.
 */

import React, { useState } from "react";

export interface LanderViewProps {
  onLaunch: (url: string) => void;
}

export const LanderView: React.FC<LanderViewProps> = ({ onLaunch }) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onLaunch(url.trim());
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 24,
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: 300 }}>Ornithicus</h1>
      <p style={{ opacity: 0.6 }}>Spatial Codebase Editor</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          style={{
            width: 400,
            padding: "8px 12px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(199,123,63,0.4)",
            borderRadius: 8,
            color: "#e8dcc8",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 24px",
            background: "#c77b3f",
            border: "none",
            borderRadius: 8,
            color: "#0a0806",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Launch
        </button>
      </form>
    </div>
  );
};
