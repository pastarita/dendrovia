/**
 * Billboard3D — In-world UI anchored to 3D positions
 *
 * Wraps @react-three/drei <Html> with OCULUS styling.
 * Always faces camera (billboard behavior).
 *
 * NOTE: This component requires @react-three/drei and @react-three/fiber
 * and must be rendered inside an R3F <Canvas>.
 * The peer dependencies are marked optional in package.json.
 */

import React, { type CSSProperties, createElement, type ReactNode } from 'react';

// Dynamic import to avoid hard dependency on R3F types at build time
let dreiHtml: React.ComponentType<any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  dreiHtml = require('@react-three/drei').Html;
} catch {
  // drei not available — Billboard3D will render nothing
}

export interface Billboard3DProps {
  /** World-space position [x, y, z] */
  position: [number, number, number];
  /** Scale factor based on camera distance */
  distanceFactor?: number;
  /** Whether to hide when behind other objects */
  occlude?: boolean;
  /** Visibility toggle */
  visible?: boolean;
  /** Content to display */
  children: ReactNode;
  /** Additional inline styles */
  style?: CSSProperties;
  /** CSS class */
  className?: string;
}

const defaultStyle: CSSProperties = {
  background: 'var(--oculus-panel-bg, rgba(10, 10, 10, 0.85))',
  border: '1px solid var(--oculus-border, rgba(245, 169, 127, 0.4))',
  borderRadius: 8,
  padding: '8px 12px',
  color: 'var(--oculus-text, #f7f7f7)',
  fontFamily: 'var(--oculus-font-ui, Inter, sans-serif)',
  fontSize: 12,
  backdropFilter: 'blur(8px)',
  pointerEvents: 'auto' as const,
  maxWidth: 300,
};

export function Billboard3D({
  position,
  distanceFactor = 10,
  occlude = false,
  visible = true,
  children,
  style,
  className = '',
}: Billboard3DProps) {
  if (!dreiHtml || !visible) return null;

  // Use createElement to avoid needing R3F JSX type declarations
  // <group> is an R3F intrinsic element available inside <Canvas>
  return createElement(
    'group' as any,
    { position },
    createElement(
      dreiHtml,
      {
        center: true,
        distanceFactor,
        occlude,
        style: { ...defaultStyle, ...style },
        className: `oculus-billboard ${className}`,
      },
      children,
    ),
  );
}
