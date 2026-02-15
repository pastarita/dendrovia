import type { SourceDiagram } from "../types";

export const operatusFixture: SourceDiagram = {
  id: "operatus",
  title: "OPERATUS",
  nodes: [
    { id: "op-root", label: "OPERATUS", kind: "root", status: "implemented", domain: "operatus" },

    // Phase: Cache
    { id: "op-cache", label: "Cache", kind: "phase", status: "implemented", domain: "operatus", children: ["op-cache-mgr", "op-idb", "op-opfs"] },
    { id: "op-cache-mgr", label: "CacheManager", kind: "section", status: "implemented", domain: "operatus", description: "Unified cache coordinator" },
    { id: "op-idb", label: "IDBCache", kind: "section", status: "implemented", domain: "operatus", description: "IndexedDB cache backend" },
    { id: "op-opfs", label: "OPFSCache", kind: "section", status: "implemented", domain: "operatus", description: "Origin Private File System cache" },

    // Phase: Loader
    { id: "op-loader", label: "Loader", kind: "phase", status: "implemented", domain: "operatus", children: ["op-asset-loader", "op-cdn-loader"] },
    { id: "op-asset-loader", label: "AssetLoader", kind: "section", status: "implemented", domain: "operatus", description: "Progressive asset loading pipeline" },
    { id: "op-cdn-loader", label: "CDNLoader", kind: "section", status: "implemented", domain: "operatus", description: "CDN-backed asset fetching" },

    // Phase: Manifest
    { id: "op-manifest", label: "Manifest", kind: "phase", status: "implemented", domain: "operatus", children: ["op-manifest-gen", "op-generate"] },
    { id: "op-manifest-gen", label: "ManifestGenerator", kind: "section", status: "implemented", domain: "operatus", description: "Build-time manifest generation" },
    { id: "op-generate", label: "generate", kind: "section", status: "implemented", domain: "operatus", description: "CLI generate command" },

    // Phase: Persistence
    { id: "op-persist", label: "Persistence", kind: "phase", status: "implemented", domain: "operatus", children: ["op-state-persist", "op-autosave", "op-game-store", "op-state-adapter"] },
    { id: "op-state-persist", label: "StatePersistence", kind: "section", status: "implemented", domain: "operatus", description: "State serialization/deserialization" },
    { id: "op-autosave", label: "AutoSave", kind: "section", status: "implemented", domain: "operatus", description: "Periodic auto-save system" },
    { id: "op-game-store", label: "GameStore", kind: "section", status: "implemented", domain: "operatus", description: "Operatus game state adapter" },
    { id: "op-state-adapter", label: "StateAdapter", kind: "section", status: "implemented", domain: "operatus", description: "Cross-pillar state adapter" },

    // Phase: Sync
    { id: "op-sync", label: "Sync", kind: "phase", status: "implemented", domain: "operatus", children: ["op-cross-tab", "op-multiplayer", "op-sw"] },
    { id: "op-cross-tab", label: "CrossTabSync", kind: "section", status: "implemented", domain: "operatus", description: "BroadcastChannel cross-tab sync" },
    { id: "op-multiplayer", label: "MultiplayerClient", kind: "section", status: "implemented", domain: "operatus", description: "WebSocket multiplayer client" },
    { id: "op-sw", label: "ServiceWorker", kind: "section", status: "implemented", domain: "operatus", description: "Offline-first service worker" },

    // Phase: Perf
    { id: "op-perf", label: "Perf", kind: "phase", status: "implemented", domain: "operatus", children: ["op-perf-monitor"] },
    { id: "op-perf-monitor", label: "PerfMonitor", kind: "section", status: "implemented", domain: "operatus", description: "Runtime performance metrics" },
  ],
  edges: [
    { source: "op-root", target: "op-cache", relation: "pipeline-flow" },
    { source: "op-root", target: "op-loader", relation: "pipeline-flow" },
    { source: "op-cache", target: "op-loader", relation: "pipeline-flow" },
    { source: "op-loader", target: "op-manifest", relation: "pipeline-flow" },
    { source: "op-manifest", target: "op-persist", relation: "pipeline-flow" },
    { source: "op-persist", target: "op-sync", relation: "pipeline-flow" },
    { source: "op-sync", target: "op-perf", relation: "pipeline-flow" },

    { source: "op-cache", target: "op-cache-mgr", relation: "containment" },
    { source: "op-cache", target: "op-idb", relation: "containment" },
    { source: "op-cache", target: "op-opfs", relation: "containment" },
    { source: "op-loader", target: "op-asset-loader", relation: "containment" },
    { source: "op-loader", target: "op-cdn-loader", relation: "containment" },
    { source: "op-manifest", target: "op-manifest-gen", relation: "containment" },
    { source: "op-manifest", target: "op-generate", relation: "containment" },
    { source: "op-persist", target: "op-state-persist", relation: "containment" },
    { source: "op-persist", target: "op-autosave", relation: "containment" },
    { source: "op-persist", target: "op-game-store", relation: "containment" },
    { source: "op-persist", target: "op-state-adapter", relation: "containment" },
    { source: "op-sync", target: "op-cross-tab", relation: "containment" },
    { source: "op-sync", target: "op-multiplayer", relation: "containment" },
    { source: "op-sync", target: "op-sw", relation: "containment" },
    { source: "op-perf", target: "op-perf-monitor", relation: "containment" },
  ],
};
