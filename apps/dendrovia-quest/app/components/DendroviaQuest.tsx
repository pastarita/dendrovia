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
import type { FileTreeNode, Hotspot, ParsedFile, ParsedCommit, CharacterClass } from '@dendrovia/shared';

// ── ARCHITECTUS (3D renderer) ─────────────────────────────────
import { App as ArchitectusApp, useRendererStore } from '@dendrovia/architectus';

// ── OCULUS (UI layer) ─────────────────────────────────────────
import { OculusProvider, HUD, useOculusStore } from '@dendrovia/oculus';

// ── LUDUS (game logic) ────────────────────────────────────────
import {
  createGameStore,
  bridgeStoreToEventBus,
  createGameSession,
  wireGameEvents,
  createCharacter,
  generateQuestGraph,
  generateHotspotQuests,
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

// ─── T11: Bridge OCULUS isUiHovered → ARCHITECTUS renderer store ──

function UiHoverBridge() {
  const isUiHovered = useOculusStore((s) => s.isUiHovered);
  useEffect(() => {
    useRendererStore.getState().setUiHovered(isUiHovered);
  }, [isUiHovered]);
  return null;
}

// ─── Bridge ARCHITECTUS performance metrics → OCULUS store ──

function PerformanceBridge() {
  const fps = useRendererStore((s) => s.fps);
  const qualityTier = useRendererStore((s) => s.qualityTier);
  useEffect(() => {
    useOculusStore.getState().setPerformance(fps, qualityTier);
  }, [fps, qualityTier]);
  return null;
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
  // ── Refs (persist across renders, no re-render on mutation) ──
  const eventBusRef = useRef<EventBus | null>(null);
  const gameSessionRef = useRef<GameSession | null>(null);
  const cleanupRef = useRef<Array<() => void>>([]);

  // ── State ──
  const [ready, setReady] = useState(false);
  const [initMessage, setInitMessage] = useState('Initializing...');
  const [topology, setTopology] = useState<FileTreeNode | undefined>(undefined);
  const [hotspots, setHotspots] = useState<Hotspot[] | undefined>(undefined);

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

      // Step 2: Load CHRONOS topology (if a path was provided)
      let chronosFiles: ParsedFile[] = [];
      let chronosCommits: ParsedCommit[] = [];
      let chronosHotspots: Hotspot[] = [];

      if (topologyPath && !cancelled) {
        try {
          setInitMessage('Loading topology...');
          const res = await fetch(topologyPath);
          if (res.ok) {
            const data = await res.json();
            if (!cancelled) {
              const tree = data.tree ?? data;
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
          }
        } catch (err) {
          console.warn('[DENDROVIA] Failed to load topology from', topologyPath, err);
        }
      }

      // Step 3: LUDUS — game session + event wiring (with real CHRONOS data)
      if (enableLudus && !cancelled) {
        try {
          setInitMessage('Generating quests from git history...');

          const character = createCharacter(characterClass, characterName, 1);

          // Generate quests from real CHRONOS data
          const commitQuests = generateQuestGraph(chronosCommits);
          const hotspotQuests = generateHotspotQuests(chronosHotspots);
          const allQuests = [...commitQuests, ...hotspotQuests];

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

          // Create session with real topology data
          const session = createGameSession(store, chronosFiles, chronosCommits, chronosHotspots);
          session.quests = allQuests;
          gameSessionRef.current = session;

          if (allQuests.length > 0) {
            console.log(
              `[DENDROVIA] LUDUS: ${allQuests.length} quests generated ` +
              `(${commitQuests.length} from commits, ${hotspotQuests.length} from hotspots)`
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
    topologyPath,
    manifestPath,
    characterClass,
    characterName,
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
      {enableOculus && <HUD />}
      {enableOculus && <UiHoverBridge />}
      {enableOculus && <PerformanceBridge />}
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
