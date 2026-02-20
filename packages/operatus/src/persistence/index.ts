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

export { useSaveStateStore, waitForHydration, getSaveStateSnapshot } from './SaveStateStore';
export type { SaveStateStoreState } from './SaveStateStore';

export { AutoSave } from './AutoSave';
export type { AutoSaveConfig } from './AutoSave';

export { StateAdapter } from './StateAdapter';
export type { StateAdapterConfig } from './StateAdapter';
