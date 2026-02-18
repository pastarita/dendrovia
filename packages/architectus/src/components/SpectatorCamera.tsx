import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useRendererStore } from '../store/useRendererStore';
import { useCameraEditorStore } from '../store/useCameraEditorStore';
import { falconOrbitPosition, falconPathPoints } from '../systems/NestConfig';
import type { NestConfig } from '../systems/NestConfig';
import type { PlatformConfig } from '../systems/PlatformConfig';
import type { EditableMarkerKey } from '../systems/CameraParams';

/**
 * SPECTATOR CAMERA (Free Orbit + Interactive Camera Visualization)
 *
 * Activated via Shift-V. Provides an unlocked OrbitControls camera that
 * lets you see the entire scene from any angle.
 *
 * Camera markers are now **interactive**:
 *   - Click a marker to select it (activates TransformControls gizmo)
 *   - Drag position/target to adjust camera state
 *   - Click empty space to deselect
 *   - Falcon marker animation pauses when selected for editing
 *   - Look-at lines render live during drag
 *
 * Markers:
 *   - Falcon camera position (cyan cone, animated along orbit path)
 *   - Player-1P camera position (green cone, at nest/spawn point)
 *   - Player-3P camera position (yellow cone, offset behind player)
 *   - Draggable target spheres (smaller, same color)
 */

// Small reusable cone geometry for camera markers
const CAMERA_CONE_ARGS: [number, number, number, number] = [0.3, 0, 0.8, 6];
const FRUSTUM_CONE_ARGS: [number, number, number, number] = [0.5, 1.2, 4, 4];
const TARGET_SPHERE_ARGS: [number, number, number] = [0.2, 10, 8];

const MARKER_COLORS: Record<EditableMarkerKey, string> = {
  falcon: '#00ffff',
  'player-1p': '#22c55e',
  'player-3p': '#eab308',
};

const SELECTED_EMISSIVE = 0.4;

// Module-scope temps
const _pos = new THREE.Vector3();
const _target = new THREE.Vector3();

/**
 * Editable camera marker — click to select, shows TransformControls when active.
 */
function EditableCameraMarker({
  markerKey,
  color,
  orbitControlsRef,
}: {
  markerKey: EditableMarkerKey;
  color: string;
  orbitControlsRef: React.RefObject<any>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const editingMarker = useCameraEditorStore((s) => s.editingMarker);
  const isSelected = editingMarker === markerKey;
  const markerState = useCameraEditorStore((s) => s.markerStates[markerKey]);

  // Update group position and orientation from store
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(...markerState.position);
    _target.set(...markerState.target);
    groupRef.current.lookAt(_target);
  }, [markerState.position, markerState.target]);

  const handleClick = useCallback((e: THREE.Event) => {
    e.stopPropagation();
    const store = useCameraEditorStore.getState();
    if (store.editingMarker === markerKey) {
      store.setEditingMarker(null);
    } else {
      store.setEditingMarker(markerKey);
    }
  }, [markerKey]);

  // When TransformControls is dragging, disable OrbitControls
  const handleDraggingChanged = useCallback((e: { value: boolean }) => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = !e.value;
    }
  }, [orbitControlsRef]);

  // Update store when gizmo moves this marker
  const handleObjectChange = useCallback(() => {
    if (!groupRef.current) return;
    const p = groupRef.current.position;
    useCameraEditorStore.getState().updateMarkerPosition(markerKey, [p.x, p.y, p.z]);
  }, [markerKey]);

  return (
    <>
      <group
        ref={groupRef}
        name={`editable-marker-${markerKey}`}
        onClick={handleClick}
      >
        {/* Solid cone */}
        <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={CAMERA_CONE_ARGS} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={isSelected ? 1.0 : 0.85}
            emissive={color}
            emissiveIntensity={isSelected ? SELECTED_EMISSIVE : 0}
          />
        </mesh>
        {/* Wireframe frustum outline */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={FRUSTUM_CONE_ARGS} />
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={isSelected ? 0.7 : 0.4}
          />
        </mesh>
      </group>

      {/* TransformControls only shown for selected marker */}
      {isSelected && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode="translate"
          size={0.6}
          onMouseDown={() => {
            if (orbitControlsRef.current) orbitControlsRef.current.enabled = false;
          }}
          onMouseUp={() => {
            if (orbitControlsRef.current) orbitControlsRef.current.enabled = true;
          }}
          onChange={handleObjectChange}
        />
      )}
    </>
  );
}

/**
 * Draggable target sphere — drag to re-orient the camera's look direction.
 */
function EditableTargetSphere({
  markerKey,
  color,
  orbitControlsRef,
}: {
  markerKey: EditableMarkerKey;
  color: string;
  orbitControlsRef: React.RefObject<any>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const editingMarker = useCameraEditorStore((s) => s.editingMarker);
  const isSelected = editingMarker === markerKey;
  const markerState = useCameraEditorStore((s) => s.markerStates[markerKey]);

  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(...markerState.target);
  }, [markerState.target]);

  const handleClick = useCallback((e: THREE.Event) => {
    e.stopPropagation();
    useCameraEditorStore.getState().setEditingMarker(markerKey);
  }, [markerKey]);

  const handleObjectChange = useCallback(() => {
    if (!meshRef.current) return;
    const p = meshRef.current.position;
    useCameraEditorStore.getState().updateMarkerTarget(markerKey, [p.x, p.y, p.z]);
  }, [markerKey]);

  return (
    <>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        name={`target-sphere-${markerKey}`}
      >
        <sphereGeometry args={TARGET_SPHERE_ARGS} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.9 : 0.5}
          emissive={color}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>

      {isSelected && meshRef.current && (
        <TransformControls
          object={meshRef.current}
          mode="translate"
          size={0.4}
          onMouseDown={() => {
            if (orbitControlsRef.current) orbitControlsRef.current.enabled = false;
          }}
          onMouseUp={() => {
            if (orbitControlsRef.current) orbitControlsRef.current.enabled = true;
          }}
          onChange={handleObjectChange}
        />
      )}
    </>
  );
}

/**
 * Renders a line connecting a camera position to its look target.
 * Updates reactively when marker positions change in the store.
 */
function LiveLookAtLine({
  markerKey,
  color,
}: {
  markerKey: EditableMarkerKey;
  color: string;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const markerState = useCameraEditorStore((s) => s.markerStates[markerKey]);

  const geo = useMemo(() => {
    const from = new THREE.Vector3(...markerState.position);
    const to = new THREE.Vector3(...markerState.target);
    return new THREE.BufferGeometry().setFromPoints([from, to]);
  }, [markerState.position, markerState.target]);

  return (
    <line ref={lineRef as any}>
      <primitive object={geo} attach="geometry" />
      <lineBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
    </line>
  );
}

interface SpectatorCameraProps {
  nestConfig: NestConfig | null;
  platformConfig: PlatformConfig | null;
  /** Where the camera was when spectator mode was entered */
  savedPosition: THREE.Vector3;
}

export function SpectatorCamera({ nestConfig, platformConfig, savedPosition }: SpectatorCameraProps) {
  const { camera } = useThree();
  const falconMarkerRef = useRef<THREE.Group>(null);
  const orbitControlsRef = useRef<any>(null);
  const startTime = useRef(0);

  const editingMarker = useCameraEditorStore((s) => s.editingMarker);
  const isFalconEditing = editingMarker === 'falcon';

  // On mount, position camera at a good spectator vantage point
  useEffect(() => {
    // Start from a pulled-back version of the saved position
    const dist = savedPosition.length();
    const spectatorDist = Math.max(dist * 1.5, 30);
    const dir = savedPosition.clone().normalize();
    camera.position.copy(dir.multiplyScalar(spectatorDist));
    camera.position.y = Math.max(camera.position.y, 20);
    startTime.current = 0;
  }, [camera, savedPosition]);

  // Deselect marker when clicking empty space
  const handlePointerMissed = useCallback(() => {
    useCameraEditorStore.getState().setEditingMarker(null);
  }, []);

  // Animate falcon camera marker along orbit path (pauses when editing)
  useFrame((state) => {
    if (!nestConfig || !platformConfig || !falconMarkerRef.current) return;
    if (isFalconEditing) return; // Pause animation while editing falcon marker

    startTime.current += state.clock.getDelta();
    const { position, target } = falconOrbitPosition(
      startTime.current % (62.83 + 4), // loop through full orbit + approach
      nestConfig,
      platformConfig,
    );

    // Update group position
    falconMarkerRef.current.position.copy(position);
    falconMarkerRef.current.lookAt(target);

    // Sync to store (so inspector shows live position)
    const p = position;
    const t = target;
    useCameraEditorStore.getState().updateMarkerPosition('falcon', [p.x, p.y, p.z]);
    useCameraEditorStore.getState().updateMarkerTarget('falcon', [t.x, t.y, t.z]);
  });

  // Falcon orbit + approach path lines
  const pathLines = useMemo(() => {
    if (!nestConfig || !platformConfig) return null;
    const points = falconPathPoints(nestConfig, platformConfig, 64);
    if (points.length === 0) return null;

    const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    return new THREE.Line(orbitGeo, orbitMat);
  }, [nestConfig, platformConfig]);

  return (
    <>
      {/* Free orbit camera controls */}
      <OrbitControls
        ref={orbitControlsRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={200}
        target={nestConfig?.nestPosition ?? new THREE.Vector3(0, 3, 0)}
      />

      <group name="spectator-viz" onPointerMissed={handlePointerMissed}>
        {/* Falcon orbit path */}
        {pathLines && <primitive object={pathLines} />}

        {/* Animated falcon camera marker (still uses ref for animation, but editable) */}
        {nestConfig && platformConfig && (
          <>
            {isFalconEditing ? (
              /* When editing, use the editable marker system */
              <EditableCameraMarker
                markerKey="falcon"
                color={MARKER_COLORS.falcon}
                orbitControlsRef={orbitControlsRef}
              />
            ) : (
              /* When not editing, use the animated ref-based marker */
              <group
                ref={falconMarkerRef}
                name="falcon-camera-marker"
                onClick={(e) => {
                  e.stopPropagation();
                  useCameraEditorStore.getState().setEditingMarker('falcon');
                }}
              >
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <coneGeometry args={CAMERA_CONE_ARGS} />
                  <meshBasicMaterial color="#00ffff" transparent opacity={0.85} />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <coneGeometry args={FRUSTUM_CONE_ARGS} />
                  <meshBasicMaterial color="#00ffff" wireframe transparent opacity={0.4} />
                </mesh>
              </group>
            )}
            <EditableTargetSphere
              markerKey="falcon"
              color={MARKER_COLORS.falcon}
              orbitControlsRef={orbitControlsRef}
            />
            <LiveLookAtLine markerKey="falcon" color={MARKER_COLORS.falcon} />
          </>
        )}

        {/* Player-1P marker */}
        {nestConfig && (
          <>
            <EditableCameraMarker
              markerKey="player-1p"
              color={MARKER_COLORS['player-1p']}
              orbitControlsRef={orbitControlsRef}
            />
            <EditableTargetSphere
              markerKey="player-1p"
              color={MARKER_COLORS['player-1p']}
              orbitControlsRef={orbitControlsRef}
            />
            <LiveLookAtLine markerKey="player-1p" color={MARKER_COLORS['player-1p']} />
          </>
        )}

        {/* Player-3P marker */}
        {nestConfig && (
          <>
            <EditableCameraMarker
              markerKey="player-3p"
              color={MARKER_COLORS['player-3p']}
              orbitControlsRef={orbitControlsRef}
            />
            <EditableTargetSphere
              markerKey="player-3p"
              color={MARKER_COLORS['player-3p']}
              orbitControlsRef={orbitControlsRef}
            />
            <LiveLookAtLine markerKey="player-3p" color={MARKER_COLORS['player-3p']} />
          </>
        )}

        {/* Nest center marker (reference point) */}
        {nestConfig && (
          <mesh position={nestConfig.nestPosition}>
            <octahedronGeometry args={[0.25, 0]} />
            <meshBasicMaterial color="#a855f7" wireframe />
          </mesh>
        )}

        {/* View radii wireframe spheres */}
        {nestConfig && (
          <>
            {/* Near view hemisphere */}
            <mesh position={nestConfig.nestPosition}>
              <sphereGeometry args={[nestConfig.viewNearRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshBasicMaterial color="#22c55e" wireframe transparent opacity={0.15} />
            </mesh>
            {/* Far view hemisphere */}
            <mesh position={nestConfig.nestPosition}>
              <sphereGeometry args={[nestConfig.viewFarRadius, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.1} />
            </mesh>
          </>
        )}
      </group>
    </>
  );
}
