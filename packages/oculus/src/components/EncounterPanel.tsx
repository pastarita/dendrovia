'use client';

/**
 * EncounterPanel — Slot-based encounter shell
 *
 * Pure presentational component supporting combat, dialogue,
 * lore, and puzzle encounter types via named slots.
 * Zero store reads — all data flows via props.
 */

import React, { type ReactNode } from 'react';
import { Panel } from './primitives/Panel';

export interface EncounterSlots {
  portrait?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  feedback?: ReactNode;
  info?: ReactNode;
}

export type EncounterType = 'combat' | 'dialogue' | 'lore' | 'puzzle';
export type EncounterLayout = 'standard' | 'compact' | 'boss';

export interface EncounterPanelProps {
  type: EncounterType;
  active: boolean;
  slots: EncounterSlots;
  title?: string;
  layout?: EncounterLayout;
  children?: ReactNode;
}

const typeLabels: Record<EncounterType, string> = {
  combat: 'Combat',
  dialogue: 'Dialogue',
  lore: 'Lore',
  puzzle: 'Puzzle',
};

export function EncounterPanel({
  type,
  active,
  slots,
  title,
  layout = 'standard',
  children,
}: EncounterPanelProps) {
  if (!active) return null;

  const isCompact = layout === 'compact';
  const heading = title ?? typeLabels[type];

  return (
    <Panel
      glow
      className={`oculus-encounter oculus-encounter--${type} oculus-encounter--${layout}`}
      aria-label={`${heading} encounter`}
      style={{
        width: isCompact ? 'min(400px, 90vw)' : 'min(600px, 90vw)',
        animation: 'oculus-scale-in var(--oculus-transition-dramatic)',
      }}
    >
      {/* ── Portrait / Enemy Section ─────────────── */}
      {slots.portrait && (
        <div
          className="oculus-encounter__portrait"
          style={{ marginBottom: 'var(--oculus-space-lg)' }}
        >
          {slots.portrait}
        </div>
      )}

      {/* ── Status Section (HP, timers, etc.) ──── */}
      {slots.status && (
        <div
          className="oculus-encounter__status"
          style={{ marginBottom: 'var(--oculus-space-md)' }}
        >
          {slots.status}
        </div>
      )}

      {/* ── Extra content between status and actions */}
      {children}

      {/* ── Actions Section ──────────────────────── */}
      {slots.actions && (
        <div
          className="oculus-encounter__actions"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--oculus-space-sm)',
            marginBottom: 'var(--oculus-space-lg)',
          }}
          role="toolbar"
          aria-label={`${heading} actions`}
        >
          {slots.actions}
        </div>
      )}

      {/* ── Feedback Section (log, history) ──────── */}
      {slots.feedback && (
        <div
          className="oculus-encounter__feedback oculus-scrollable"
          style={{
            maxHeight: 150,
            borderTop: '1px solid var(--oculus-border)',
            paddingTop: 'var(--oculus-space-sm)',
          }}
          role="log"
          aria-label={`${heading} log`}
          aria-live="polite"
        >
          {slots.feedback}
        </div>
      )}

      {/* ── Info Section (supplementary) ─────────── */}
      {slots.info && (
        <div
          className="oculus-encounter__info"
          style={{
            marginTop: 'var(--oculus-space-md)',
            fontSize: 'var(--oculus-font-xs)',
            color: 'var(--oculus-text-muted)',
          }}
        >
          {slots.info}
        </div>
      )}
    </Panel>
  );
}
