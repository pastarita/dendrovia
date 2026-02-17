'use client';

/**
 * GameScene - The main 3D world
 * Client component that renders the R3F canvas
 */

import { CameraController, MurrayTree, Stage, Terrain } from '@dendrovia/engine';

export function GameScene() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* HUD Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 100,
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '12px',
          borderRadius: '4px',
        }}
      >
        <div style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold' }}>
          🌳 DENDROVIA - ARCHAEOLOGIZATION
        </div>
        <div>ARCHITECTUS Checkout Active</div>
        <div style={{ marginTop: '8px', opacity: 0.7 }}>Controls: WASD = Move | Q/E = Rotate | R/F = Zoom</div>
      </div>

      {/* 3D Scene */}
      <Stage cameraPosition={[50, 50, 50]}>
        <CameraController />

        {/* Ground */}
        <Terrain size={500} />

        {/* Sample Trees - Later driven by code structure */}
        <MurrayTree position={[0, 5, 0]} height={15} />
        <MurrayTree position={[20, 5, -20]} height={12} />
        <MurrayTree position={[-30, 5, 10]} height={18} />
        <MurrayTree position={[15, 5, 25]} height={10} />

        {/* Origin marker */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
      </Stage>
    </div>
  );
}
