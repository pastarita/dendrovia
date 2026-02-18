'use client';

/**
 * WelcomeScreen — Full-screen onboarding modal overlay
 *
 * Appears after loading completes, before the user interacts with the world.
 * The 3D scene renders behind it (visible through the semi-transparent backdrop).
 */

import React, { useState, useCallback, type CSSProperties } from 'react';
import { OrnateFrame } from './primitives/OrnateFrame';

export interface WelcomeScreenProps {
  onEnter: () => void;
}

const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 'var(--oculus-z-modal, 200)' as any,
  background: 'rgba(0, 0, 0, 0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--oculus-space-xl)',
  pointerEvents: 'auto',
};

const containerStyle: CSSProperties = {
  maxWidth: 520,
  width: '100%',
  animation: 'oculus-scale-in var(--oculus-transition-dramatic)',
};

const loreStyle: CSSProperties = {
  fontSize: 'var(--oculus-font-base)',
  color: 'var(--oculus-text-muted)',
  lineHeight: 1.6,
  marginBottom: 'var(--oculus-space-lg)',
};

const sectionHeadingStyle: CSSProperties = {
  fontSize: 'var(--oculus-font-sm)',
  color: 'var(--oculus-amber)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 'var(--oculus-space-sm)',
};

const featureRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--oculus-space-sm)',
  fontSize: 'var(--oculus-font-sm)',
  color: 'var(--oculus-text)',
  lineHeight: 2,
};

const controlsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 'var(--oculus-space-xs) var(--oculus-space-lg)',
  fontSize: 'var(--oculus-font-xs)',
  color: 'var(--oculus-text-muted)',
  lineHeight: 2,
  marginBottom: 'var(--oculus-space-lg)',
};

const controlItemStyle: CSSProperties = {
  display: 'flex',
  gap: 'var(--oculus-space-sm)',
};

const kbdStyle: CSSProperties = {
  color: 'var(--oculus-peach)',
  fontFamily: 'var(--oculus-font-code)',
  minWidth: 48,
};

const enterButtonStyle: CSSProperties = {
  width: '100%',
  padding: 'var(--oculus-space-md) var(--oculus-space-xl)',
  background: 'var(--oculus-amber)',
  color: 'var(--oculus-bg-solid)',
  border: 'none',
  borderRadius: 'var(--oculus-panel-radius)',
  fontSize: 'var(--oculus-font-lg)',
  fontWeight: 600,
  cursor: 'pointer',
  animation: 'oculus-pulse-glow 2s ease-in-out infinite',
};

const skipStyle: CSSProperties = {
  marginTop: 'var(--oculus-space-md)',
  textAlign: 'center',
  fontSize: 'var(--oculus-font-xs)',
  color: 'var(--oculus-text-muted)',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  opacity: 0.6,
};

const FEATURES = [
  { icon: '\u{1F333}', label: 'Your codebase, grown into a living tree' },
  { icon: '\u{2694}\u{FE0F}', label: 'Quests generated from your git history' },
  { icon: '\u{1F525}', label: 'Hotspots \u2014 the most volatile files \u2014 glow red' },
];

const CONTROLS: [string, string][] = [
  ['Drag', 'Orbit'],
  ['Scroll', 'Zoom'],
  ['Click', 'Select'],
  ['Q', 'Quests'],
  ['M', 'File Browser'],
  ['Esc', 'Close'],
];

export function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const [exiting, setExiting] = useState(false);

  const handleEnter = useCallback(() => {
    setExiting(true);
    // Let exit animation play, then notify parent
    const timer = setTimeout(() => onEnter(), 200);
    return () => clearTimeout(timer);
  }, [onEnter]);

  return (
    <div
      className={exiting ? 'oculus-exit-fade' : ''}
      style={backdropStyle}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Dendrovia"
    >
      <div style={containerStyle}>
        <OrnateFrame
          variant="modal"
          pillar="oculus"
          header="Welcome to the Forest"
        >
          <div className="oculus-stagger">
            {/* Lore */}
            <p style={loreStyle}>
              Every codebase tells a story. Dendrovia transforms yours into a
              living forest — files become branches, commits become quests, and
              the most volatile code glows with danger.
            </p>

            {/* What You'll See */}
            <div style={{ marginBottom: 'var(--oculus-space-lg)' }}>
              <div style={sectionHeadingStyle}>What You'll See</div>
              {FEATURES.map((f) => (
                <div key={f.label} style={featureRowStyle}>
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div>
              <div style={sectionHeadingStyle}>Controls</div>
              <div style={controlsGridStyle}>
                {CONTROLS.map(([key, action]) => (
                  <div key={key} style={controlItemStyle}>
                    <span style={kbdStyle}>{key}</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enter Button */}
            <button
              style={enterButtonStyle}
              onClick={handleEnter}
              autoFocus
            >
              Enter the Forest
            </button>

            {/* Skip */}
            <button style={skipStyle} onClick={handleEnter}>
              Skip
            </button>
          </div>
        </OrnateFrame>
      </div>
    </div>
  );
}
