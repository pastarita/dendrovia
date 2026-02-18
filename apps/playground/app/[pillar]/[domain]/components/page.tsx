'use client';

import dynamic from 'next/dynamic';

const ComponentGallery = dynamic(() => import('./ComponentGallery').then(m => ({ default: m.ComponentGallery ?? m.default })), {
  ssr: false,
  loading: () => <div style={{ padding: '2rem', opacity: 0.4 }}>Loading Component Gallery...</div>,
});

export default function ComponentsPage() {
  return <ComponentGallery />;
}
