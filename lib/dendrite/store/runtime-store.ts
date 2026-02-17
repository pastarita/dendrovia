/**
 * Runtime Store — Zustand store for live subsystem observation.
 *
 * Separated from dendrite-store to avoid triggering relayoutFromState()
 * on high-frequency runtime updates. Uses flat replace (no Immer).
 */

import { createStore } from 'zustand/vanilla';
import type { NodeAction, RuntimeEvent, RuntimeHealth, RuntimeNodeState } from '../types';

const MAX_EVENTS = 50;

export interface RuntimeStoreState {
  nodes: Map<string, RuntimeNodeState>;
  actions: Map<string, NodeAction[]>;
  events: Map<string, RuntimeEvent[]>;
  connected: boolean;

  updateNode: (nodeId: string, partial: Partial<Omit<RuntimeNodeState, 'nodeId'>>) => void;
  registerActions: (nodeId: string, actions: NodeAction[]) => void;
  pushEvent: (nodeId: string, event: RuntimeEvent) => void;
  setConnected: (connected: boolean) => void;
  clear: () => void;

  /** Convenience: extract a health map for the dendrite store */
  getHealthMap: () => Map<string, RuntimeHealth>;
}

export function createRuntimeStore() {
  return createStore<RuntimeStoreState>((set, get) => ({
    nodes: new Map(),
    actions: new Map(),
    events: new Map(),
    connected: false,

    updateNode: (nodeId, partial) =>
      set((state) => {
        const next = new Map(state.nodes);
        const existing = next.get(nodeId);
        next.set(nodeId, {
          nodeId,
          health: 'idle',
          metrics: [],
          actions: [],
          lastUpdated: Date.now(),
          ...existing,
          ...partial,
        });
        return { nodes: next };
      }),

    registerActions: (nodeId, actions) =>
      set((state) => {
        const next = new Map(state.actions);
        next.set(nodeId, actions);
        return { actions: next };
      }),

    pushEvent: (nodeId, event) =>
      set((state) => {
        const next = new Map(state.events);
        const existing = next.get(nodeId) ?? [];
        const updated = [event, ...existing].slice(0, MAX_EVENTS);
        next.set(nodeId, updated);
        return { events: next };
      }),

    setConnected: (connected) => set({ connected }),

    clear: () =>
      set({
        nodes: new Map(),
        actions: new Map(),
        events: new Map(),
        connected: false,
      }),

    getHealthMap: () => {
      const map = new Map<string, RuntimeHealth>();
      for (const [id, node] of get().nodes) {
        map.set(id, node.health);
      }
      return map;
    },
  }));
}
