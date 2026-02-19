'use client';

/**
 * Input Capture Coordination
 *
 * When the user hovers over OCULUS UI elements, this hook
 * signals the engine to suppress camera controls.
 */

import { useCallback } from 'react';
import { useRendererStore } from '@dendrovia/architectus';

/**
 * Returns pointer handlers to attach to interactive OCULUS panels.
 * Sets `isUiHovered` in the ARCHITECTUS renderer store so the engine
 * can suppress camera rotation.
 */
export function useInputCapture() {
  const setUiHovered = useRendererStore((s) => s.setUiHovered);

  const onPointerEnter = useCallback(() => setUiHovered(true), [setUiHovered]);
  const onPointerLeave = useCallback(() => setUiHovered(false), [setUiHovered]);

  return { onPointerEnter, onPointerLeave };
}

/**
 * Read-only hook for consumers (e.g. CameraController) to check
 * if the UI is currently capturing input.
 */
export function useIsUiHovered(): boolean {
  return useRendererStore((s) => s.isUiHovered);
}
