/**
 * Actions Registry — Factory functions for node actions
 *
 * Each factory captures a subsystem reference and returns NodeAction[].
 */

import type { NodeAction } from '../../../../lib/dendrite/types.js';
import type { CacheManager } from '../cache/CacheManager.js';
import type { AutoSave } from '../persistence/AutoSave.js';

export function cacheManagerActions(cache: CacheManager): NodeAction[] {
  return [
    {
      id: 'cache-clear-all',
      label: 'Clear All',
      category: 'danger',
      confirm: 'Clear all cached assets? This will force re-downloads.',
      handler: async () => {
        await cache.clear();
      },
    },
    {
      id: 'cache-evict-stale',
      label: 'Evict Stale >1h',
      category: 'default',
      handler: async () => {
        await cache.evictOlderThan(60 * 60 * 1000);
      },
    },
  ];
}

export function autoSaveActions(autoSave: AutoSave): NodeAction[] {
  return [
    {
      id: 'autosave-force',
      label: 'Force Save',
      category: 'default',
      handler: async () => {
        await autoSave.save('manual');
      },
    },
    {
      id: 'autosave-toggle',
      label: autoSave.isRunning ? 'Stop Auto-Save' : 'Start Auto-Save',
      category: 'info',
      handler: () => {
        if (autoSave.isRunning) {
          autoSave.stop();
        } else {
          autoSave.start();
        }
      },
    },
  ];
}

export function saveStateStoreActions(resetFn: () => void): NodeAction[] {
  return [
    {
      id: 'gamestore-reset',
      label: 'Reset State',
      category: 'danger',
      confirm: 'Reset all game state? This cannot be undone.',
      handler: () => {
        resetFn();
      },
    },
  ];
}

export function perfMonitorActions(resetFn: () => void): NodeAction[] {
  return [
    {
      id: 'perf-reset',
      label: 'Reset Metrics',
      category: 'default',
      handler: () => {
        resetFn();
      },
    },
  ];
}
