/**
 * OCULUS Store — Central read-only UI state
 *
 * Subscribes to EventBus events and exposes reactive state
 * to all OCULUS components. Never mutates game state directly.
 */

import { create } from 'zustand';
import type {
  Character,
  Quest,
  Bug,
  Spell,
  FileTreeNode,
  Hotspot,
  HUDState,
} from '@dendrovia/shared';

// ── Types ──────────────────────────────────────────────

export type ActivePanel =
  | 'none'
  | 'quest-log'
  | 'miller-columns'
  | 'code-reader'
  | 'battle-ui';

export type CameraMode = 'falcon' | 'player';

export interface BattleState {
  active: boolean;
  enemy: Bug | null;
  log: string[];
}

export interface CodeReaderState {
  filePath: string | null;
  content: string | null;
  language: string;
  loading: boolean;
  error: string | null;
}

export interface OculusState {
  // HUD
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  level: number;
  experience: number;

  // Panels
  activePanel: ActivePanel;
  previousPanel: ActivePanel;

  // Camera
  cameraMode: CameraMode;

  // Quests
  quests: Quest[];
  activeQuest: Quest | null;

  // Combat
  battle: BattleState;
  playerSpells: Spell[];

  // Code navigation
  topology: FileTreeNode | null;
  hotspots: Hotspot[];
  codeReader: CodeReaderState;
  millerSelection: string[]; // selected path segments

  // Input coordination
  isUiHovered: boolean;

  // Player position (for minimap)
  playerPosition: [number, number, number];
  visitedNodes: string[];
}

export interface OculusActions {
  // Panel management
  setActivePanel: (panel: ActivePanel) => void;
  togglePanel: (panel: ActivePanel) => void;

  // HUD updates (called from EventBus subscriptions)
  setHealth: (health: number, maxHealth?: number) => void;
  setMana: (mana: number, maxMana?: number) => void;
  setCharacter: (character: Partial<Character>) => void;

  // Quest updates
  setQuests: (quests: Quest[]) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  setActiveQuest: (quest: Quest | null) => void;

  // Combat
  startCombat: (enemy: Bug, playerSpells: Spell[]) => void;
  endCombat: () => void;
  addBattleLog: (message: string) => void;

  // Code navigation
  setTopology: (tree: FileTreeNode) => void;
  setHotspots: (hotspots: Hotspot[]) => void;
  openCodeReader: (filePath: string, content: string, language: string) => void;
  closeCodeReader: () => void;
  setCodeContent: (content: string) => void;
  setCodeLoading: (loading: boolean) => void;
  setCodeError: (error: string | null) => void;
  setMillerSelection: (selection: string[]) => void;

  // Camera
  setCameraMode: (mode: CameraMode) => void;

  // Input coordination
  setUiHovered: (hovered: boolean) => void;

  // Player position
  setPlayerPosition: (position: [number, number, number]) => void;
  addVisitedNode: (nodeId: string) => void;
}

export type OculusStore = OculusState & OculusActions;

export const useOculusStore = create<OculusStore>((set) => ({
  // ── Initial State ──────────────────────────────────

  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  level: 1,
  experience: 0,

  activePanel: 'none',
  previousPanel: 'none',

  cameraMode: 'falcon',

  quests: [],
  activeQuest: null,

  battle: { active: false, enemy: null, log: [] },
  playerSpells: [],

  topology: null,
  hotspots: [],
  codeReader: { filePath: null, content: null, language: 'typescript', loading: false, error: null },
  millerSelection: [],

  isUiHovered: false,

  playerPosition: [0, 0, 0],
  visitedNodes: [],

  // ── Actions ────────────────────────────────────────

  setActivePanel: (panel) =>
    set((s) => ({ activePanel: panel, previousPanel: s.activePanel })),

  togglePanel: (panel) =>
    set((s) => ({
      activePanel: s.activePanel === panel ? 'none' : panel,
      previousPanel: s.activePanel,
    })),

  setHealth: (health, maxHealth) =>
    set((s) => ({
      health,
      ...(maxHealth !== undefined ? { maxHealth } : {}),
    })),

  setMana: (mana, maxMana) =>
    set((s) => ({
      mana,
      ...(maxMana !== undefined ? { maxMana } : {}),
    })),

  setCharacter: (character) =>
    set((s) => ({
      ...(character.stats?.health !== undefined ? { health: character.stats.health } : {}),
      ...(character.stats?.maxHealth !== undefined ? { maxHealth: character.stats.maxHealth } : {}),
      ...(character.stats?.mana !== undefined ? { mana: character.stats.mana } : {}),
      ...(character.stats?.maxMana !== undefined ? { maxMana: character.stats.maxMana } : {}),
      ...(character.level !== undefined ? { level: character.level } : {}),
      ...(character.experience !== undefined ? { experience: character.experience } : {}),
    })),

  setQuests: (quests) => set({ quests }),

  updateQuest: (questId, updates) =>
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === questId ? { ...q, ...updates } : q
      ),
      activeQuest:
        s.activeQuest?.id === questId
          ? { ...s.activeQuest, ...updates }
          : s.activeQuest,
    })),

  setActiveQuest: (quest) => set({ activeQuest: quest }),

  startCombat: (enemy, playerSpells) =>
    set({
      battle: { active: true, enemy, log: [`A wild ${enemy.type} appeared!`] },
      playerSpells,
      activePanel: 'battle-ui',
    }),

  endCombat: () =>
    set((s) => ({
      battle: { active: false, enemy: null, log: [] },
      activePanel: s.previousPanel !== 'battle-ui' ? s.previousPanel : 'none',
    })),

  addBattleLog: (message) =>
    set((s) => {
      const log = [...s.battle.log, message];
      return { battle: { ...s.battle, log: log.length > 100 ? log.slice(-100) : log } };
    }),

  setTopology: (tree) => set({ topology: tree }),

  setHotspots: (hotspots) => set({ hotspots }),

  openCodeReader: (filePath, content, language) =>
    set({
      codeReader: {
        filePath,
        content: content || null,
        language,
        loading: !content,
        error: null,
      },
      activePanel: 'code-reader',
    }),

  closeCodeReader: () =>
    set((s) => ({
      codeReader: { filePath: null, content: null, language: 'typescript', loading: false, error: null },
      activePanel: s.previousPanel !== 'code-reader' ? s.previousPanel : 'none',
    })),

  setCodeContent: (content) =>
    set((s) => ({
      codeReader: { ...s.codeReader, content, loading: false, error: null },
    })),

  setCodeLoading: (loading) =>
    set((s) => ({
      codeReader: { ...s.codeReader, loading },
    })),

  setCodeError: (error) =>
    set((s) => ({
      codeReader: { ...s.codeReader, error, loading: false },
    })),

  setMillerSelection: (selection) => set({ millerSelection: selection }),

  setCameraMode: (mode) => set({ cameraMode: mode }),

  setUiHovered: (hovered) => set({ isUiHovered: hovered }),

  setPlayerPosition: (position) => set({ playerPosition: position }),

  addVisitedNode: (nodeId) =>
    set((s) => {
      if (s.visitedNodes.includes(nodeId)) return s;
      return { visitedNodes: [...s.visitedNodes, nodeId] };
    }),
}));
