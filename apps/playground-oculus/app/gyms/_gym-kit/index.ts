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

// Shell
export { GymShell } from './GymShell';

// Sub-components (for advanced composition)
export { GymProvider, useGymEventBus } from './GymProvider';
export { GymControlPanel } from './GymControlPanel';
export { GymViewport } from './GymViewport';
export { GymWiretap } from './GymWiretap';
export { GymStateDash } from './GymStateDash';

// Types
export type { GymPageConfig, GymRenderProps, GymSlots, WiretapEntry } from './types';

// Styles
export * from './gym-styles';
