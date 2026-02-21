/**
 * Minimap — Top-right circular radar showing the tree overview.
 * Renders a 2D projection of the current 3D tree with a viewport indicator.
 */

import React from "react";

export interface MinimapProps {
  size?: number;
}

export const Minimap: React.FC<MinimapProps> = ({ size = 120 }) => {
  return (
    <div
      className="ornithicus-minimap"
      style={{ width: size, height: size, borderRadius: "50%" }}
    >
      <canvas width={size} height={size} />
    </div>
  );
};
