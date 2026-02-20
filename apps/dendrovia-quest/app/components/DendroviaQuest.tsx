'use client';

/**
 * DendroviaQuest — Unified App Shell
 *
 * Composes all six Dendrovia pillars into a single component tree:
 *
 *   BootstrapProvider  (init pipeline: topology + LUDUS + events)
 *     └─ OculusProvider  (EventBus → Zustand bridge)
 *          └─ DendroviaShell  (3D canvas + HUD overlay)
 *
 * Each pillar is independently disablable. The 3D scene always renders.
 */

import { useEffect, type ReactNode } from 'react';
import type { CharacterClass } from '@dendrovia/shared';
import { OculusProvider, useOculusStore, WelcomeScreen, OnboardingHints, useOnboarding } from '@dendrovia/oculus';
import { BootstrapProvider, useBootstrap } from './BootstrapProvider';
import { DendroviaShell } from './DendroviaShell';

// ─── Configuration ────────────────────────────────────────────

export interface WorldMeta {
  name: string;
  owner: string;
  repo: string;
  description: string;
  tincture: { hex: string; name: string };
}

export interface DendroviaQuestProps {
  /** Path to CHRONOS topology JSON (optional) */
  topologyPath?: string;
  /** Path to IMAGINARIUM manifest (default: /generated/manifest.json) */
  manifestPath?: string;
  /** Enable OPERATUS infrastructure (default: false — requires server-side setup) */
  enableOperatus?: boolean;
  /** Enable LUDUS game session (default: true) */
  enableLudus?: boolean;
  /** Enable OCULUS HUD overlay (default: true) */
  enableOculus?: boolean;
  /** Character class for LUDUS (default: 'dps') */
  characterClass?: CharacterClass;
  /** Character name (default: 'Explorer') */
  characterName?: string;
  /** Metadata about the world being explored */
  worldMeta?: WorldMeta;
  /** Children rendered inside the OCULUS provider, after HUD */
  children?: ReactNode;
}

// ─── Loading Screen ───────────────────────────────────────────

function LoadingScreen({ message }: { message: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f5a97f',
        fontFamily: "var(--oculus-font-ui, 'Inter', -apple-system, sans-serif)",
        position: 'relative',
      }}
    >
      <div className="shader-bg" />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <svg viewBox="0 0 32 32" width={48} height={48} style={{ marginBottom: '1rem', opacity: 0.9 }}>
          <circle cx="16" cy="16" r="15" fill="#1a1514" stroke="#4a3822" strokeWidth="1"/>
          <path d="M16 28L16 13" stroke="#f5e6d3" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M16 13Q11 9 6 5" stroke="#c77b3f" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M16 13Q12 11 8 8" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M16 13Q14 8 12 4" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M16 13Q18 8 20 4" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M16 13Q20 11 24 8" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M16 13Q21 9 26 5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <circle cx="6" cy="5" r="1.5" fill="#c77b3f"/>
          <circle cx="8" cy="8" r="1.5" fill="#6b7280"/>
          <circle cx="12" cy="4" r="1.5" fill="#A855F7"/>
          <circle cx="20" cy="4" r="1.5" fill="#3B82F6"/>
          <circle cx="24" cy="8" r="1.5" fill="#EF4444"/>
          <circle cx="26" cy="5" r="1.5" fill="#22C55E"/>
          <path d="M16 28Q14 30 13 29" stroke="#4a3822" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
          <path d="M16 28Q18 30 19 29" stroke="#4a3822" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
        </svg>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem', letterSpacing: '0.15em' }}>DENDROVIA</div>
        <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>{message}</div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: '1.5rem' }}>
          {['#c77b3f', '#6b7280', '#A855F7', '#3B82F6', '#EF4444', '#22C55E'].map((c, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Inner shell (has access to BootstrapContext) ─────────────

function DendroviaQuestInner({
  manifestPath,
  enableOculus,
  worldMeta,
  children,
}: {
  manifestPath: string;
  enableOculus: boolean;
  worldMeta?: WorldMeta;
  children?: ReactNode;
}) {
  const { eventBus } = useBootstrap();
  const onboarding = useOnboarding();

  // Push worldMeta into OCULUS store
  useEffect(() => {
    useOculusStore.getState().setWorldMeta(worldMeta ?? null);
  }, [worldMeta]);

  const shell = (
    <DendroviaShell manifestPath={manifestPath} enableOculus={enableOculus}>
      {enableOculus && onboarding.phase === 'exploring' && (
        <OnboardingHints onboarding={onboarding} />
      )}
      {onboarding.phase === 'welcome' && (
        <WelcomeScreen onEnter={onboarding.dismissWelcome} />
      )}
      {children}
    </DendroviaShell>
  );

  if (enableOculus) {
    return (
      <OculusProvider eventBus={eventBus}>
        {shell}
      </OculusProvider>
    );
  }

  return shell;
}

// ─── Main Component ───────────────────────────────────────────

export function DendroviaQuest({
  topologyPath,
  manifestPath = '/generated/manifest.json',
  enableOperatus = false,
  enableLudus = true,
  enableOculus = true,
  characterClass = 'dps',
  characterName = 'Explorer',
  worldMeta,
  children,
}: DendroviaQuestProps) {
  return (
    <BootstrapProvider
      topologyPath={topologyPath}
      manifestPath={manifestPath}
      enableOperatus={enableOperatus}
      enableLudus={enableLudus}
      characterClass={characterClass}
      characterName={characterName}
      loadingScreen={(msg) => <LoadingScreen message={msg} />}
    >
      <DendroviaQuestInner
        manifestPath={manifestPath}
        enableOculus={enableOculus}
        worldMeta={worldMeta}
      >
        {children}
      </DendroviaQuestInner>
    </BootstrapProvider>
  );
}
