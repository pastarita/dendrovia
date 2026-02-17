/**
 * OrnateFrame — Composable SVG-overlay frame with pillar-specific ornaments
 *
 * Wraps children with decorative corners, edges, header slots, and
 * animated glow driven by a `pillar` prop and `variant` size class.
 * Sits alongside Panel (doesn't replace it).
 */

import { type CSSProperties, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { useInputCapture } from '../../hooks/useInputCapture';
import type { FrameVariant, PillarId } from './frames';
import { FRAME_ORNAMENTS, PILLAR_PALETTES } from './frames';

export interface OrnateFrameProps {
  children: ReactNode;
  /** Which pillar's ornamental vocabulary to use */
  pillar?: PillarId;
  /** Size class controlling corner size, padding, edges, and glow */
  variant?: FrameVariant;
  /** Header slot content (rendered only for modal variant) */
  header?: ReactNode;
  /** Icon rendered left of header text */
  headerIcon?: ReactNode;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

const CORNER_SIZES: Record<FrameVariant, number> = {
  modal: 32,
  panel: 24,
  compact: 16,
  tooltip: 8,
};

const SHOW_EDGES: Record<FrameVariant, boolean> = {
  modal: true,
  panel: true,
  compact: false,
  tooltip: false,
};

export function OrnateFrame({
  children,
  pillar = 'oculus',
  variant = 'panel',
  header,
  headerIcon,
  className = '',
  style,
  'aria-label': ariaLabel,
}: OrnateFrameProps) {
  const uid = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number]>([0, 0]);
  const { onPointerEnter, onPointerLeave } = useInputCapture();

  // Track container dimensions via ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setSize([Math.round(width), Math.round(height)]);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [w, h] = size;
  const cornerSize = CORNER_SIZES[variant];
  const showEdges = SHOW_EDGES[variant];
  const ornaments = FRAME_ORNAMENTS[pillar];
  const palette = PILLAR_PALETTES[pillar];

  // Sanitize useId() output for SVG ID refs (colons are invalid in url(#...))
  const id = uid.replace(/:/g, '_');

  const classes = ['ornate-frame', `ornate-frame--${variant}`, className].filter(Boolean).join(' ');

  const frameStyle: CSSProperties = {
    ...style,
    '--frame-glow': palette.glow,
  } as CSSProperties;

  return (
    <div
      ref={containerRef}
      className={classes}
      style={frameStyle}
      role={ariaLabel ? 'region' : undefined}
      aria-label={ariaLabel}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* SVG ornament overlay */}
      {w > 0 && h > 0 && (
        <svg
          className="ornate-frame__svg"
          viewBox={`0 0 ${w} ${h}`}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <ornaments.Defs id={id} palette={palette} />

          {/* Corners: TL, TR, BL, BR */}
          <ornaments.Corner id={id} x={0} y={0} size={cornerSize} mirror={[false, false]} palette={palette} />
          <ornaments.Corner id={id} x={w} y={0} size={cornerSize} mirror={[true, false]} palette={palette} />
          <ornaments.Corner id={id} x={0} y={h} size={cornerSize} mirror={[false, true]} palette={palette} />
          <ornaments.Corner id={id} x={w} y={h} size={cornerSize} mirror={[true, true]} palette={palette} />

          {/* Edges (modal + panel only) */}
          {showEdges && (
            <>
              <ornaments.EdgeH id={id} x={cornerSize} y={0} length={w - cornerSize * 2} palette={palette} />
              <ornaments.EdgeH id={id} x={cornerSize} y={h} length={w - cornerSize * 2} palette={palette} />
              <ornaments.EdgeV id={id} x={0} y={cornerSize} length={h - cornerSize * 2} palette={palette} />
              <ornaments.EdgeV id={id} x={w} y={cornerSize} length={h - cornerSize * 2} palette={palette} />
            </>
          )}
        </svg>
      )}

      {/* Header slot (modal variant only) */}
      {variant === 'modal' && header && (
        <div className="ornate-frame__header">
          {headerIcon && <span className="ornate-frame__header-icon">{headerIcon}</span>}
          {header}
        </div>
      )}

      {/* Content */}
      <div className="ornate-frame__content">{children}</div>
    </div>
  );
}
