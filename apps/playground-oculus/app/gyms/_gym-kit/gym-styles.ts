/**
 * Gym Kit — Style factories for interactive sandbox pages.
 *
 * Imports universal factories from zoo-kit and adds gym-specific ones.
 */

import type { CSSProperties } from 'react';

// Re-export universal factories from zoo-kit
export { countStyle, sectionHeaderStyle, tabStyle } from '../../zoos/_zoo-kit/zoo-styles';

// ── Control Panel ───────────────────────────────────────

export const controlPanelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  padding: '1rem',
  background: '#111',
  borderRadius: 8,
  border: '1px solid #222',
};

// ── Viewport ────────────────────────────────────────────

export function viewportStyle(gradient: string): CSSProperties {
  return {
    position: 'relative',
    width: '100%',
    height: '60vh',
    minHeight: 400,
    background: gradient,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #222',
  };
}

export const viewportWatermarkStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.1,
  fontSize: '8rem',
  userSelect: 'none',
  pointerEvents: 'none',
};

// ── Wiretap Panel ───────────────────────────────────────

export const wiretapContainerStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  background: '#111',
  borderRadius: 8,
  border: '1px solid #222',
  overflow: 'hidden',
  minWidth: 0,
};

export const wiretapHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid #222',
  fontSize: '0.75rem',
  fontWeight: 600,
};

export const wiretapListStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  maxHeight: 200,
  scrollBehavior: 'smooth',
  fontFamily: 'var(--font-geist-mono, monospace)',
  fontSize: '0.7rem',
};

export function wiretapEntryStyle(index: number): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.25rem 0.75rem',
    background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
    borderBottom: '1px solid #1a1a1a',
  };
}

// ── State Dashboard ─────────────────────────────────────

export const stateDashContainerStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  background: '#111',
  borderRadius: 8,
  border: '1px solid #222',
  overflow: 'hidden',
  minWidth: 0,
};

export const stateDashHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid #222',
  fontSize: '0.75rem',
  fontWeight: 600,
};

export const stateDashListStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  maxHeight: 200,
  padding: '0.5rem 0.75rem',
  fontSize: '0.75rem',
  fontFamily: 'var(--font-geist-mono, monospace)',
};

export function stateDashRowStyle(changed: boolean): CSSProperties {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.2rem 0',
    transition: 'background 0.3s',
    background: changed ? 'rgba(245,169,127,0.15)' : 'transparent',
    borderRadius: 2,
  };
}

// ── Shared button style ─────────────────────────────────

export const gymBtnStyle: CSSProperties = {
  padding: '0.4rem 0.8rem',
  border: '1px solid #444',
  borderRadius: 4,
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  fontSize: '0.75rem',
};
