import dynamic from 'next/dynamic';

const MuseumsClient = dynamic(() => import('./MuseumsClient').then(m => ({ default: m.MuseumsClient ?? m.default })), {
  ssr: false,
  loading: () => <div style={{ padding: '2rem', opacity: 0.4 }}>Loading Game Mechanics Museum...</div>,
});

export default function MechanicsPage() {
  return <MuseumsClient />;
}
