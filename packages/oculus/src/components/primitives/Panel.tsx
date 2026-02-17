/**
 * Panel — Glass-morphism container with optional border glow
 */

import type { CSSProperties, ReactNode } from 'react';
import { useInputCapture } from '../../hooks/useInputCapture';

export interface PanelProps {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  glow?: boolean;
  noPadding?: boolean;
  style?: CSSProperties;
  /** Accessible label for the panel region */
  'aria-label'?: string;
}

export function Panel({
  children,
  className = '',
  compact = false,
  glow = false,
  noPadding = false,
  style,
  'aria-label': ariaLabel,
}: PanelProps) {
  const { onPointerEnter, onPointerLeave } = useInputCapture();

  const classes = [
    'oculus-panel',
    compact && 'oculus-panel--compact',
    glow && 'oculus-panel--glow',
    noPadding && 'oculus-panel--no-padding',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={style}
      role={ariaLabel ? 'region' : undefined}
      aria-label={ariaLabel}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>
  );
}
