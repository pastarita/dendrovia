/**
 * TurtleInterpreter — 3D L-system string execution.
 *
 * Interprets an expanded L-system string into 3D line segments
 * suitable for SDF capsule generation.
 *
 * Symbols:
 *   F = move forward and create a segment
 *   + = yaw right, - = yaw left
 *   & = pitch down, ^ = pitch up
 *   [ = push state, ] = pop state
 *   H = hotspot segment (thicker + twist flag)
 */

export interface TurtleSegment {
  start: [number, number, number];
  end: [number, number, number];
  radius: number;
  depth: number;
  isHotspot: boolean;
}

interface TurtleState {
  position: [number, number, number];
  heading: [number, number, number];  // Forward direction
  up: [number, number, number];       // Up direction
  right: [number, number, number];    // Right direction
  depth: number;
}

function vec3Add(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function vec3Scale(v: [number, number, number], s: number): [number, number, number] {
  return [v[0] * s, v[1] * s, v[2] * s];
}

function rotateAroundAxis(
  v: [number, number, number],
  axis: [number, number, number],
  angleDeg: number,
): [number, number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const [x, y, z] = v;
  const [ax, ay, az] = axis;
  const dot = x * ax + y * ay + z * az;
  // Rodrigues' rotation formula
  return [
    x * c + (ay * z - az * y) * s + ax * dot * (1 - c),
    y * c + (az * x - ax * z) * s + ay * dot * (1 - c),
    z * c + (ax * y - ay * x) * s + az * dot * (1 - c),
  ];
}

const TAPER_FACTOR = 0.7;
const BASE_RADIUS = 0.25;

export function interpret(
  expanded: string,
  angle: number,
  segmentLength: number = 1.0,
): TurtleSegment[] {
  const segments: TurtleSegment[] = [];
  const stack: TurtleState[] = [];

  let state: TurtleState = {
    position: [0, 0, 0],
    heading: [0, 1, 0],   // Start pointing up
    up: [0, 0, -1],
    right: [1, 0, 0],
    depth: 0,
  };

  for (const ch of expanded) {
    switch (ch) {
      case 'F':
      case 'H': {
        const start: [number, number, number] = [...state.position];
        const step = vec3Scale(state.heading, segmentLength);
        state.position = vec3Add(state.position, step);
        const radius = BASE_RADIUS * Math.pow(TAPER_FACTOR, state.depth);

        segments.push({
          start,
          end: [...state.position],
          radius,
          depth: state.depth,
          isHotspot: ch === 'H',
        });
        break;
      }

      case '+': // Yaw right
        state.heading = rotateAroundAxis(state.heading, state.up, angle);
        state.right = rotateAroundAxis(state.right, state.up, angle);
        break;

      case '-': // Yaw left
        state.heading = rotateAroundAxis(state.heading, state.up, -angle);
        state.right = rotateAroundAxis(state.right, state.up, -angle);
        break;

      case '&': // Pitch down
        state.heading = rotateAroundAxis(state.heading, state.right, angle);
        state.up = rotateAroundAxis(state.up, state.right, angle);
        break;

      case '^': // Pitch up
        state.heading = rotateAroundAxis(state.heading, state.right, -angle);
        state.up = rotateAroundAxis(state.up, state.right, -angle);
        break;

      case '[': // Push state
        stack.push({
          position: [...state.position],
          heading: [...state.heading],
          up: [...state.up],
          right: [...state.right],
          depth: state.depth,
        });
        state.depth++;
        break;

      case ']': // Pop state
        if (stack.length > 0) {
          state = stack.pop()!;
        }
        break;
    }
  }

  return segments;
}
