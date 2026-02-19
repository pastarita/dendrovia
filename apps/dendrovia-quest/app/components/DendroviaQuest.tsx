'use client';

/**
 * DendroviaQuest — Unified App Shell
 *
 * Wires all six Dendrovia pillars together:
 *
 *   CHRONOS     → topology data (loaded from JSON)
 *   IMAGINARIUM → generated assets (via manifestPath)
 *   ARCHITECTUS → 3D canvas renderer
 *   OCULUS      → HUD overlay + UI components
 *   LUDUS       → game session + event wiring
 *   OPERATUS    → cache, persistence, cross-tab sync (requires enableOperatus + separate bundle)
 *
 * Each pillar integration is independently disablable: if a subsystem
 * fails to initialize, the others continue working. The 3D scene always
 * renders.
 */

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';

// ── Shared ────────────────────────────────────────────────────
import { getEventBus, GameEvents } from '@dendrovia/shared';
import type { EventBus, TopologyGeneratedEvent } from '@dendrovia/shared';
import type { FileTreeNode, Hotspot, ParsedFile, ParsedCommit, CharacterClass, ContributorProfile } from '@dendrovia/shared';

// ── ARCHITECTUS (3D renderer) ─────────────────────────────────
import { App as ArchitectusApp, useRendererStore, useSegmentStore } from '@dendrovia/architectus';

// ── OCULUS (UI layer) ─────────────────────────────────────────
import {
  OculusProvider,
  HUD,
  useOculusStore,
  WelcomeScreen,
  OnboardingHints,
  useOnboarding,
} from '@dendrovia/oculus';

// ── LUDUS (game logic) ────────────────────────────────────────
import {
  createGameStore,
  bridgeStoreToEventBus,
  createGameSession,
  wireGameEvents,
  createCharacter,
  generateQuestGraph,
  generateHotspotQuests,
  generateArchaeologyQuests,
  type GameSession,
  type GameStore,
} from '@dendrovia/ludus';

// NOTE: OPERATUS is NOT statically imported here because it uses node:fs/promises
// which webpack cannot bundle for the browser. When enableOperatus is needed,
// OPERATUS must be provided via a separate server-side integration or a webpack
// plugin that handles the node: scheme. For now the demo runs without it.

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
  // ── Onboarding ──
  const onboarding = useOnboarding();

  // ── Refs (persist across renders, no re-render on mutation) ──
  const eventBusRef = useRef<EventBus | null>(null);
  const gameSessionRef = useRef<GameSession | null>(null);
  const cleanupRef = useRef<Array<() => void>>([]);

  // ── State ──
  const [ready, setReady] = useState(false);
  const [initMessage, setInitMessage] = useState('Initializing...');
  const [topology, setTopology] = useState<FileTreeNode | undefined>(undefined);
  const [hotspots, setHotspots] = useState<Hotspot[] | undefined>(undefined);
  const [topologyError, setTopologyError] = useState<string | null>(null);

  // Lazily create EventBus singleton
  const getOrCreateEventBus = useCallback((): EventBus => {
    if (!eventBusRef.current) {
      eventBusRef.current = getEventBus();
    }
    return eventBusRef.current;
  }, []);

  // ── Push worldMeta into OCULUS store ──
  useEffect(() => {
    useOculusStore.getState().setWorldMeta(worldMeta ?? null);
  }, [worldMeta]);

  // ── Initialization pipeline ──
  useEffect(() => {
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    async function init() {
      const bus = getOrCreateEventBus();

      // Step 1: OPERATUS — skipped (requires node: builtins not available in browser)
      if (enableOperatus) {
        console.warn(
          '[DENDROVIA] OPERATUS is enabled but not available in the browser bundle. ' +
          'Set enableOperatus={false} or provide a server-side integration.'
        );
      }

      // Step 2: Load CHRONOS topology
      // When segmented loading is available (world index loaded by ARCHITECTUS),
      // skip the full 8.8MB topology.json — per-segment topology arrives on demand.
      // Only fetch the monolith as fallback when chunked manifest is unavailable.
      let chronosFiles: ParsedFile[] = [];
      let chronosCommits: ParsedCommit[] = [];
      let chronosHotspots: Hotspot[] = [];
      let chronosContributors: ContributorProfile[] = [];

      // Give ARCHITECTUS a moment to attempt world index loading
      const worldReady = useSegmentStore.getState().worldReady;

      if (topologyPath && !cancelled && !worldReady) {
        try {
          setInitMessage('Loading topology...');

          // Derive contributors path from topology path
          const contributorsPath = topologyPath.replace(/topology\.json$/, 'contributors.json');

          // Fetch topology and contributors in parallel
          const [topoRes, contribRes] = await Promise.all([
            fetch(topologyPath),
            fetch(contributorsPath).catch(() => null),
          ]);

          if (topoRes.ok && !cancelled) {
            const data = await topoRes.json();
            const tree = data.tree ?? data;
            if (!tree || (typeof tree === 'object' && !tree.name && !tree.path)) {
              const msg = 'Topology JSON loaded but missing tree structure (no .tree, .name, or .path)';
              console.error('[DENDROVIA]', msg, { keys: Object.keys(data) });
              setTopologyError(msg);
            } else {
              const spots: Hotspot[] = data.hotspots ?? [];
              chronosFiles = data.files ?? [];
              chronosCommits = data.commits ?? [];
              chronosHotspots = spots;
              setTopology(tree);
              setHotspots(spots);
              // T09: Emit topology to OCULUS via EventBus
              bus.emit<TopologyGeneratedEvent>(GameEvents.TOPOLOGY_GENERATED, {
                tree,
                hotspots: spots,
              });
            }
          } else if (!topoRes.ok) {
            const detail = await topoRes.text().catch(() => '');
            const msg = `Topology fetch failed: ${topoRes.status} ${topoRes.statusText}`;
            console.error('[DENDROVIA]', msg, topologyPath, detail);
            setTopologyError(msg);
          }

          if (contribRes?.ok && !cancelled) {
            chronosContributors = await contribRes.json();
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('[DENDROVIA] Failed to load topology from', topologyPath, msg);
          setTopologyError(`Topology load error: ${msg}`);
        }
      } else if (worldReady) {
        setInitMessage('World index loaded, topology on demand...');
      }

      // Step 3: LUDUS — game session + event wiring (with real CHRONOS data)
      if (enableLudus && !cancelled) {
        try {
          setInitMessage('Generating quests from git history...');

          const character = createCharacter(characterClass, characterName, 1);

          // Generate quests from real CHRONOS data
          const commitQuests = generateQuestGraph(chronosCommits);
          const hotspotQuests = generateHotspotQuests(chronosHotspots);
          const archaeologyQuests = generateArchaeologyQuests(chronosFiles);
          const allQuests = [...commitQuests, ...hotspotQuests, ...archaeologyQuests];

          const store: GameStore = createGameStore({
            character,
            inventory: [],
            activeQuests: allQuests,
            completedQuests: [],
            battleState: null,
            gameFlags: {},
          });

          // Bridge store changes → EventBus
          const unsubBridge = bridgeStoreToEventBus(store);
          cleanups.push(unsubBridge);

          // Create session with real topology data + contributor NPCs
          const session = createGameSession(
            store, chronosFiles, chronosCommits, chronosHotspots,
            Date.now(), undefined, chronosContributors,
          );
          session.quests = allQuests;
          gameSessionRef.current = session;

          if (allQuests.length > 0) {
            console.log(
              `[DENDROVIA] LUDUS: ${allQuests.length} quests generated ` +
              `(${commitQuests.length} commits, ${hotspotQuests.length} hotspots, ${archaeologyQuests.length} archaeology)` +
              (chronosContributors.length > 0 ? `, ${chronosContributors.length} NPC contributors loaded` : '')
            );
          }

          // Wire EventBus listeners
          const unwireEvents = wireGameEvents(session);
          cleanups.push(unwireEvents);
        } catch (err) {
          console.warn('[DENDROVIA] LUDUS init failed, continuing without game logic:', err);
        }
      }

      // Done
      if (!cancelled) {
        cleanupRef.current = cleanups;
        setReady(true);
      }
    }

    init();

    return () => {
      cancelled = true;
      for (const fn of cleanupRef.current) {
        try { fn(); } catch { /* swallow cleanup errors */ }
      }
      cleanupRef.current = [];

      // Clear EventBus subscriptions
      eventBusRef.current?.clear();
      eventBusRef.current = null;
      gameSessionRef.current = null;
    };
  }, [
    enableOperatus,
    enableLudus,
    characterClass,
    characterName,
    topologyPath,
    manifestPath,
    getOrCreateEventBus,
  ]);

  // ── Loading state ──
  if (!ready) {
    return <LoadingScreen message={initMessage} />;
  }

  const bus = getOrCreateEventBus();

  // ── Compose the pillar layers ──
  //
  //  OculusProvider (context + event bridge)
  //    ├─ ArchitectusApp (3D canvas, fills container)
  //    ├─ HUD (absolute overlay)
  //    └─ children (additional overlays)

  const scene = (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ArchitectusApp
        topology={topology}
        hotspots={hotspots}
        manifestPath={manifestPath}
      />
      {topologyError && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(20, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#f87171',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.75rem',
            maxWidth: '500px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '2px' }}>Topology failed to load</div>
          <div style={{ opacity: 0.7 }}>{topologyError}</div>
          <div style={{ opacity: 0.5, marginTop: '4px' }}>Showing demo data as fallback</div>
        </div>
      )}
      {enableOculus && <HUD />}
      {enableOculus && onboarding.phase === 'exploring' && (
        <OnboardingHints onboarding={onboarding} />
      )}
      {onboarding.phase === 'welcome' && (
        <WelcomeScreen onEnter={onboarding.dismissWelcome} />
      )}
      {children}
    </div>
  );

  // Wrap in OculusProvider if OCULUS is enabled (provides EventBus context)
  if (enableOculus) {
    return (
      <OculusProvider eventBus={bus}>
        {scene}
      </OculusProvider>
    );
  }

  return scene;
}
