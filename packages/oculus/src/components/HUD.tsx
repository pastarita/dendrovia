'use client';

/**
 * HUD — Always-visible heads-up display
 *
 * Shows player stats, mode indicator, and anchors for
 * minimap, quest tracker, and controls.
 * pointer-events: none on container; auto only on interactive children.
 */

import React from 'react';
import { useOculusStore } from '../store/useOculusStore';
import { useOculus } from '../OculusProvider';
import { Panel } from './primitives/Panel';
import { ProgressBar } from './primitives/ProgressBar';
import { StatLabel } from './primitives/StatLabel';
import { IconBadge } from './primitives/IconBadge';
import { Minimap } from './Minimap';
import { QuestLog } from './QuestLog';
import { BattleUI } from './BattleUI';
import { StatusEffectBar } from './StatusEffectBar';
import { LootPanel } from './LootPanel';
import { FalconModeOverlay } from './FalconModeOverlay';
import { WorldHeader } from './WorldHeader';
import { NavigationBar } from './NavigationBar';
import { PanelWindowManager } from './PanelWindowManager';
import { LayoutExporter, DevStateInspector } from './dev';

export function HUD() {
  const health = useOculusStore((s) => s.health);
  const maxHealth = useOculusStore((s) => s.maxHealth);
  const mana = useOculusStore((s) => s.mana);
  const maxMana = useOculusStore((s) => s.maxMana);
  const level = useOculusStore((s) => s.level);
  const cameraMode = useOculusStore((s) => s.cameraMode);
  const battle = useOculusStore((s) => s.battle);
  const { config } = useOculus();

  return (
    <div className="oculus-hud" role="status" aria-label="Game HUD">
      {/* ── Top-Left: World Header + Player Stats ─────── */}
      <div className="oculus-corner oculus-corner--top-left">
        <WorldHeader />
        <Panel compact aria-label="Player stats">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--oculus-space-sm)', marginBottom: 'var(--oculus-space-sm)' }}>
            <IconBadge
              icon={cameraMode === 'falcon' ? '\u{1F985}' : '\u{1F9D9}'}
              label={cameraMode === 'falcon' ? 'Falcon Mode' : 'Player Mode'}
              size="sm"
              color={cameraMode === 'falcon' ? 'var(--oculus-mana)' : 'var(--oculus-amber)'}
            />
            <span className="oculus-heading" style={{ margin: 0, fontSize: 'var(--oculus-font-xs)' }}>
              {cameraMode === 'falcon' ? 'FALCON' : 'PLAYER'}
            </span>
            <StatLabel label="Lvl" value={level} />
          </div>

          {/* Health */}
          <div style={{ marginBottom: 'var(--oculus-space-xs)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--oculus-font-xs)', marginBottom: 2 }}>
              <span style={{ color: 'var(--oculus-health)' }}>HP</span>
              <span style={{ color: 'var(--oculus-text-muted)' }}>{Math.round(health)}/{maxHealth}</span>
            </div>
            <ProgressBar value={health} max={maxHealth} variant="health" height={6} flash />
          </div>

          {/* Mana */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--oculus-font-xs)', marginBottom: 2 }}>
              <span style={{ color: 'var(--oculus-mana)' }}>MP</span>
              <span style={{ color: 'var(--oculus-text-muted)' }}>{Math.round(mana)}/{maxMana}</span>
            </div>
            <ProgressBar value={mana} max={maxMana} variant="mana" height={6} />
          </div>
        </Panel>
        <StatusEffectBar />
      </div>

      {/* ── Top-Right: Minimap ──────────────────────── */}
      <div className="oculus-corner oculus-corner--top-right">
        <Minimap />
      </div>

      {/* ── Bottom-Left: Quest Tracker ─────────────── */}
      <div className="oculus-corner oculus-corner--bottom-left">
        <QuestLog />
      </div>

      {/* ── Bottom-Right: Navigation + Controls Legend ── */}
      <div className="oculus-corner oculus-corner--bottom-right">
        <NavigationBar />
        <Panel compact aria-label="Controls">
          <div className="oculus-heading">Controls</div>
          <div style={{ fontSize: 'var(--oculus-font-xs)', lineHeight: 1.8, color: 'var(--oculus-text-muted)' }}>
            <div>Click: Orbit / Select</div>
            <div>Scroll: Zoom</div>
            <div>Q: Quest Log</div>
            <div>M: Miller Columns</div>
            <div>Esc: Close Panel</div>
          </div>
        </Panel>
      </div>

      {/* ── Center: Battle UI (when in combat) ─────── */}
      {battle.active && (
        <div className="oculus-center">
          <BattleUI />
        </div>
      )}

      {/* ── Bottom-Center: Falcon Mode Stats ──────────── */}
      <FalconModeOverlay />

      {/* ── Bottom-Center: Loot Notifications ────────── */}
      <div style={{
        position: 'absolute',
        bottom: 'var(--oculus-space-lg)',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'auto',
        zIndex: 10,
      }}>
        <LootPanel />
      </div>

      {/* ── Panel Window Manager (opt-in) ────────────── */}
      {config.enablePanelManagement && (
        <PanelWindowManager>
          <LayoutExporter />
          <DevStateInspector />
        </PanelWindowManager>
      )}
    </div>
  );
}
