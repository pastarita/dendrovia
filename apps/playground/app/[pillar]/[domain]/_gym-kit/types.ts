/**
 * Gym Kit — Type definitions for interactive sandbox pages.
 *
 * Gyms use render-prop slots (not descriptors) because each gym's
 * controls are unique and tightly coupled to its EventBus logic.
 */

import type { ReactNode } from 'react';

/** Configuration for a gym page's header and viewport appearance. */
export interface GymPageConfig {
  title: string;
  subtitle: string;
  icon: string;
  backHref: string;
  backLabel: string;
  /** Viewport gradient CSS (e.g. 'linear-gradient(135deg, #0a0f0a, #1a1a2e, #0a0a0a)') */
  viewportGradient: string;
  /** Large watermark emoji rendered at 10% opacity in viewport center */
  viewportWatermark: string;
  /** Store keys to display in state dashboard */
  watchedState?: string[];
}

/** A single captured event from the EventBus wiretap. */
export interface WiretapEntry {
  id: number;
  timestamp: number;
  event: string;
  payload: unknown;
  /** Inferred from event key prefix (e.g. 'player' → ARCHITECTUS) */
  pillar: string;
}

/** Render props passed to the GymShell children function. */
export interface GymRenderProps {
  /** The EventBus instance for emitting events from controls */
  eventBus: import('@dendrovia/shared').EventBus;
}

/** The children function shape for GymShell. */
export interface GymSlots {
  controls: ReactNode;
  viewport: ReactNode;
}
