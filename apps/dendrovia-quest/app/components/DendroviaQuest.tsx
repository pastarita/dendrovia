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
 *   OPERATUS    → cache, persistence, cross-tab sync
 *
 * Each pillar integration is independently disablable: if a subsystem
 * fails to initialize, the others continue working. The 3D scene always
 * renders.
 */

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';

// ── Shared ────────────────────────────────────────────────────
import { getEventBus, GameEvents } from '@dendrovia/shared';
import type { EventBus, TopologyGeneratedEvent } from '@dendrovia/shared';
import type { FileTreeNode, Hotspot, ParsedFile, ParsedCommit } from '@dendrovia/shared';

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
  type GameSession,
  type GameStore,
} from '@dendrovia/ludus';

// ── OPERATUS (infrastructure) ─────────────────────────────────
import { initializeOperatus, StateAdapter, type OperatusContext } from '@dendrovia/operatus';

// ─── Configuration ────────────────────────────────────────────

export interface DendroviaQuestProps {
  /** Path to CHRONOS topology JSON (optional) */
  topologyPath?: string;
  /** Path to IMAGINARIUM manifest (default: /generated/manifest.json) */
  manifestPath?: string;
  /** Enable OPERATUS infrastructure (default: true) */
  enableOperatus?: boolean;
  /** Enable LUDUS game session (default: true) */
  enableLudus?: boolean;
  /** Enable OCULUS HUD overlay (default: true) */
  enableOculus?: boolean;
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
        background: '#0a0a0a',
        color: '#00ffcc',
        fontFamily: "'Courier New', monospace",
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>DENDROVIA</div>
        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{message}</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function DendroviaQuest({
  topologyPath,
  manifestPath = '/generated/manifest.json',
  enableOperatus = true,
  enableLudus = true,
  enableOculus = true,
  children,
}: DendroviaQuestProps) {
  // ── Refs (persist across renders, no re-render on mutation) ──
  const eventBusRef = useRef<EventBus | null>(null);
  const operatusRef = useRef<OperatusContext | null>(null);
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

  // ── Initialization pipeline ──
  useEffect(() => {
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    async function init() {
      const bus = getOrCreateEventBus();

      // Step 1: OPERATUS — cache + persistence
      if (enableOperatus) {
        try {
          if (!cancelled) setInitMessage('Hydrating cache...');
          const ctx = await initializeOperatus({
            manifestPath,
            skipSync: false,
            skipAutoSave: false,
          });
          operatusRef.current = ctx;
          cleanups.push(() => ctx.destroy());
        } catch (err) {
          console.warn('[DENDROVIA] OPERATUS init failed, continuing without infrastructure:', err);
        }
      }

      // Step 2: Load CHRONOS topology (if a path was provided)
      if (topologyPath && !cancelled) {
        try {
          setInitMessage('Loading topology...');
          const res = await fetch(topologyPath);
          if (res.ok) {
            const data = await res.json();
            if (!cancelled) {
              const tree = data.tree ?? data;
              const spots = data.hotspots ?? [];
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

      // Step 3: LUDUS — game session + event wiring
      if (enableLudus && !cancelled) {
        try {
          setInitMessage('Wiring game session...');

          const character = createCharacter('dps', 'Explorer', 1);
          const store: GameStore = createGameStore({
            character,
            inventory: [],
            activeQuests: [],
            completedQuests: [],
            battleState: null,
            gameFlags: {},
          });

          // Bridge OPERATUS persistence ↔ LUDUS store (if OPERATUS is active)
          if (enableOperatus && operatusRef.current) {
            const adapter = new StateAdapter();
            await adapter.connect(store);
            cleanups.push(() => adapter.disconnect());
          }

          // Bridge store changes → EventBus
          const unsubBridge = bridgeStoreToEventBus(store);
          cleanups.push(unsubBridge);

          // Create session (empty topology data is fine — LUDUS degrades gracefully)
          const files: ParsedFile[] = [];
          const commits: ParsedCommit[] = [];
          const sessionHotspots: Hotspot[] = [];

          const session = createGameSession(store, files, commits, sessionHotspots);
          gameSessionRef.current = session;

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
      operatusRef.current = null;
      gameSessionRef.current = null;
    };
  }, [
    enableOperatus,
    enableLudus,
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
        assetLoader={operatusRef.current?.assetLoader}
      />
      {enableOculus && <HUD />}
      {enableOculus && <UiHoverBridge />}
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
