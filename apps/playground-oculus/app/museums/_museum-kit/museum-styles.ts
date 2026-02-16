/**
 * Museum Kit — Style factories for read-only exhibition pages.
 *
 * Imports universal factories from zoo-kit and adds museum-specific ones.
 */

import type { CSSProperties } from 'react';

// Re-export universal factories from zoo-kit
export { tabStyle, sectionHeaderStyle, countStyle } from '../../zoos/_zoo-kit/zoo-styles';

// ── Exhibit Row ─────────────────────────────────────────

export function exhibitRowStyle(selected: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    border: selected ? '1px solid var(--pillar-accent, #f5a97f)' : '1px solid #222',
    borderRadius: 6,
    background: selected ? 'rgba(34,197,94,0.08)' : 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left' as const,
    width: '100%',
    transition: 'border-color 0.2s, background 0.2s',
  };
}

// ── Detail Panel ────────────────────────────────────────

export const detailPanelStyle: CSSProperties = {
  padding: '1.25rem',
  border: '1px solid #333',
  borderRadius: 8,
  background: '#111',
  position: 'sticky',
  top: '1rem',
  alignSelf: 'start',
};

// ── Group Header ────────────────────────────────────────

export const groupHeaderStyle: CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  opacity: 0.4,
  padding: '0.75rem 0 0.25rem 0',
  borderBottom: '1px solid #1a1a1a',
  marginBottom: '0.25rem',
};

// ── Search Input ────────────────────────────────────────

export const searchContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '1rem',
};

export const searchInputStyle: CSSProperties = {
  flex: 1,
  padding: '0.4rem 0.6rem',
  background: '#111',
  border: '1px solid #333',
  borderRadius: 4,
  color: 'inherit',
  fontSize: '0.8rem',
  outline: 'none',
};

// ── Badge ───────────────────────────────────────────────

export function badgeStyle(color?: string): CSSProperties {
  return {
    fontSize: '0.7rem',
    padding: '0.1rem 0.4rem',
    background: color ? `${color}20` : '#222',
    border: color ? `1px solid ${color}40` : '1px solid #333',
    borderRadius: 3,
    color: color ?? 'inherit',
    fontFamily: 'var(--font-geist-mono, monospace)',
  };
}

// ── Color Dot ───────────────────────────────────────────

export function dotStyle(color: string): CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  };
}
