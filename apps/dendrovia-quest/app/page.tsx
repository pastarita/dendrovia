import { DendroviaQuest } from './components/DendroviaQuest';

export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <DendroviaQuest
        topologyPath="/generated/topology.json"
        enableOperatus={false}
      />
    </div>
  );
}
