'use client';

import dynamic from 'next/dynamic';

const GymClient = dynamic(() => import('./GymClient').then(m => ({ default: m.GymClient ?? m.default })), {
  ssr: false,
  loading: () => <div style={{ padding: '2rem', opacity: 0.4 }}>Loading Combat Sandbox...</div>,
});

export default function CombatPage() {
  return <GymClient />;
}
