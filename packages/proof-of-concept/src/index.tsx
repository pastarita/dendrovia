/**
 * PROOF OF CONCEPT: 3D Viewer
 *
 * This demonstrates ARCHITECTUS (rendering) + LUDUS (interaction) + OCULUS (UI)
 */

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { CodeOverlay } from './components/CodeOverlay';
import { DendriteBranch } from './components/DendriteBranch';
import { HUD } from './components/HUD';
import './index.css';

function App() {
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [showCode, setShowCode] = React.useState(false);

  const handleBranchClick = () => {
    setSelectedFile('package.json');
    setShowCode(true);
  };

  return (
    <div className="app">
      {/* ARCHITECTUS: 3D World */}
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 1, -3]} />
        <OrbitControls enableDamping dampingFactor={0.05} />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, -5]} intensity={0.7} />

        {/* The Dendrite (SDF Branch) */}
        <DendriteBranch onClick={handleBranchClick} />

        {/* Grid reference */}
        <gridHelper args={[10, 10]} />
      </Canvas>

      {/* OCULUS: UI Overlay */}
      <HUD />

      {showCode && selectedFile && <CodeOverlay filePath={selectedFile} onClose={() => setShowCode(false)} />}

      {/* Instructions */}
      <div className="instructions">
        <h2>Proof of Concept: Thin Vertical Slice</h2>
        <p>Click the branch to view the file contents</p>
        <p>Use mouse to orbit the camera</p>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
