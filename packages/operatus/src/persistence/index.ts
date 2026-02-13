export {
  createDendroviaStorage,
  registerMigration,
  listSaveSlots,
  deleteSaveSlot,
  exportSave,
  importSave,
  SAVE_VERSION,
} from './StatePersistence.js';
export type { PersistenceConfig, MigrationFn, SaveSlot } from './StatePersistence.js';

export { useGameStore, waitForHydration, getGameSaveSnapshot } from './GameStore.js';
export type { GameStoreState } from './GameStore.js';

export { AutoSave } from './AutoSave.js';
export type { AutoSaveConfig } from './AutoSave.js';
