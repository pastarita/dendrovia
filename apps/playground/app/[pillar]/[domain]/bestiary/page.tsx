import dynamic from 'next/dynamic';

const ZooClient = dynamic(() => import('./ZooClient').then(m => ({ default: m.ZooClient ?? m.default })), {
  ssr: false,
  loading: () => <div style={{ padding: '2rem', opacity: 0.4 }}>Loading Bestiary...</div>,
});

export default function BestiaryPage() {
  return <ZooClient />;
}
