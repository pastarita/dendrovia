/**
 * MillerBreadcrumb — Spatial breadcrumb navigation.
 * Provides Miller-column style path navigation synchronized
 * with the 3D tree position.
 */

import React from "react";

export interface BreadcrumbSegment {
  label: string;
  path: string;
  depth: number;
}

export interface MillerBreadcrumbProps {
  segments?: BreadcrumbSegment[];
  onNavigate?: (segment: BreadcrumbSegment) => void;
}

export const MillerBreadcrumb: React.FC<MillerBreadcrumbProps> = ({
  segments = [],
  onNavigate,
}) => {
  return (
    <nav className="ornithicus-miller-breadcrumb">
      {segments.map((seg, i) => (
        <span key={seg.path}>
          {i > 0 && <span className="separator">/</span>}
          <button onClick={() => onNavigate?.(seg)}>{seg.label}</button>
        </span>
      ))}
    </nav>
  );
};
