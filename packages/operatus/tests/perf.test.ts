/**
 * PerfMonitor Tests
 *
 * Tests performance instrumentation.
 * Uses Bun's built-in performance API.
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { PerfMonitor } from '../src/perf/PerfMonitor.js';

describe('PerfMonitor', () => {
  let monitor: PerfMonitor;

  beforeEach(() => {
    monitor = new PerfMonitor(true);
    monitor.reset();
  });

  test('tracks marks and measures', () => {
    monitor.mark('test-op');

    // Simulate some work
    let _sum = 0;
    for (let i = 0; i < 10000; i++) _sum += i;

    const duration = monitor.measure('test-op');

    expect(duration).toBeGreaterThanOrEqual(0);

    const timings = monitor.getAssetTimings();
    expect(timings.length).toBe(1);
    expect(timings[0].name).toBe('test-op');
  });

  test('tracks cache hits and misses', () => {
    monitor.cacheHit();
    monitor.cacheHit();
    monitor.cacheHit();
    monitor.cacheMiss();

    const metrics = monitor.getCacheMetrics();

    expect(metrics.hits).toBe(3);
    expect(metrics.misses).toBe(1);
    expect(metrics.hitRate).toBe(0.75);
  });

  test('cache hit rate is 0 with no operations', () => {
    const metrics = monitor.getCacheMetrics();

    expect(metrics.hits).toBe(0);
    expect(metrics.misses).toBe(0);
    expect(metrics.hitRate).toBe(0);
  });

  test('timeAsync records duration', async () => {
    const result = await monitor.timeAsync('async-op', async () => {
      await new Promise((r) => setTimeout(r, 10));
      return 42;
    });

    expect(result).toBe(42);

    const timings = monitor.getAssetTimings();
    expect(timings.length).toBe(1);
    expect(timings[0].name).toBe('async-op');
    expect(timings[0].duration).toBeGreaterThan(0);
  });

  test('timeAsync records timing even on error', async () => {
    try {
      await monitor.timeAsync('failing-op', async () => {
        throw new Error('boom');
      });
    } catch {
      // Expected
    }

    const timings = monitor.getAssetTimings();
    expect(timings.length).toBe(1);
    expect(timings[0].name).toBe('failing-op');
  });

  test('getAssetTimings sorts by duration descending', async () => {
    await monitor.timeAsync('fast', async () => {
      // Minimal work
    });

    await monitor.timeAsync('slow', async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    const timings = monitor.getAssetTimings();
    expect(timings.length).toBe(2);
    expect(timings[0].name).toBe('slow');
    expect(timings[1].name).toBe('fast');
  });

  test('reset clears all metrics', () => {
    monitor.cacheHit();
    monitor.cacheHit();
    monitor.mark('x');
    monitor.measure('x');

    monitor.reset();

    expect(monitor.getCacheMetrics().hits).toBe(0);
    expect(monitor.getAssetTimings().length).toBe(0);
  });

  test('disabled monitor is a no-op', () => {
    const disabled = new PerfMonitor(false);

    disabled.mark('x');
    const duration = disabled.measure('x');
    expect(duration).toBe(0);

    // cache tracking still works (not performance API dependent)
    disabled.cacheHit();
    expect(disabled.getCacheMetrics().hits).toBe(1);
  });
});
