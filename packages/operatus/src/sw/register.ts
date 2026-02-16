/**
 * Service Worker Registration
 *
 * Handles SW registration, update detection, and lifecycle management.
 * Call `registerServiceWorker()` during app initialization.
 */

import { createLogger } from '@dendrovia/shared/logger';

const log = createLogger('OPERATUS', 'sw');

export interface SWRegistrationConfig {
  /** Path to the service worker script (default: '/sw.js') */
  swPath?: string;
  /** Scope for the service worker (default: '/') */
  scope?: string;
  /** Callback when a new SW version is available */
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  /** Callback when SW is installed for the first time */
  onInstall?: (registration: ServiceWorkerRegistration) => void;
}

export interface SWController {
  /** The active registration */
  registration: ServiceWorkerRegistration | null;
  /** Send a message to the service worker */
  postMessage: (message: { type: string; payload?: any }) => void;
  /** Force the waiting SW to activate */
  skipWaiting: () => void;
  /** Unregister the service worker */
  unregister: () => Promise<boolean>;
}

/**
 * Register the OPERATUS service worker.
 * No-ops in environments where SW is unavailable (non-HTTPS, SSR).
 */
export async function registerServiceWorker(
  config: SWRegistrationConfig = {},
): Promise<SWController> {
  const {
    swPath = '/sw.js',
    scope = '/',
    onUpdate,
    onInstall,
  } = config;

  const controller: SWController = {
    registration: null,
    postMessage: () => {},
    skipWaiting: () => {},
    unregister: async () => false,
  };

  // Guard: SW not available
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return controller;
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath, { scope });
    controller.registration = registration;

    // Set up message channel
    controller.postMessage = (message) => {
      registration.active?.postMessage(message);
    };

    controller.skipWaiting = () => {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    };

    controller.unregister = () => registration.unregister();

    // Detect updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New version available (existing SW is active)
            onUpdate?.(registration);
          } else {
            // First install
            onInstall?.(registration);
          }
        }
      });
    });

    // Handle controller change (new SW took over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Optionally reload the page to use new assets
    });

  } catch (err) {
    log.warn({ err }, 'Service worker registration failed');
  }

  return controller;
}

/**
 * Invalidate the SW generated asset cache.
 * Call this after loading a new manifest.
 */
export function invalidateSWCache(controller: SWController): void {
  controller.postMessage({
    type: 'INVALIDATE_CACHE',
    payload: { cacheName: 'dendrovia-generated' },
  });
}

/**
 * Pre-cache URLs via the service worker.
 */
export function precacheURLs(controller: SWController, urls: string[]): void {
  controller.postMessage({
    type: 'CACHE_URLS',
    payload: { urls },
  });
}
