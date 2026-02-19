'use client';

/**
 * DendroviaShell — Layout component for the 3D canvas + overlay stack.
 *
 * Renders ARCHITECTUS (3D scene) as the base layer with OCULUS HUD and
 * children as absolute-positioned overlays on top.
 */

import type { ReactNode } from 'react';
import { App as ArchitectusApp } from '@dendrovia/architectus';
import { HUD } from '@dendrovia/oculus';
import { useBootstrap } from './BootstrapProvider';

export interface DendroviaShellProps {
  manifestPath?: string;
  enableOculus?: boolean;
  children?: ReactNode;
}

export function DendroviaShell({
  manifestPath = '/generated/manifest.json',
  enableOculus = true,
  children,
}: DendroviaShellProps) {
  const { topology, topologyError } = useBootstrap();

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ArchitectusApp
        topology={topology?.tree}
        hotspots={topology?.hotspots}
        manifestPath={manifestPath}
      />
      {topologyError && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(20, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#f87171',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.75rem',
            maxWidth: '500px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '2px' }}>Topology failed to load</div>
          <div style={{ opacity: 0.7 }}>{topologyError}</div>
          <div style={{ opacity: 0.5, marginTop: '4px' }}>Showing demo data as fallback</div>
        </div>
      )}
      {enableOculus && <HUD />}
      {children}
    </div>
  );
}
