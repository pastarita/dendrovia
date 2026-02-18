/**
 * Distill Kit — Style factories for IMAGINARIUM's computational generation pages.
 *
 * Follows the zoo-styles pattern from OCULUS but with IMAGINARIUM's
 * purpure tincture (#A855F7) as accent. When IMAGINARIUM ports the
 * zoo-kit in P2, these universal factories will be refactored to
 * re-export from a shared base — same as gym-styles and museum-styles
 * do in OCULUS.
 */

import type { CSSProperties } from 'react';

// ── Accent (Purpure) ────────────────────────────────

const ACCENT = '#A855F7';
const ACCENT_15 = 'rgba(168,85,247,0.15)';
const ACCENT_30 = 'rgba(168,85,247,0.3)';
const ACCENT_60 = 'rgba(168,85,247,0.6)';

// ── Tab Button (universal, shared with future zoo/museum ports) ──

export function tabStyle(active: boolean): CSSProperties {
  return {
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    border: active ? `1px solid ${ACCENT_60}` : '1px solid #333',
    background: active ? ACCENT_15 : 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.2s',
  };
}

// ── Section Header (universal) ───────────────────────

export const sectionHeaderStyle: CSSProperties = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.4,
  marginBottom: '0.5rem',
  marginTop: '1.25rem',
};

// ── Count Label (universal) ──────────────────────────

export const countStyle: CSSProperties = {
  marginLeft: 'auto',
  fontSize: '0.8rem',
  opacity: 0.4,
};

// ── Control Panel ────────────────────────────────────

export const controlPanelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  padding: '1rem',
  background: '#111',
  borderRadius: 8,
  border: '1px solid #222',
};

// ── Shader Viewport ──────────────────────────────────

export function viewportStyle(height?: string): CSSProperties {
  return {
    position: 'relative',
    width: '100%',
    height: height ?? '50vh',
    minHeight: 300,
    background: 'linear-gradient(135deg, #0a0412, #1a0a2e, #0a0a14)',
    borderRadius: 12,
    overflow: 'hidden',
    border: `1px solid ${ACCENT_30}`,
  };
}

export const viewportCanvasStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
};

export const viewportOverlayStyle: CSSProperties = {
  position: 'absolute',
  bottom: '0.75rem',
  right: '0.75rem',
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
  fontSize: '0.7rem',
  opacity: 0.5,
  fontFamily: 'var(--font-geist-mono, monospace)',
  pointerEvents: 'none',
};

export const viewportErrorStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '2rem',
  fontSize: '0.8rem',
  color: '#EF4444',
  textAlign: 'center',
};

export const viewportWatermarkStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.06,
  fontSize: '8rem',
  userSelect: 'none',
  pointerEvents: 'none',
};

// ── Pipeline Trace ───────────────────────────────────

export const traceContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: '#111',
  borderRadius: 8,
  border: '1px solid #222',
  overflow: 'hidden',
};

export const traceHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid #222',
  fontSize: '0.75rem',
  fontWeight: 600,
};

export function traceStepStyle(status: string): CSSProperties {
  const bg =
    status === 'running' ? 'rgba(168,85,247,0.08)' :
    status === 'error' ? 'rgba(239,68,68,0.08)' :
    'transparent';
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.4rem 0.75rem',
    background: bg,
    borderBottom: '1px solid #1a1a1a',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-geist-mono, monospace)',
    transition: 'background 0.3s',
  };
}

export function stepStatusDotStyle(status: string): CSSProperties {
  const colors: Record<string, string> = {
    pending: '#444',
    running: ACCENT,
    complete: '#22C55E',
    error: '#EF4444',
    skipped: '#666',
  };
  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: colors[status] ?? '#444',
    flexShrink: 0,
    transition: 'background 0.3s',
  };
}

// ── GLSL Code Block ──────────────────────────────────

export const glslBlockStyle: CSSProperties = {
  background: '#0a0a0a',
  borderRadius: 6,
  padding: '0.75rem',
  fontSize: '0.72rem',
  lineHeight: 1.5,
  fontFamily: 'var(--font-geist-mono, monospace)',
  overflowX: 'auto',
  whiteSpace: 'pre',
  color: '#c8c8c8',
  border: '1px solid #1a1a1a',
  maxHeight: 200,
  overflowY: 'auto',
};

// ── Palette Swatch ───────────────────────────────────

export function swatchStyle(color: string, selected?: boolean): CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 6,
    background: color,
    border: selected ? `2px solid ${ACCENT}` : '2px solid #333',
    cursor: 'pointer',
    transition: 'border-color 0.2s, transform 0.2s',
    transform: selected ? 'scale(1.1)' : 'scale(1)',
  };
}

// ── Button Styles ────────────────────────────────────

export const distillBtnStyle: CSSProperties = {
  padding: '0.4rem 0.8rem',
  border: `1px solid ${ACCENT_30}`,
  borderRadius: 4,
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  fontSize: '0.75rem',
  transition: 'background 0.2s, border-color 0.2s',
};

export const distillBtnPrimaryStyle: CSSProperties = {
  padding: '0.4rem 0.8rem',
  border: `1px solid ${ACCENT_60}`,
  borderRadius: 4,
  background: ACCENT_15,
  color: 'inherit',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: 600,
  transition: 'background 0.2s, border-color 0.2s',
};

// ── Card ─────────────────────────────────────────────

export function cardStyle(selected: boolean): CSSProperties {
  return {
    padding: '1rem',
    border: selected ? `1px solid ${ACCENT_60}` : '1px solid #222',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    background: selected ? ACCENT_15 : 'transparent',
  };
}

// ── Empty State ──────────────────────────────────────

export const emptyStateStyle: CSSProperties = {
  textAlign: 'center',
  padding: '3rem',
  opacity: 0.4,
};

// ── Label + Input (shared for controls) ──────────────

export const controlLabelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.8rem',
};

export const controlInputStyle: CSSProperties = {
  background: '#111',
  border: '1px solid #333',
  borderRadius: '4px',
  padding: '0.25rem 0.5rem',
  color: 'inherit',
  fontSize: '0.8rem',
};

export const controlSelectStyle: CSSProperties = {
  background: '#111',
  border: '1px solid #333',
  borderRadius: '4px',
  padding: '0.3rem 0.5rem',
  color: 'inherit',
  fontSize: '0.8rem',
  cursor: 'pointer',
};
