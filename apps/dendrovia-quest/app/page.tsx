/**
 * DENDROVIA QUEST - Main Game Entry
 * The archaeological MMORPG adventure begins here
 */

import { GameScene } from './components/GameScene';

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <GameScene />
    </main>
  );
}
