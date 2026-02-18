'use client';

import { useState, useEffect, useRef } from 'react';
import { LifecycleDiagram } from './components/LifecycleDiagram';
import { LiveEventOverlay } from './components/LiveEventOverlay';
import { StageDetail } from './components/StageDetail';

export interface Stage {
  id: string;
  label: string;
  description: string;
  api: string;
  track: 'asset' | 'persist';
}

export const ASSET_STAGES: Stage[] = [
  { id: 'manifest', label: 'Manifest', description: 'Parse manifest.json to discover all assets', api: 'AssetLoader.loadManifest()', track: 'asset' },
  { id: 'priority', label: 'Priority Sort', description: 'Sort assets by priority (critical > high > medium > low)', api: 'AssetPriority enum', track: 'asset' },
  { id: 'cache-check', label: 'Cache Check', description: 'Check memory → OPFS → IDB tiers for cached copy', api: 'CacheManager.get(path)', track: 'asset' },
  { id: 'fetch', label: 'Fetch / Hit', description: 'Fetch from network on miss, return cached data on hit', api: 'CacheManager.set() + fetch()', track: 'asset' },
  { id: 'parse', label: 'Parse', description: 'Decode asset data (JSON, GLSL, binary mesh)', api: 'AssetLoader.load()', track: 'asset' },
  { id: 'consumer', label: 'Consumer Ready', description: 'Asset available for rendering/gameplay', api: 'EventBus.emit(ASSETS_LOADED)', track: 'asset' },
];

export const PERSIST_STAGES: Stage[] = [
  { id: 'game-state', label: 'Game State', description: 'Live Zustand store with character, quests, inventory', api: 'useGameStore.getState()', track: 'persist' },
  { id: 'zustand-persist', label: 'Zustand Persist', description: 'Middleware serializes state on every mutation', api: 'createDendroviaStorage()', track: 'persist' },
  { id: 'idb-write', label: 'IndexedDB', description: 'Persisted to IndexedDB via custom storage engine', api: 'IDBCache.write()', track: 'persist' },
  { id: 'state-persisted', label: 'STATE_PERSISTED', description: 'Confirmation event emitted to all pillars', api: 'EventBus.emit(STATE_PERSISTED)', track: 'persist' },
];

export const ALL_STAGES = [...ASSET_STAGES, ...PERSIST_STAGES];

const EVENT_STAGE_MAP: Record<string, string> = {
  'assets:loaded': 'consumer',
  'cache:updated': 'fetch',
  'state:persisted': 'state-persisted',
};

export function AssetLifecycleClient() {
  const [activeStages, setActiveStages] = useState<Set<string>>(new Set());
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; event: string }>>([]);
  const busRef = useRef<import('@dendrovia/shared').EventBus | null>(null);
  const toastId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    import('@dendrovia/shared').then((shared) => {
      if (cancelled) return;
      const bus = shared.getEventBus();
      busRef.current = bus;

      const unsub = bus.onAny((event: string) => {
        const stageId = EVENT_STAGE_MAP[event];
        if (!stageId) return;

        // Highlight stage
        setActiveStages((prev) => new Set(prev).add(stageId));

        // Show toast
        const id = toastId.current++;
        setToasts((prev) => [...prev, { id, event }]);

        // Fade after 2s
        setTimeout(() => {
          setActiveStages((prev) => {
            const next = new Set(prev);
            next.delete(stageId);
            return next;
          });
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 2000);
      });

      return () => unsub();
    });
    return () => { cancelled = true; };
  }, []);

  const handleSimulate = async () => {
    const bus = busRef.current;
    if (!bus) return;

    const sequence: Array<{ stage: string; event: string; delay: number }> = [
      { stage: 'manifest', event: 'assets:loaded', delay: 0 },
      { stage: 'priority', event: 'assets:loaded', delay: 300 },
      { stage: 'cache-check', event: 'cache:updated', delay: 600 },
      { stage: 'fetch', event: 'cache:updated', delay: 900 },
      { stage: 'parse', event: 'assets:loaded', delay: 1200 },
      { stage: 'consumer', event: 'assets:loaded', delay: 1500 },
      { stage: 'game-state', event: 'state:persisted', delay: 2000 },
      { stage: 'zustand-persist', event: 'state:persisted', delay: 2300 },
      { stage: 'idb-write', event: 'state:persisted', delay: 2600 },
      { stage: 'state-persisted', event: 'state:persisted', delay: 2900 },
    ];

    for (const step of sequence) {
      await new Promise<void>((resolve) => setTimeout(resolve, step.delay === 0 ? 0 : step.delay - (sequence[sequence.indexOf(step) - 1]?.delay ?? 0)));
      setActiveStages((prev) => new Set(prev).add(step.stage));

      const id = toastId.current++;
      setToasts((prev) => [...prev, { id, event: step.event }]);

      setTimeout(() => {
        setActiveStages((prev) => {
          const next = new Set(prev);
          next.delete(step.stage);
          return next;
        });
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2000);
    }
  };

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={handleSimulate}
          style={{
            padding: "0.5rem 1rem",
            background: "#1e3a5f",
            border: "1px solid #3b82f6",
            borderRadius: "4px",
            color: "#ededed",
            fontSize: "0.85rem",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Simulate Full Lifecycle
        </button>
      </div>

      <LiveEventOverlay toasts={toasts} />
      <LifecycleDiagram
        activeStages={activeStages}
        selectedStage={selectedStage?.id ?? null}
        onSelectStage={(id) => {
          const stage = ALL_STAGES.find((s) => s.id === id) ?? null;
          setSelectedStage(stage);
        }}
      />

      {selectedStage && (
        <StageDetail stage={selectedStage} onClose={() => setSelectedStage(null)} />
      )}
    </div>
  );
}
