'use client';

/**
 * MuseumDetailPanel — Sticky right panel for selected item details.
 *
 * Wraps a render-prop child in a styled container. Each museum
 * page provides its own detail JSX via renderDetail.
 */

import type { ReactNode } from 'react';
import { detailPanelStyle } from './museum-styles';

interface MuseumDetailPanelProps {
  children: ReactNode;
  footer?: ReactNode;
}

export function MuseumDetailPanel({ children, footer }: MuseumDetailPanelProps) {
  return (
    <div style={detailPanelStyle}>
      {children}
      {footer && <div style={{ marginTop: '1rem', borderTop: '1px solid #222', paddingTop: '1rem' }}>{footer}</div>}
    </div>
  );
}
