/**
 * DENDROVIA QUEST — Main Game Entry
 *
 * Renders the unified app shell that wires all six pillars together.
 * The DendroviaQuest component handles initialization, loading states,
 * and graceful degradation when individual pillars are unavailable.
 */

import { DendroviaQuest } from './components/DendroviaQuest';

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <DendroviaQuest
        manifestPath="/generated/manifest.json"
      />
    </main>
  );
}
