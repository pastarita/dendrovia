/**
 * Lighting - Scene Illumination
 * Light quality and color can be driven by codebase health metrics
 */

export function Lighting() {
  return (
    <>
      {/* Ambient base light */}
      <ambientLight intensity={0.3} />

      {/* Main directional light (sun) */}
      <directionalLight
        position={[50, 100, 50]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      {/* Fill light for softer shadows */}
      <directionalLight
        position={[-30, 50, -30]}
        intensity={0.3}
      />

      {/* Magical accent light (for special areas) */}
      <pointLight
        position={[0, 20, 0]}
        intensity={0.5}
        color="#9d4edd"
        distance={100}
      />
    </>
  );
}
