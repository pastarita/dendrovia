/**
 * Gym Kit — Reusable layout system for interactive sandbox pages.
 *
 * Provides the standard gym shell with:
 * - Header + back navigation
 * - Controls render-prop slot
 * - Viewport render-prop slot
 * - EventBus wiretap (live event stream)
 * - State dashboard (live Zustand snapshot)
 * - Provider wiring (EventBus + OculusProvider + store seeding)
 */

export { GymControlPanel } from './GymControlPanel';

// Sub-components (for advanced composition)
export { GymProvider, useGymEventBus } from './GymProvider';
// Shell
export { GymShell } from './GymShell';
export { GymStateDash } from './GymStateDash';
export { GymViewport } from './GymViewport';
export { GymWiretap } from './GymWiretap';
// Styles
export * from './gym-styles';
// Types
export type { GymPageConfig, GymRenderProps, GymSlots, WiretapEntry } from './types';
