/**
 * NavigationBar — Horizontal row of toggle buttons for discoverable panel access.
 *
 * Exposes MillerColumns, QuestLog, and camera mode toggle that were
 * previously only reachable via keyboard shortcuts.
 */

import React from 'react';
import { useOculusStore } from '../store/useOculusStore';
import type { ActivePanel } from '../store/useOculusStore';
import { useInputCapture } from '../hooks/useInputCapture';

interface NavButtonProps {
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}

function NavButton({ label, hint, active, onClick }: NavButtonProps) {
  return (
    <button
      className="oculus-button"
      onClick={onClick}
      style={{
        borderColor: active ? 'var(--oculus-amber)' : undefined,
        background: active ? 'rgba(245, 169, 127, 0.25)' : undefined,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--oculus-space-xs)',
        padding: 'var(--oculus-space-xs) var(--oculus-space-sm)',
        fontSize: 'var(--oculus-font-xs)',
      }}
      aria-pressed={active}
      title={`${label} [${hint}]`}
    >
      <span>{label}</span>
      <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>{hint}</span>
    </button>
  );
}

export function NavigationBar() {
  const activePanel = useOculusStore((s) => s.activePanel);
  const togglePanel = useOculusStore((s) => s.togglePanel);
  const cameraMode = useOculusStore((s) => s.cameraMode);
  const setCameraMode = useOculusStore((s) => s.setCameraMode);
  const { onPointerEnter, onPointerLeave } = useInputCapture();

  const handleCameraToggle = () => {
    setCameraMode(cameraMode === 'falcon' ? 'player' : 'falcon');
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--oculus-space-xs)',
        marginBottom: 'var(--oculus-space-sm)',
      }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      role="toolbar"
      aria-label="Navigation"
    >
      <NavButton
        label="Files"
        hint="M"
        active={activePanel === 'miller-columns'}
        onClick={() => togglePanel('miller-columns')}
      />
      <NavButton
        label="Quests"
        hint="Q"
        active={activePanel === 'quest-log'}
        onClick={() => togglePanel('quest-log')}
      />
      <NavButton
        label={cameraMode === 'falcon' ? 'Falcon' : 'Player'}
        hint="C"
        active={false}
        onClick={handleCameraToggle}
      />
    </div>
  );
}
