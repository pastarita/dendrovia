/**
 * EngineView — Full 3D spatial editor view.
 * Wraps R3F Canvas with HUD overlay and scene composition.
 */

import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { HUDOverlay } from "./HUDOverlay";

export interface EngineViewProps {
  repoUrl: string;
  onBack: () => void;
}

export const EngineView: React.FC<EngineViewProps> = ({ repoUrl, onBack }) => {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: [0, 5, 10], fov: 60 }}
        style={{ background: "#0a0806" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <OrbitControls />
        {/* Scene content will be composed here in Phase 1+ */}
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#c77b3f" />
        </mesh>
        <gridHelper args={[20, 20, "#333", "#222"]} />
      </Canvas>
      <HUDOverlay repoUrl={repoUrl} onBack={onBack} />
    </div>
  );
};
