'use client';

/**
 * LayoutExporter — Dev panel for managing panel layouts
 *
 * Shows panel list table, Copy JSON button, Import textarea,
 * Reset/Lock all controls.
 */

import React, { useState, useCallback } from 'react';
import { usePanelStore } from '../../store/usePanelStore';
import { ManagedPanel } from '../ManagedPanel';

function LayoutExporterContent() {
  const panels = usePanelStore((s) => s.panels);
  const exportLayout = usePanelStore((s) => s.exportLayout);
  const loadLayout = usePanelStore((s) => s.loadLayout);
  const resetAllGeometry = usePanelStore((s) => s.resetAllGeometry);
  const lockAll = usePanelStore((s) => s.lockAll);
  const unlockAll = usePanelStore((s) => s.unlockAll);
  const toggleVisibility = usePanelStore((s) => s.toggleVisibility);
  const resetGeometry = usePanelStore((s) => s.resetGeometry);

  const [importText, setImportText] = useState('');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleCopy = useCallback(async () => {
    const snapshot = exportLayout();
    const json = JSON.stringify(snapshot, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopyStatus('Copied!');
    } catch {
      setCopyStatus('Failed to copy');
    }
    setTimeout(() => setCopyStatus(null), 2000);
  }, [exportLayout]);

  const handleImport = useCallback(() => {
    try {
      const parsed = JSON.parse(importText);
      loadLayout(parsed);
      setImportText('');
    } catch {
      // Invalid JSON — silently ignore
    }
  }, [importText, loadLayout]);

  const panelList = Object.values(panels).filter((p) => p.id !== 'layout-exporter');

  return (
    <div style={{ fontSize: 'var(--oculus-font-xs)' }}>
      <div className="oculus-heading" style={{ fontSize: 'var(--oculus-font-xs)' }}>
        Panel Registry
      </div>

      {/* Panel table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--oculus-space-md)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--oculus-border)' }}>
            <th style={{ textAlign: 'left', padding: '4px 6px' }}>Panel</th>
            <th style={{ textAlign: 'center', padding: '4px 6px' }}>Vis</th>
            <th style={{ textAlign: 'right', padding: '4px 6px' }}>X,Y</th>
            <th style={{ textAlign: 'right', padding: '4px 6px' }}>W×H</th>
            <th style={{ textAlign: 'center', padding: '4px 6px' }}></th>
          </tr>
        </thead>
        <tbody>
          {panelList.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '4px 6px', color: p.visible ? 'var(--oculus-text)' : 'var(--oculus-text-muted)' }}>
                {p.title}
              </td>
              <td style={{ textAlign: 'center', padding: '4px 6px' }}>
                <button
                  className="managed-panel__btn"
                  onClick={() => toggleVisibility(p.id)}
                  style={{ display: 'inline' }}
                >
                  {p.visible ? 'ON' : 'off'}
                </button>
              </td>
              <td style={{ textAlign: 'right', padding: '4px 6px', fontFamily: 'var(--oculus-font-code)', color: 'var(--oculus-text-muted)' }}>
                {Math.round(p.geometry.x)},{Math.round(p.geometry.y)}
              </td>
              <td style={{ textAlign: 'right', padding: '4px 6px', fontFamily: 'var(--oculus-font-code)', color: 'var(--oculus-text-muted)' }}>
                {Math.round(p.geometry.width)}&times;{Math.round(p.geometry.height)}
              </td>
              <td style={{ textAlign: 'center', padding: '4px 6px' }}>
                <button
                  className="managed-panel__btn"
                  onClick={() => resetGeometry(p.id)}
                  title="Reset position"
                >
                  R
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--oculus-space-sm)', flexWrap: 'wrap', marginBottom: 'var(--oculus-space-md)' }}>
        <button className="oculus-button oculus-button--primary" onClick={handleCopy}>
          {copyStatus ?? 'Copy Layout JSON'}
        </button>
        <button className="oculus-button" onClick={resetAllGeometry}>Reset All</button>
        <button className="oculus-button" onClick={lockAll}>Lock All</button>
        <button className="oculus-button" onClick={unlockAll}>Unlock All</button>
      </div>

      {/* Import */}
      <div className="oculus-heading" style={{ fontSize: 'var(--oculus-font-xs)' }}>
        Import Layout
      </div>
      <textarea
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        placeholder="Paste layout JSON here..."
        style={{
          width: '100%',
          height: 80,
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--oculus-border)',
          borderRadius: 'var(--oculus-panel-radius)',
          color: 'var(--oculus-text)',
          fontFamily: 'var(--oculus-font-code)',
          fontSize: 'var(--oculus-font-xs)',
          padding: 'var(--oculus-space-sm)',
          resize: 'vertical',
        }}
      />
      <button
        className="oculus-button"
        onClick={handleImport}
        disabled={!importText.trim()}
        style={{ marginTop: 'var(--oculus-space-xs)' }}
      >
        Apply Layout
      </button>
    </div>
  );
}

export function LayoutExporter() {
  return (
    <ManagedPanel panelId="layout-exporter">
      <LayoutExporterContent />
    </ManagedPanel>
  );
}
