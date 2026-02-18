'use client';

import dynamic from 'next/dynamic';

const ShowcaseGallery = dynamic(() => import('./ShowcaseGallery').then(m => ({ default: m.ShowcaseGallery ?? m.default })), {
  ssr: false,
  loading: () => <div style={{ padding: '2rem', opacity: 0.4 }}>Loading Topology Museum...</div>,
});

export default function TopologyPage() {
  return <ShowcaseGallery />;
}
