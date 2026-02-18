'use client';

/**
 * GymControlPanel — Styled container for arbitrary gym controls.
 *
 * A dark panel with an optional title. Each gym fills it with
 * its own sliders, buttons, and status displays.
 */

import type { ReactNode } from 'react';
import { controlPanelStyle } from './gym-styles';

interface GymControlPanelProps {
  title?: string;
  children: ReactNode;
}

export function GymControlPanel({ title = 'Event Controls', children }: GymControlPanelProps) {
  return (
    <div style={controlPanelStyle}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
      {children}
    </div>
  );
}
