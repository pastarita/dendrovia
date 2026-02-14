'use client';

/**
 * Zoo: Primitives Gallery
 *
 * Renders every OCULUS primitive component in isolation with
 * interactive controls for props.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Panel, ProgressBar, IconBadge, StatLabel, Tooltip } from '@dendrovia/oculus';
import { PlaygroundProvider } from '../../components/PlaygroundProvider';

function PrimitivesContent() {
  const [healthVal, setHealthVal] = useState(75);
  const [manaVal, setManaVal] = useState(40);
  const [xpVal, setXpVal] = useState(65);
  const [panelGlow, setPanelGlow] = useState(false);
  const [panelCompact, setPanelCompact] = useState(false);
  const [barHeight, setBarHeight] = useState(8);
  const [badgeSize, setBadgeSize] = useState<'sm' | 'md' | 'lg'>('md');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Panel */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Panel</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <input type="checkbox" checked={panelGlow} onChange={(e) => setPanelGlow(e.target.checked)} />
            glow
          </label>
          <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <input type="checkbox" checked={panelCompact} onChange={(e) => setPanelCompact(e.target.checked)} />
            compact
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Panel glow={panelGlow} compact={panelCompact} aria-label="Demo panel">
            <p style={{ margin: 0 }}>Default Panel</p>
          </Panel>
          <Panel glow compact={false} aria-label="Glow panel">
            <p style={{ margin: 0 }}>Always-glow Panel</p>
          </Panel>
        </div>
      </section>

      {/* ProgressBar */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>ProgressBar</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem' }}>
            Health: {healthVal}
            <input type="range" min={0} max={100} value={healthVal} onChange={(e) => setHealthVal(+e.target.value)} style={{ marginLeft: '0.5rem' }} />
          </label>
          <label style={{ fontSize: '0.85rem' }}>
            Mana: {manaVal}
            <input type="range" min={0} max={50} value={manaVal} onChange={(e) => setManaVal(+e.target.value)} style={{ marginLeft: '0.5rem' }} />
          </label>
          <label style={{ fontSize: '0.85rem' }}>
            XP: {xpVal}
            <input type="range" min={0} max={100} value={xpVal} onChange={(e) => setXpVal(+e.target.value)} style={{ marginLeft: '0.5rem' }} />
          </label>
          <label style={{ fontSize: '0.85rem' }}>
            Height: {barHeight}px
            <input type="range" min={4} max={24} value={barHeight} onChange={(e) => setBarHeight(+e.target.value)} style={{ marginLeft: '0.5rem' }} />
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 400 }}>
          <ProgressBar value={healthVal} max={100} variant="health" showLabel flash height={barHeight} />
          <ProgressBar value={manaVal} max={50} variant="mana" showLabel height={barHeight} />
          <ProgressBar value={xpVal} max={100} variant="xp" showLabel label={`${xpVal} / 100 XP`} height={barHeight} />
          <ProgressBar value={60} max={100} variant="quest" showLabel label="Quest 60%" height={barHeight} />
        </div>
      </section>

      {/* IconBadge */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>IconBadge</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {(['sm', 'md', 'lg'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setBadgeSize(s)}
              style={{ padding: '0.25rem 0.75rem', border: badgeSize === s ? '1px solid var(--pillar-accent)' : '1px solid #333', borderRadius: 4, background: 'transparent', color: 'inherit', cursor: 'pointer' }}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <IconBadge icon="🗡️" label="Attack" size={badgeSize} />
          <IconBadge icon="🛡️" label="Defense" size={badgeSize} color="var(--pillar-accent)" />
          <IconBadge icon="⚡" label="Speed" size={badgeSize} color="#3b82f6" />
          <IconBadge icon="🔥" label="Fire" size={badgeSize} color="#ef4444" />
          <IconBadge icon="💧" label="Water" size={badgeSize} color="#06b6d4" />
        </div>
      </section>

      {/* StatLabel */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>StatLabel</h2>
        <Panel compact aria-label="Stats panel" style={{ maxWidth: 250 }}>
          <StatLabel label="Level" value={5} />
          <StatLabel label="Attack" value={42} color="#ef4444" />
          <StatLabel label="Defense" value={28} color="#3b82f6" />
          <StatLabel label="Speed" value={15} color="#22c55e" />
          <StatLabel label="XP" value="650 / 1000" />
        </Panel>
      </section>

      {/* Tooltip */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Tooltip</h2>
        <div style={{ display: 'flex', gap: '2rem', paddingTop: '2rem' }}>
          <Tooltip content="Appears above" position="top">
            <button style={{ padding: '0.5rem 1rem', border: '1px solid #444', borderRadius: 4, background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
              Top
            </button>
          </Tooltip>
          <Tooltip content="Appears below" position="bottom">
            <button style={{ padding: '0.5rem 1rem', border: '1px solid #444', borderRadius: 4, background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
              Bottom
            </button>
          </Tooltip>
          <Tooltip content="Appears left" position="left">
            <button style={{ padding: '0.5rem 1rem', border: '1px solid #444', borderRadius: 4, background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
              Left
            </button>
          </Tooltip>
          <Tooltip content="Appears right" position="right">
            <button style={{ padding: '0.5rem 1rem', border: '1px solid #444', borderRadius: 4, background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
              Right
            </button>
          </Tooltip>
        </div>
      </section>
    </div>
  );
}

export default function PrimitivesPage() {
  return (
    <div>
      <Link href="/zoos" style={{ fontSize: '0.85rem', opacity: 0.5 }}>&larr; Zoos</Link>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
        Primitives Gallery
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '2rem' }}>
        Every OCULUS primitive component with interactive prop controls
      </p>
      <PlaygroundProvider>
        <PrimitivesContent />
      </PlaygroundProvider>
    </div>
  );
}
