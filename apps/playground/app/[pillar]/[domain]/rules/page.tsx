import dynamic from 'next/dynamic';

const HallsClient = dynamic(() => import('./HallsClient').then(m => ({ default: m.HallsClient ?? m.default })), {
  ssr: false,
  loading: () => <div style={{ padding: '2rem', opacity: 0.4 }}>Loading Game Rules...</div>,
});

export default function RulesPage() {
  return <HallsClient />;
}
