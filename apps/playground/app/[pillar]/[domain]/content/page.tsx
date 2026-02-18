import dynamic from 'next/dynamic';

const GeneratorsClient = dynamic(() => import('./GeneratorsClient').then(m => ({ default: m.GeneratorsClient ?? m.default })), {
  ssr: false,
  loading: () => <div style={{ padding: '2rem', opacity: 0.4 }}>Loading Generators...</div>,
});

export default function ContentPage() {
  return <GeneratorsClient />;
}
