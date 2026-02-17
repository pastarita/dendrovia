import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useRendererStore } from '../store/useRendererStore';

/**
 * PERFORMANCE MONITOR
 *
 * Samples FPS and renderer stats every 30 frames, updates the store.
 * After each sample, triggers adaptive quality tuning (D3) which
 * shifts quality tier up/down based on FPS history with hysteresis.
 *
 * Uses getState() for writes to avoid re-render churn.
 */

const SAMPLE_INTERVAL = 30; // frames between updates

export function PerformanceMonitor() {
  const { gl } = useThree();
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current < SAMPLE_INTERVAL) return;

    const now = performance.now();
    const elapsed = now - lastTime.current;
    const fps = Math.round((frameCount.current / elapsed) * 1000);

    const info = gl.info;
    const store = useRendererStore.getState();

    store.updatePerformance(
      fps,
      info.render.calls,
      info.render.triangles,
    );

    // D3: Adaptive quality tuning after each FPS sample
    store.autoTuneQuality();

    frameCount.current = 0;
    lastTime.current = now;
  });

  return null;
}
