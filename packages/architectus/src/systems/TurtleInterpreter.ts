import * as THREE from 'three';

/**
 * TURTLE INTERPRETER
 *
 * Converts L-system strings into 3D geometry data.
 * Uses quaternion-based orientation (no gimbal lock).
 *
 * From T4 research: Each rotation symbol applies a quaternion multiplication.
 * The turtle walks through the string, generating branch segments and node
 * markers that the renderer converts to instanced meshes.
 */

export interface TurtleState {
  position: THREE.Vector3;
  orientation: THREE.Quaternion;
  radius: number;
  depth: number;
}

export interface BranchSegment {
  /** Start point of the branch segment */
  start: THREE.Vector3;
  /** End point of the branch segment */
  end: THREE.Vector3;
  /** Radius at start */
  startRadius: number;
  /** Radius at end */
  endRadius: number;
  /** Depth in the tree (0 = trunk) */
  depth: number;
  /** Parent segment index (-1 for root) */
  parentIndex: number;
}

export interface NodeMarker {
  /** 3D position of this node */
  position: THREE.Vector3;
  /** File/directory path this node represents */
  path: string;
  /** Whether this node is a file or directory */
  type: 'file' | 'directory';
  /** Depth in the tree */
  depth: number;
  /** Radius of the branch at this point */
  radius: number;
  /** Direction the branch was heading (for orientation) */
  direction: THREE.Vector3;
}

export interface TreeGeometry {
  branches: BranchSegment[];
  nodes: NodeMarker[];
  boundingBox: THREE.Box3;
}

// Reusable temporaries to avoid allocation in hot path
const _forward = new THREE.Vector3();
const _tempQ = new THREE.Quaternion();

// Local-space axes for the turtle frame.
// The turtle's heading (forward) is local +Y, right is local +X, up is local +Z.
// All rotations use orientation.multiply(Qlocal) for proper local-axis rotation.
const _localUp = new THREE.Vector3(0, 0, 1); // Turtle's up axis (yaw axis)
const _localRight = new THREE.Vector3(1, 0, 0); // Turtle's right axis (pitch axis)
const _localFwd = new THREE.Vector3(0, 1, 0); // Turtle's forward axis (roll axis)

export class TurtleInterpreter {
  private defaultAngle: number;

  constructor(defaultAngle = 25) {
    this.defaultAngle = defaultAngle;
  }

  /**
   * Interpret an L-system string and produce 3D geometry data.
   */
  interpret(lSystemString: string, angle?: number): TreeGeometry {
    const deg = angle ?? this.defaultAngle;

    const branches: BranchSegment[] = [];
    const nodes: NodeMarker[] = [];
    const stateStack: TurtleState[] = [];
    const segmentStack: number[] = []; // Track parent segment indices

    let state: TurtleState = {
      position: new THREE.Vector3(0, 0, 0),
      orientation: new THREE.Quaternion(), // Identity — turtle starts pointing up (+Y)
      radius: 0.15,
      depth: 0,
    };

    let currentSegmentIndex = -1;

    let i = 0;
    while (i < lSystemString.length) {
      const char = lSystemString[i];

      switch (char) {
        case 'F': {
          // Move forward, draw segment
          const length = this.readParam(lSystemString, i + 1, 1);
          i = this.skipParam(lSystemString, i + 1);

          const start = state.position.clone();

          // Forward direction from current orientation
          _forward.set(0, 1, 0).applyQuaternion(state.orientation);
          state.position = start.clone().addScaledVector(_forward, length);

          // Taper: child branches slightly thinner
          const endRadius = state.radius * 0.95;

          const segIdx = branches.length;
          branches.push({
            start,
            end: state.position.clone(),
            startRadius: state.radius,
            endRadius,
            depth: state.depth,
            parentIndex: currentSegmentIndex,
          });

          currentSegmentIndex = segIdx;
          state.radius = endRadius;
          break;
        }

        case 'G': {
          // Structural forward — same as F, but not expanded by L-system rules.
          // Used for topology-encoded segments whose parameters must be preserved.
          const gLen = this.readParam(lSystemString, i + 1, 1);
          i = this.skipParam(lSystemString, i + 1);

          const gStart = state.position.clone();
          _forward.set(0, 1, 0).applyQuaternion(state.orientation);
          state.position = gStart.clone().addScaledVector(_forward, gLen);

          const gEndRadius = state.radius * 0.95;
          const gSegIdx = branches.length;
          branches.push({
            start: gStart,
            end: state.position.clone(),
            startRadius: state.radius,
            endRadius: gEndRadius,
            depth: state.depth,
            parentIndex: currentSegmentIndex,
          });

          currentSegmentIndex = gSegIdx;
          state.radius = gEndRadius;
          break;
        }

        case 'f': {
          // Move forward without drawing
          const length = this.readParam(lSystemString, i + 1, 1);
          i = this.skipParam(lSystemString, i + 1);

          _forward.set(0, 1, 0).applyQuaternion(state.orientation);
          state.position.addScaledVector(_forward, length);
          break;
        }

        case '+': {
          // Yaw left — rotate around turtle's local up (Z) axis
          const a = this.readParam(lSystemString, i + 1, deg);
          i = this.skipParam(lSystemString, i + 1);
          _tempQ.setFromAxisAngle(_localUp, (a * Math.PI) / 180);
          state.orientation.multiply(_tempQ);
          break;
        }

        case '-': {
          // Yaw right — rotate around turtle's local up (Z) axis, negative
          const a = this.readParam(lSystemString, i + 1, deg);
          i = this.skipParam(lSystemString, i + 1);
          _tempQ.setFromAxisAngle(_localUp, (-a * Math.PI) / 180);
          state.orientation.multiply(_tempQ);
          break;
        }

        case '^': {
          // Pitch up — rotate around turtle's local right (X) axis
          const a = this.readParam(lSystemString, i + 1, deg);
          i = this.skipParam(lSystemString, i + 1);
          _tempQ.setFromAxisAngle(_localRight, (a * Math.PI) / 180);
          state.orientation.multiply(_tempQ);
          break;
        }

        case '&': {
          // Pitch down — rotate around turtle's local right (X) axis, negative
          const a = this.readParam(lSystemString, i + 1, deg);
          i = this.skipParam(lSystemString, i + 1);
          _tempQ.setFromAxisAngle(_localRight, (-a * Math.PI) / 180);
          state.orientation.multiply(_tempQ);
          break;
        }

        case '/': {
          // Roll — rotate around turtle's local forward (Y) axis
          const a = this.readParam(lSystemString, i + 1, deg);
          i = this.skipParam(lSystemString, i + 1);
          _tempQ.setFromAxisAngle(_localFwd, (a * Math.PI) / 180);
          state.orientation.multiply(_tempQ);
          break;
        }

        case '\\': {
          // Roll reverse — rotate around turtle's local forward (Y) axis, negative
          const a = this.readParam(lSystemString, i + 1, deg);
          i = this.skipParam(lSystemString, i + 1);
          _tempQ.setFromAxisAngle(_localFwd, (-a * Math.PI) / 180);
          state.orientation.multiply(_tempQ);
          break;
        }

        case '[': {
          // Push state
          stateStack.push({
            position: state.position.clone(),
            orientation: state.orientation.clone(),
            radius: state.radius,
            depth: state.depth,
          });
          segmentStack.push(currentSegmentIndex);
          state.depth++;
          break;
        }

        case ']': {
          // Pop state
          const popped = stateStack.pop();
          if (popped) {
            state = popped;
          }
          currentSegmentIndex = segmentStack.pop() ?? -1;
          break;
        }

        case '!': {
          // Set radius
          const r = this.readParam(lSystemString, i + 1, 0.1);
          i = this.skipParam(lSystemString, i + 1);
          state.radius = r;
          break;
        }

        case '@': {
          // Node marker with type:path  (e.g. @(d:src/components) or @(f:src/App.tsx))
          const raw = this.readStringParam(lSystemString, i + 1);
          i = this.skipParam(lSystemString, i + 1);

          let nodeType: 'file' | 'directory' = 'file';
          let nodePath = raw;
          if (raw.length > 2 && raw[1] === ':') {
            nodeType = raw[0] === 'd' ? 'directory' : 'file';
            nodePath = raw.slice(2);
          }

          const dir = _forward.set(0, 1, 0).applyQuaternion(state.orientation).clone();

          nodes.push({
            position: state.position.clone(),
            path: nodePath,
            type: nodeType,
            depth: state.depth,
            radius: state.radius,
            direction: dir,
          });
          break;
        }

        default:
          // Unknown symbol, skip
          break;
      }

      i++;
    }

    // Compute bounding box
    const boundingBox = new THREE.Box3();
    for (const branch of branches) {
      boundingBox.expandByPoint(branch.start);
      boundingBox.expandByPoint(branch.end);
    }
    for (const node of nodes) {
      boundingBox.expandByPoint(node.position);
    }

    return { branches, nodes, boundingBox };
  }

  /**
   * Read a numeric parameter from parentheses: (value)
   * Returns defaultVal if no parameter found.
   */
  private readParam(str: string, idx: number, defaultVal: number): number {
    if (idx >= str.length || str[idx] !== '(') return defaultVal;
    const closeIdx = str.indexOf(')', idx);
    if (closeIdx === -1) return defaultVal;
    const val = parseFloat(str.slice(idx + 1, closeIdx));
    return Number.isNaN(val) ? defaultVal : val;
  }

  /**
   * Read a string parameter from parentheses: (value)
   */
  private readStringParam(str: string, idx: number): string {
    if (idx >= str.length || str[idx] !== '(') return '';
    const closeIdx = str.indexOf(')', idx);
    if (closeIdx === -1) return '';
    return str.slice(idx + 1, closeIdx);
  }

  /**
   * Skip past a parameter block if present.
   * Returns the index of the character BEFORE the closing paren
   * (the main loop will increment past it).
   */
  private skipParam(str: string, idx: number): number {
    if (idx >= str.length || str[idx] !== '(') return idx - 1;
    const closeIdx = str.indexOf(')', idx);
    return closeIdx === -1 ? idx - 1 : closeIdx;
  }
}
