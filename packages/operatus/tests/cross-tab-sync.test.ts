/**
 * CrossTabSync Tests
 *
 * Tests the multi-tab synchronization system.
 * Since Bun doesn't have BroadcastChannel or Web Locks,
 * these tests verify graceful degradation to solo mode
 * and the config/status API surface.
 */

import './setup.js';
import { describe, expect, test } from 'bun:test';
import { CrossTabSync } from '../src/sync/CrossTabSync.js';

describe('CrossTabSync — construction', () => {
  test('creates with default config', () => {
    const sync = new CrossTabSync();
    expect(sync).toBeDefined();
  });

  test('creates with custom config', () => {
    const sync = new CrossTabSync({
      channelName: 'test-channel',
      lockName: 'test-lock',
      broadcastDebounce: 200,
    });
    expect(sync).toBeDefined();
  });

  test('generates a tabId', () => {
    const sync = new CrossTabSync();
    const status = sync.getStatus();
    expect(status.tabId).toBeTruthy();
    expect(typeof status.tabId).toBe('string');
  });
});

describe('CrossTabSync — solo mode (no BroadcastChannel)', () => {
  test('start returns solo when BroadcastChannel unavailable', async () => {
    // Bun doesn't have BroadcastChannel, so this falls into solo mode
    const hasBroadcast = typeof BroadcastChannel !== 'undefined';
    const sync = new CrossTabSync();
    const role = await sync.start();

    if (!hasBroadcast) {
      expect(role).toBe('solo');
    }

    sync.stop();
  });

  test('isLeader is true in solo mode', async () => {
    const hasBroadcast = typeof BroadcastChannel !== 'undefined';
    if (hasBroadcast) return; // Skip if BroadcastChannel exists

    const sync = new CrossTabSync();
    await sync.start();
    expect(sync.isLeader).toBe(true);
    sync.stop();
  });

  test('getStatus reports channel/locks availability', () => {
    const sync = new CrossTabSync();
    const status = sync.getStatus();

    expect(typeof status.channelAvailable).toBe('boolean');
    expect(typeof status.locksAvailable).toBe('boolean');
    expect(status.role).toBe('solo');
  });
});

describe('CrossTabSync — lifecycle', () => {
  test('stop is safe before start', () => {
    const sync = new CrossTabSync();
    sync.stop(); // Should not throw
  });

  test('stop cleans up after start', async () => {
    const sync = new CrossTabSync();
    await sync.start();
    sync.stop();
    expect(sync.getStatus().role).toBe('solo');
  });

  test('double stop is safe', async () => {
    const sync = new CrossTabSync();
    await sync.start();
    sync.stop();
    sync.stop();
  });
});

describe('CrossTabSync — role change callback', () => {
  test('setRoleChangeCallback accepts a function', () => {
    const sync = new CrossTabSync();
    const calls: string[] = [];
    sync.setRoleChangeCallback((role) => calls.push(role));
    // Callback set — no immediate invocation expected
    expect(calls).toHaveLength(0);
  });
});
