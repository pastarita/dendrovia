'use client';

/**
 * OnboardingHints — Sequential contextual hint system
 *
 * Shows non-blocking tooltips at key moments during the user's
 * first session. Hints are pointer-events: none, positioned near
 * relevant UI areas, and auto-dismiss after a timeout.
 */

import React, { useState, useEffect, useRef, type CSSProperties } from 'react';
import { useOculusStore } from '../store/useOculusStore';
import { Panel } from './primitives/Panel';
import type { UseOnboardingReturn } from '../hooks/useOnboarding';

export interface OnboardingHintsProps {
  onboarding: UseOnboardingReturn;
}

// ── Hint definitions ──────────────────────────────────

interface HintDef {
  id: string;
  text: string;
  position: CSSProperties;
  autoDismissMs: number;
  /** ID of hint that must have been shown first (null = first hint) */
  after: string | null;
  /** Additional delay (ms) after the previous hint was shown */
  delayMs: number;
}

const HINT_DEFS: HintDef[] = [
  {
    id: 'orbit',
    text: 'Drag to orbit the tree. Scroll to zoom in.',
    position: { bottom: 'var(--oculus-space-2xl)', left: '50%', transform: 'translateX(-50%)' },
    autoDismissMs: 8000,
    after: null,
    delayMs: 500,
  },
  {
    id: 'node-click',
    text: 'Click a glowing node to explore a file.',
    position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    autoDismissMs: 10000,
    after: 'orbit',
    delayMs: 3000,
  },
  {
    id: 'code-reader',
    text: 'Press Esc to close. Press M for the full file browser.',
    position: { top: 'var(--oculus-space-2xl)', left: '50%', transform: 'translateX(-50%)' },
    autoDismissMs: 8000,
    after: 'node-click',
    delayMs: 0, // triggered by activePanel === 'code-reader'
  },
  {
    id: 'quest-log',
    text: 'Press Q to view your quest log.',
    position: { bottom: 'var(--oculus-space-2xl)', left: 'var(--oculus-space-lg)' },
    autoDismissMs: 8000,
    after: 'code-reader',
    delayMs: 1000,
  },
  {
    id: 'complete',
    text: "You're ready. Explore freely.",
    position: { bottom: 'var(--oculus-space-2xl)', left: '50%', transform: 'translateX(-50%)' },
    autoDismissMs: 5000,
    after: 'quest-log',
    delayMs: 500,
  },
];

// ── Hint Card ─────────────────────────────────────────

function HintCard({
  text,
  position,
  onDismiss,
}: {
  text: string;
  position: CSSProperties;
  onDismiss: () => void;
}) {
  const [exiting, setExiting] = useState(false);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 150);
  };

  return (
    <div
      className={exiting ? 'oculus-exit-fade' : ''}
      style={{
        position: 'absolute',
        ...position,
        pointerEvents: 'none',
        zIndex: 15,
        animation: 'oculus-slide-up var(--oculus-transition-base)',
      }}
    >
      <Panel
        compact
        style={{
          borderLeft: '3px solid var(--oculus-amber)',
          maxWidth: 320,
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
        aria-label="Onboarding hint"
      >
        <div
          onClick={handleDismiss}
          style={{
            fontSize: 'var(--oculus-font-sm)',
            color: 'var(--oculus-text)',
            lineHeight: 1.5,
          }}
        >
          {text}
        </div>
      </Panel>
    </div>
  );
}

// ── Main Component ────────────────────────────────────

export function OnboardingHints({ onboarding }: OnboardingHintsProps) {
  const { markHintShown, isHintShown, completeOnboarding } = onboarding;
  const activePanel = useOculusStore((s) => s.activePanel);

  // Track which hint is currently visible
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Sequencing logic: determine which hint should show next
  useEffect(() => {
    if (activeHint) return; // one hint at a time

    for (const hint of HINT_DEFS) {
      // Already shown?
      if (isHintShown(hint.id)) continue;

      // Previous hint must have been shown first
      if (hint.after !== null && !isHintShown(hint.after)) continue;

      // Special trigger: code-reader hint waits for code-reader panel
      if (hint.id === 'code-reader' && activePanel !== 'code-reader') continue;

      // Special trigger: quest-log hint waits for code-reader to close
      if (hint.id === 'quest-log' && activePanel === 'code-reader') continue;

      // Schedule this hint after its delay
      const timer = setTimeout(() => {
        setActiveHint(hint.id);
      }, hint.delayMs);
      timersRef.current.push(timer);
      return; // only schedule one hint at a time
    }
  }, [activeHint, isHintShown, activePanel]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!activeHint) return;

    const def = HINT_DEFS.find((h) => h.id === activeHint);
    if (!def) return;

    const timer = setTimeout(() => {
      dismissHint(activeHint);
    }, def.autoDismissMs);
    timersRef.current.push(timer);

    return () => clearTimeout(timer);
  }, [activeHint]);

  function dismissHint(id: string) {
    markHintShown(id);
    setActiveHint(null);

    // If this was the last hint, complete onboarding
    if (id === 'complete') {
      completeOnboarding();
    }
  }

  if (!activeHint) return null;

  const def = HINT_DEFS.find((h) => h.id === activeHint);
  if (!def) return null;

  return (
    <HintCard
      key={def.id}
      text={def.text}
      position={def.position}
      onDismiss={() => dismissHint(def.id)}
    />
  );
}
