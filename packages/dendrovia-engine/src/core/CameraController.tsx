/**
 * CameraController - Falcon Mode vs Player Mode camera system
 * Falcon: Bird's eye view for codebase exploration
 * Player: Third-person view for character control
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { useGameLoop } from './GameLoop';
import { useInput } from './InputManager';

interface CameraControllerProps {
  target?: Vector3;
  distance?: number;
  sensitivity?: number;
}

export function CameraController({
  target = new Vector3(0, 0, 0),
  distance = 50,
  sensitivity = 0.005,
}: CameraControllerProps) {
  const { camera } = useThree();
  const mode = useGameLoop((state) => state.mode);
  const keys = useInput((state) => state.keys);

  const pitchRef = useRef(-Math.PI / 6); // Looking down initially
  const yawRef = useRef(0);
  const targetRef = useRef(target.clone());
  const distanceRef = useRef(distance);

  // Keyboard input for camera movement
  useFrame((_state, delta) => {
    const moveSpeed = mode === 'falcon' ? 30 : 10;
    const rotateSpeed = 2;

    // WASD movement
    if (keys.has('w')) targetRef.current.z -= moveSpeed * delta;
    if (keys.has('s')) targetRef.current.z += moveSpeed * delta;
    if (keys.has('a')) targetRef.current.x -= moveSpeed * delta;
    if (keys.has('d')) targetRef.current.x += moveSpeed * delta;

    // Q/E for rotation
    if (keys.has('q')) yawRef.current += rotateSpeed * delta;
    if (keys.has('e')) yawRef.current -= rotateSpeed * delta;

    // R/F for zoom
    if (keys.has('r')) distanceRef.current = Math.max(10, distanceRef.current - 20 * delta);
    if (keys.has('f')) distanceRef.current = Math.min(200, distanceRef.current + 20 * delta);

    // Calculate camera position based on pitch, yaw, and distance
    const pitch = pitchRef.current;
    const yaw = yawRef.current;
    const dist = distanceRef.current;

    const offsetX = dist * Math.cos(pitch) * Math.sin(yaw);
    const offsetY = dist * Math.sin(pitch);
    const offsetZ = dist * Math.cos(pitch) * Math.cos(yaw);

    camera.position.set(targetRef.current.x + offsetX, targetRef.current.y + offsetY, targetRef.current.z + offsetZ);

    camera.lookAt(targetRef.current);
  });

  // Setup keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      useInput.getState().pressKey(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      useInput.getState().releaseKey(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return null;
}
