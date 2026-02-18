'use client';

/**
 * Zoo: View Components
 *
 * Renders each major OCULUS view component with mock data.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Minimap,
  QuestLog,
  BattleUI,
  CodeReader,
  FalconModeOverlay,
  MillerColumns,
  useOculusStore,
} from '@dendrovia/oculus';
import { PlaygroundProvider } from '../../components/PlaygroundProvider';
import { MOCK_BUG, MOCK_SPELLS, MOCK_BATTLE_LOG } from '../../components/mock-data';

function ViewsContent() {
  // Seed battle state for BattleUI demo
  useEffect(() => {
    const s = useOculusStore.getState();
    s.startCombat(MOCK_BUG, MOCK_SPELLS);
    for (const msg of MOCK_BATTLE_LOG.slice(1)) {
      s.addBattleLog(msg);
    }
    // Open code reader for demo
    s.openCodeReader(
      'src/components/App.tsx',
      'import React from "react";\n\nexport function App() {\n  return (\n    <div className="app">\n      <h1>Hello Dendrovia</h1>\n    </div>\n  );\n}\n',
      'typescript'
    );
    // Restore panel to none so user can explore
    s.setActivePanel('none');
  }, []);

  const sections = [
    {
      title: 'Minimap',
      desc: 'SVG spatial visualization with radial node layout',
      render: () => (
        <div style={{ background: '#111', padding: '1rem', borderRadius: 8, display: 'inline-block' }}>
          <Minimap />
        </div>
      ),
    },
    {
      title: 'QuestLog',
      desc: 'Expandable quest tracker with status indicators',
      render: () => (
        <div style={{ maxWidth: 400, position: 'relative' }}>
          <QuestLog />
        </div>
      ),
    },
    {
      title: 'BattleUI',
      desc: 'Combat state display with enemy stats and action buttons',
      render: () => (
        <div style={{ maxWidth: 600, position: 'relative' }}>
          <BattleUI />
        </div>
      ),
    },
    {
      title: 'CodeReader',
      desc: 'Code display with syntax highlighting',
      render: () => {
        // Temporarily set panel so CodeReader renders
        useOculusStore.getState().setActivePanel('code-reader');
        return (
          <div style={{ maxWidth: 600, height: 300, position: 'relative' }}>
            <CodeReader />
          </div>
        );
      },
    },
    {
      title: 'FalconModeOverlay',
      desc: 'Overlay UI shown in falcon (overview) camera mode',
      render: () => (
        <div style={{ position: 'relative', height: 100, background: '#111', borderRadius: 8 }}>
          <FalconModeOverlay />
        </div>
      ),
    },
    {
      title: 'MillerColumns',
      desc: 'Three-column file tree navigator with virtualization',
      render: () => {
        useOculusStore.getState().setActivePanel('miller-columns');
        return (
          <div style={{ maxWidth: 900, height: 400, position: 'relative' }}>
            <MillerColumns />
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      {sections.map((s) => (
        <section key={s.title}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>{s.title}</h2>
          <p style={{ opacity: 0.5, fontSize: '0.85rem', marginBottom: '1rem' }}>{s.desc}</p>
          {s.render()}
        </section>
      ))}
    </div>
  );
}

export default function ViewsPage() {
  return (
    <div>
      <Link href="/" style={{ fontSize: '0.85rem', opacity: 0.5 }}>&larr; OCULUS</Link>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
        View Components
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '2rem' }}>
        Each major OCULUS view component rendered with mock game data
      </p>
      <PlaygroundProvider>
        <ViewsContent />
      </PlaygroundProvider>
    </div>
  );
}
