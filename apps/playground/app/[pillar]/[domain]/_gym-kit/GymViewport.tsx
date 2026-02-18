'use client';

/**
 * GymViewport — 60vh rendering area with gradient background and watermark.
 *
 * Wraps the gym's primary visual content (e.g. <HUD />) with a
 * configurable gradient background and a large semi-transparent emoji watermark.
 */

import type { ReactNode } from 'react';
import { viewportStyle, viewportWatermarkStyle } from './gym-styles';

interface GymViewportProps {
  gradient: string;
  watermark: string;
  children: ReactNode;
}

export function GymViewport({ gradient, watermark, children }: GymViewportProps) {
  return (
    <div style={viewportStyle(gradient)}>
      <div style={viewportWatermarkStyle}>{watermark}</div>
      {children}
    </div>
  );
}
