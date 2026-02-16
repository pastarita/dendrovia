'use client';

/**
 * GymShell — Main layout for gym pages.
 *
 * Provides the standard gym structure:
 *   Header (back link + title + subtitle)
 *   Controls slot (render prop)
 *   Viewport slot (render prop)
 *   Bottom panels: Wiretap + State Dashboard
 *
 * Usage:
 *   <GymShell config={config} seed={optionalSeed}>
 *     {({ eventBus }) => ({
 *       controls: <MyControls eventBus={eventBus} />,
 *       viewport: <HUD />,
 *     })}
 *   </GymShell>
 */

import Link from 'next/link';
import type { GymPageConfig, GymSlots } from './types';
import type { EventBus } from '@dendrovia/shared';
import { GymProvider } from './GymProvider';
import { GymViewport } from './GymViewport';
import { GymWiretap } from './GymWiretap';
import { GymStateDash } from './GymStateDash';

interface GymShellProps {
  config: GymPageConfig;
  /** Custom store seed function passed to GymProvider */
  seed?: () => void;
  children: (props: { eventBus: EventBus }) => GymSlots;
}

export function GymShell({ config, seed, children }: GymShellProps) {
  return (
    <div>
      {/* Header */}
      <Link href={config.backHref} style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        &larr; {config.backLabel}
      </Link>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
        {config.icon} {config.title}
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '2rem' }}>{config.subtitle}</p>

      {/* Provider + Content */}
      <GymProvider seed={seed}>
        {(eventBus) => {
          const slots = children({ eventBus });
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Controls slot */}
              {slots.controls}

              {/* Viewport slot */}
              <GymViewport
                gradient={config.viewportGradient}
                watermark={config.viewportWatermark}
              >
                {slots.viewport}
              </GymViewport>

              {/* Bottom panels: Wiretap + State Dashboard */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <GymWiretap eventBus={eventBus} />
                <GymStateDash watchedKeys={config.watchedState} />
              </div>
            </div>
          );
        }}
      </GymProvider>
    </div>
  );
}
