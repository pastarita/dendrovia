'use client';

/**
 * Zoo: Compositions
 *
 * Full HUD layout with all corners populated — demonstrates how
 * OCULUS components compose together as a complete game UI.
 */

import { HUD, useOculusStore } from '@dendrovia/oculus';
import Link from 'next/link';
import { useEffect } from 'react';
import { PlaygroundProvider } from '../../components/PlaygroundProvider';

function CompositionsContent() {
  useEffect(() => {
    // Set some initial state so the HUD has data to show
    const s = useOculusStore.getState();
    s.setHealth(85, 120);
    s.setMana(35, 50);
    s.setCameraMode('falcon');
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Full HUD Composition</h2>
      <p style={{ opacity: 0.5, fontSize: '0.85rem', marginBottom: '1rem' }}>
        The complete HUD with all four corners populated. In production this overlays the 3D scene.
      </p>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '70vh',
          minHeight: 500,
          background: 'linear-gradient(135deg, #0a0f0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #222',
        }}
      >
        {/* Mock 3D scene background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.15,
            fontSize: '6rem',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          🌳
        </div>
        <HUD />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Combat Composition</h2>
        <p style={{ opacity: 0.5, fontSize: '0.85rem', marginBottom: '1rem' }}>
          HUD during an active combat encounter — BattleUI takes center stage.
        </p>
        <CombatComposition />
      </div>
    </div>
  );
}

function CombatComposition() {
  useEffect(() => {
    const s = useOculusStore.getState();
    s.startCombat(
      { id: 'bug-demo', type: 'race-condition', severity: 4, health: 60, position: [0, 0, 0], sourceCommit: 'f00ba12' },
      [
        {
          id: 's1',
          name: 'Git Blame',
          description: 'Trace origin',
          manaCost: 10,
          cooldown: 2,
          effect: { type: 'damage', target: 'enemy', value: 15 },
          element: 'fire',
        },
        {
          id: 's2',
          name: 'Git Bisect',
          description: 'Binary search',
          manaCost: 20,
          cooldown: 3,
          effect: { type: 'damage', target: 'enemy', value: 30 },
          element: 'air',
        },
      ],
    );
    s.addBattleLog('Turn 1: Your turn begins');
    s.addBattleLog('Explorer cast Git Blame: 15 damage!');
    return () => {
      useOculusStore.getState().endCombat();
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '70vh',
        minHeight: 500,
        background: 'linear-gradient(135deg, #1a0a0a 0%, #2e1a1a 50%, #0a0a0a 100%)',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #333',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.15,
          fontSize: '6rem',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        🐛
      </div>
      <HUD />
    </div>
  );
}

export default function CompositionsPage() {
  return (
    <div>
      <Link href="/zoos" style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        &larr; Zoos
      </Link>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Compositions</h1>
      <p style={{ opacity: 0.5, marginBottom: '2rem' }}>Full HUD layouts showing how components compose together</p>
      <PlaygroundProvider>
        <CompositionsContent />
      </PlaygroundProvider>
    </div>
  );
}
