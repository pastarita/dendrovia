/**
 * Zoo Kit — Shared style factories.
 *
 * All zoo pages share the same visual vocabulary:
 * tabs, cards, inspector panels, etc. These factories
 * produce inline CSSProperties so we stay framework-agnostic.
 */

import type { CSSProperties } from 'react';

// ── Accent ───────────────────────────────────────────

const ACCENT = 'var(--pillar-accent, #f5a97f)';
const ACCENT_15 = 'rgba(245,169,127,0.15)';
const ACCENT_60 = 'rgba(245,169,127,0.6)';

// ── Tab Button ───────────────────────────────────────

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

// ── Card ─────────────────────────────────────────────

export function cardStyle(selected: boolean): CSSProperties {
  return {
    padding: '1rem',
    border: selected ? `1px solid ${ACCENT_60}` : '1px solid #222',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    background: selected ? 'rgba(245,169,127,0.06)' : 'transparent',
  };
}

// ── List Row ─────────────────────────────────────────

export function listRowStyle(selected: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1rem',
    border: selected ? `1px solid ${ACCENT_60}` : '1px solid #222',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    background: selected ? 'rgba(245,169,127,0.06)' : 'transparent',
  };
}

// ── Inspector Panel ──────────────────────────────────

export const inspectorStyle: CSSProperties = {
  width: 380,
  borderLeft: '1px solid #222',
  padding: '1.25rem',
  overflowY: 'auto',
  flexShrink: 0,
};

// ── Section Header ───────────────────────────────────

export const sectionHeaderStyle: CSSProperties = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.4,
  marginBottom: '0.5rem',
  marginTop: '1.25rem',
};

// ── Category Badge ───────────────────────────────────

export function categoryBadgeStyle(): CSSProperties {
  return {
    display: 'inline-block',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.65rem',
    border: '1px solid #333',
    opacity: 0.6,
  };
}

// ── Empty State ──────────────────────────────────────

export const emptyStateStyle: CSSProperties = {
  textAlign: 'center',
  padding: '3rem',
  opacity: 0.4,
};

// ── Count Label ──────────────────────────────────────

export const countStyle: CSSProperties = {
  marginLeft: 'auto',
  fontSize: '0.8rem',
  opacity: 0.4,
};
