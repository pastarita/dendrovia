/**
 * Bootstrap — App Orchestrator (F-1)
 *
 * Extracts the initialization pipeline from DendroviaQuest into a
 * standalone async function. Returns a BootstrapContext with destroy()
 * for deterministic cleanup.
 *
 * Phases:
 *   1. OPERATUS init (conditional — no-op in browser)
 *   2. Topology load (CHRONOS data from JSON)
 *   3. LUDUS session + wireGameEvents()
 *   4. Emit GAME_STARTED
 */

import {
  getEventBus,
  GameEvents,
  type EventBus,
  type FileTreeNode,
  type Hotspot,
  type ParsedFile,
  type ParsedCommit,
  type CharacterClass,
  type ContributorProfile,
} from '@dendrovia/shared';
import { createLogger } from '@dendrovia/shared/logger';
import { useSegmentStore } from '@dendrovia/architectus';
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

const log = createLogger('APP', 'bootstrap');

// ── Public Types ────────────────────────────────────────────────

export interface BootstrapConfig {
  topologyPath?: string;
  manifestPath?: string;
  enableOperatus?: boolean;
  enableLudus?: boolean;
  characterClass?: CharacterClass;
  characterName?: string;
}

export interface TopologyData {
  tree: FileTreeNode;
  hotspots: Hotspot[];
  files: ParsedFile[];
  commits: ParsedCommit[];
  contributors: ContributorProfile[];
}

export interface BootstrapContext {
  eventBus: EventBus;
  topology: TopologyData | null;
  topologyError: string | null;
  gameSession: GameSession | null;
  destroy: () => void;
}

export type BootstrapProgressCallback = (message: string) => void;

// ── Bootstrap Implementation ────────────────────────────────────

export async function bootstrap(
  config: BootstrapConfig,
  onProgress?: BootstrapProgressCallback,
): Promise<BootstrapContext> {
  const {
    topologyPath,
    enableOperatus = false,
    enableLudus = true,
    characterClass = 'dps',
    characterName = 'Explorer',
  } = config;

  const cleanups: Array<() => void> = [];
  const eventBus = getEventBus();

  let topologyData: TopologyData | null = null;
  let topologyError: string | null = null;
  let gameSession: GameSession | null = null;

  // ── Phase 1: OPERATUS ──────────────────────────────────
  if (enableOperatus) {
    log.warn('OPERATUS enabled but not available in browser bundle');
  }

  // ── Phase 2: Topology load ─────────────────────────────
  const worldReady = useSegmentStore.getState().worldReady;

  if (topologyPath && !worldReady) {
    onProgress?.('Loading topology...');

    try {
      const contributorsPath = topologyPath.replace(/topology\.json$/, 'contributors.json');

      const [topoRes, contribRes] = await Promise.all([
        fetch(topologyPath),
        fetch(contributorsPath).catch(() => null),
      ]);

      if (topoRes.ok) {
        const data = await topoRes.json();
        const tree = data.tree ?? data;

        if (!tree || (typeof tree === 'object' && !tree.name && !tree.path)) {
          topologyError = 'Topology JSON loaded but missing tree structure';
          log.error({ keys: Object.keys(data) }, topologyError);
        } else {
          const hotspots: Hotspot[] = data.hotspots ?? [];
          const files: ParsedFile[] = data.files ?? [];
          const commits: ParsedCommit[] = data.commits ?? [];
          let contributors: ContributorProfile[] = [];

          if (contribRes?.ok) {
            contributors = await contribRes.json();
          }

          topologyData = { tree, hotspots, files, commits, contributors };

          // Emit to OCULUS
          eventBus.emit(GameEvents.TOPOLOGY_GENERATED, { tree, hotspots });

          // Emit LEVEL_LOADED for OPERATUS listeners
          eventBus.emit(GameEvents.LEVEL_LOADED, {
            levelId: topologyPath,
            assetPaths: [],
          });
        }
      } else {
        const detail = await topoRes.text().catch(() => '');
        topologyError = `Topology fetch failed: ${topoRes.status} ${topoRes.statusText}`;
        log.error({ status: topoRes.status, detail }, topologyError);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      topologyError = `Topology load error: ${msg}`;
      log.error({ err }, 'Failed to load topology');
    }
  } else if (worldReady) {
    onProgress?.('World index loaded, topology on demand...');
  }

  // ── Phase 3: LUDUS session + wireGameEvents ────────────
  if (enableLudus) {
    try {
      onProgress?.('Generating quests from git history...');

      const character = createCharacter(characterClass, characterName, 1);

      const chronosFiles = topologyData?.files ?? [];
      const chronosCommits = topologyData?.commits ?? [];
      const chronosHotspots = topologyData?.hotspots ?? [];
      const chronosContributors = topologyData?.contributors ?? [];

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

      const unsubBridge = bridgeStoreToEventBus(store);
      cleanups.push(unsubBridge);

      const session = createGameSession(
        store, chronosFiles, chronosCommits, chronosHotspots,
        Date.now(), undefined, chronosContributors,
      );
      session.quests = allQuests;
      gameSession = session;

      if (allQuests.length > 0) {
        log.info(
          { total: allQuests.length, commits: commitQuests.length, hotspots: hotspotQuests.length, archaeology: archaeologyQuests.length, npcs: chronosContributors.length },
          'Quests generated',
        );
      }

      const unwireEvents = wireGameEvents(session);
      cleanups.push(unwireEvents);
    } catch (err) {
      log.warn({ err }, 'LUDUS init failed, continuing without game logic');
    }
  }

  // ── Phase 4: Emit GAME_STARTED ─────────────────────────
  eventBus.emit(GameEvents.GAME_STARTED, { timestamp: Date.now() });
  log.info('Bootstrap complete');

  return {
    eventBus,
    topology: topologyData,
    topologyError,
    gameSession,
    destroy() {
      for (const fn of cleanups) {
        try { fn(); } catch { /* swallow cleanup errors */ }
      }
      cleanups.length = 0;
      eventBus.clear();
    },
  };
}
