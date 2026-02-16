/**
 * Test Setup — Browser API Polyfills
 *
 * Bun's test runner lacks browser globals (IndexedDB, localStorage,
 * BroadcastChannel, etc.). This preload script installs minimal
 * polyfills so OPERATUS modules can be tested.
 */

import 'fake-indexeddb/auto';

// localStorage mock
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (i: number) => [...store.keys()][i] ?? null,
  };
}
