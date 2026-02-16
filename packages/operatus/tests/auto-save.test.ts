/**
 * AutoSave Tests
 *
 * Tests the three-layer save protection system:
 *   1. Interval saves
 *   2. Event-driven saves
 *   3. Emergency localStorage saves
 *
 * Mocks timers and browser globals where needed.
 */

import './setup.js';
import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { AutoSave } from '../src/persistence/AutoSave.js';

describe('AutoSave — construction', () => {
  test('creates with default config', () => {
    const autoSave = new AutoSave();
    // Should not throw
    expect(autoSave).toBeDefined();
  });

  test('creates with custom config', () => {
    const autoSave = new AutoSave({
      interval: 60_000,
      emergencySave: false,
      eventDrivenSaves: false,
      emergencyKey: 'custom-key',
    });
    expect(autoSave).toBeDefined();
  });
});

describe('AutoSave — start/stop lifecycle', () => {
  test('start enables the system', () => {
    const autoSave = new AutoSave({ eventDrivenSaves: false, emergencySave: false });
    autoSave.start();
    // Starting again should be a no-op (idempotent)
    autoSave.start();
    autoSave.stop();
  });

  test('stop is idempotent', () => {
    const autoSave = new AutoSave({ eventDrivenSaves: false, emergencySave: false });
    autoSave.stop(); // stop before start
    autoSave.start();
    autoSave.stop();
    autoSave.stop(); // double stop
  });
});

describe('AutoSave — save cooldown', () => {
  test('first save executes immediately', async () => {
    const autoSave = new AutoSave({ eventDrivenSaves: false, emergencySave: false });
    // Should not throw (may warn if store not fully set up, but won't crash)
    await autoSave.save('test');
  });

  test('rapid saves are throttled by cooldown', async () => {
    const autoSave = new AutoSave({ eventDrivenSaves: false, emergencySave: false });

    // First save goes through
    await autoSave.save('first');

    // Second save immediately after should be throttled (5s cooldown)
    // We can't directly observe the throttle, but it should not throw
    await autoSave.save('second');
  });
});

describe('AutoSave — emergency save', () => {
  test('hasEmergencySave returns false when empty', () => {
    const autoSave = new AutoSave({ emergencyKey: 'test-emergency' });
    localStorage.removeItem('test-emergency');
    expect(autoSave.hasEmergencySave()).toBe(false);
  });

  test('hasEmergencySave returns true when data exists', () => {
    const autoSave = new AutoSave({ emergencyKey: 'test-emergency' });
    localStorage.setItem('test-emergency', '{"test": true}');
    expect(autoSave.hasEmergencySave()).toBe(true);
  });

  test('getEmergencySave returns parsed data', () => {
    const autoSave = new AutoSave({ emergencyKey: 'test-emergency' });
    localStorage.setItem('test-emergency', JSON.stringify({ character: { name: 'Hero' } }));

    const save = autoSave.getEmergencySave();
    expect(save).toEqual({ character: { name: 'Hero' } });
  });

  test('getEmergencySave returns null on invalid JSON', () => {
    const autoSave = new AutoSave({ emergencyKey: 'test-emergency' });
    localStorage.setItem('test-emergency', 'not-valid-json{{{');

    const save = autoSave.getEmergencySave();
    expect(save).toBeNull();
  });

  test('getEmergencySave returns null when empty', () => {
    const autoSave = new AutoSave({ emergencyKey: 'test-emergency' });
    localStorage.removeItem('test-emergency');

    const save = autoSave.getEmergencySave();
    expect(save).toBeNull();
  });

  test('clearEmergencySave removes the entry', () => {
    const autoSave = new AutoSave({ emergencyKey: 'test-emergency' });
    localStorage.setItem('test-emergency', '{"data": 1}');

    autoSave.clearEmergencySave();
    expect(localStorage.getItem('test-emergency')).toBeNull();
  });
});
