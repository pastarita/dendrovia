export {
  createDendroviaStorage,
  registerMigration,
  listSaveSlots,
  deleteSaveSlot,
  exportSave,
  importSave,
  SAVE_VERSION,
} from './StatePersistence';
export type { PersistenceConfig, MigrationFn, SaveSlot } from './StatePersistence';

export { useGameStore, waitForHydration, getGameSaveSnapshot } from './GameStore';
export type { GameStoreState } from './GameStore';

export { AutoSave } from './AutoSave';
export type { AutoSaveConfig } from './AutoSave';

export { StateAdapter } from './StateAdapter';
export type { StateAdapterConfig } from './StateAdapter';
