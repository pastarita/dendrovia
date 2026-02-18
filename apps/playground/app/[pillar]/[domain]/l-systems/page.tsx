'use client';

import dynamic from 'next/dynamic';

const LSystemSandbox = dynamic(() => import('./LSystemSandbox').then(m => ({ default: m.LSystemSandbox ?? m.default })), {
  ssr: false,
  loading: () => <div style={{ padding: '2rem', opacity: 0.4 }}>Loading L-System Sandbox...</div>,
});

export default function LSystemsPage() {
  return <LSystemSandbox />;
}
