import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { useRendererStore } from '../store/useRendererStore';

/**
 * PERFORMANCE MONITOR
 *
 * Samples FPS and renderer stats every 30 frames, updates the store.
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
    useRendererStore.getState().updatePerformance(fps, info.render.calls, info.render.triangles);

    frameCount.current = 0;
    lastTime.current = now;
  });

  return null;
}
