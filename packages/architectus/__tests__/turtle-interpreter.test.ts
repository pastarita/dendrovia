import { describe, test, expect, beforeEach } from 'bun:test';
import { TurtleInterpreter } from '../src/systems/TurtleInterpreter';
import type { TreeGeometry } from '../src/systems/TurtleInterpreter';

let turtle: TurtleInterpreter;

beforeEach(() => {
  turtle = new TurtleInterpreter(25);
});

// ---------------------------------------------------------------------------
// Basic interpretation
// ---------------------------------------------------------------------------

describe('interpret() basics', () => {
  test('empty string produces no branches or nodes', () => {
    const result = turtle.interpret('');
    expect(result.branches).toHaveLength(0);
    expect(result.nodes).toHaveLength(0);
  });

  test('single F produces one branch segment', () => {
    const result = turtle.interpret('F');
    expect(result.branches).toHaveLength(1);
  });

  test('single G produces one branch segment', () => {
    const result = turtle.interpret('G');
    expect(result.branches).toHaveLength(1);
  });

  test('F default length is 1', () => {
    const result = turtle.interpret('F');
    const seg = result.branches[0];
    // Start at origin, forward along +Y by default length 1
    expect(seg.start.x).toBeCloseTo(0);
    expect(seg.start.y).toBeCloseTo(0);
    expect(seg.start.z).toBeCloseTo(0);
    expect(seg.end.y).toBeCloseTo(1, 3);
  });

  test('F with parameter uses specified length', () => {
    const result = turtle.interpret('F(3.5)');
    const seg = result.branches[0];
    expect(result.branches).toHaveLength(1);
    expect(seg.end.y).toBeCloseTo(3.5, 3);
  });

  test('consecutive F segments chain end-to-start', () => {
    const result = turtle.interpret('FF');
    expect(result.branches).toHaveLength(2);
    const [a, b] = result.branches;
    expect(a.end.x).toBeCloseTo(b.start.x, 5);
    expect(a.end.y).toBeCloseTo(b.start.y, 5);
    expect(a.end.z).toBeCloseTo(b.start.z, 5);
  });

  test('f (lowercase) moves forward without drawing', () => {
    const result = turtle.interpret('f(2)F');
    // Only F draws, so one branch
    expect(result.branches).toHaveLength(1);
    // The branch should start at y=2 (after the invisible move)
    expect(result.branches[0].start.y).toBeCloseTo(2, 3);
  });
});

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------

describe('radius handling', () => {
  test('default radius is 0.15', () => {
    const result = turtle.interpret('F');
    expect(result.branches[0].startRadius).toBeCloseTo(0.15, 5);
  });

  test('! sets radius for subsequent segments', () => {
    const result = turtle.interpret('!(0.5)F');
    expect(result.branches[0].startRadius).toBeCloseTo(0.5, 5);
  });

  test('end radius tapers to 95% of start', () => {
    const result = turtle.interpret('!(1.0)F');
    const seg = result.branches[0];
    expect(seg.endRadius).toBeCloseTo(0.95, 5);
  });

  test('radius propagates: sequential segments taper cumulatively', () => {
    const result = turtle.interpret('!(1.0)FFF');
    const radii = result.branches.map((b) => b.startRadius);
    // Each subsequent segment should be thinner
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]).toBeLessThan(radii[i - 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// Rotation (quaternion-based)
// ---------------------------------------------------------------------------

describe('rotation commands', () => {
  test('+ (yaw left) changes direction of next segment', () => {
    // Without rotation
    const straight = turtle.interpret('F(1)F(1)');
    // With 90-degree yaw
    const turned = turtle.interpret('F(1)+(90)F(1)');

    // Second segment end positions should differ
    const straightEnd = straight.branches[1].end;
    const turnedEnd = turned.branches[1].end;
    expect(
      Math.abs(straightEnd.x - turnedEnd.x) +
        Math.abs(straightEnd.y - turnedEnd.y) +
        Math.abs(straightEnd.z - turnedEnd.z),
    ).toBeGreaterThan(0.01);
  });

  test('- (yaw right) is opposite to +', () => {
    const left = turtle.interpret('+(45)F');
    const right = turtle.interpret('-(45)F');
    // They should produce mirrored x coordinates
    expect(left.branches[0].end.x).toBeCloseTo(-right.branches[0].end.x, 3);
  });

  test('^ (pitch up) rotates around local right axis', () => {
    const result = turtle.interpret('^(90)F(1)');
    // After 90-degree pitch up, forward becomes local +Z direction
    // The turtle's local up (Z) and forward (Y) are the relevant axes
    // After pitch up 90 degrees around local X, forward Y rotates toward Z
    const seg = result.branches[0];
    expect(seg.end.y).toBeCloseTo(0, 2);
  });

  test('& (pitch down) is opposite to ^', () => {
    const up = turtle.interpret('^(30)F');
    const down = turtle.interpret('&(30)F');
    // z component should be opposite
    expect(up.branches[0].end.z).toBeCloseTo(-down.branches[0].end.z, 3);
  });

  test('quaternion orientation: no gimbal lock at 90-degree rotations', () => {
    // Classic gimbal lock scenario: pitch 90 then yaw should still work
    const result = turtle.interpret('^(90)+(45)F(1)');
    const seg = result.branches[0];
    // Should have non-trivial position (not collapsed to an axis)
    const dist = Math.sqrt(seg.end.x ** 2 + seg.end.y ** 2 + seg.end.z ** 2);
    expect(dist).toBeCloseTo(1, 2);
  });

  test('/ (roll) rotates around forward axis', () => {
    // Roll then yaw should produce different result than just yaw
    const noRoll = turtle.interpret('+(45)F(1)');
    const withRoll = turtle.interpret('/(90)+(45)F(1)');

    const a = noRoll.branches[0].end;
    const b = withRoll.branches[0].end;
    // Positions should differ because roll changes the yaw plane
    const diff = Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
    expect(diff).toBeGreaterThan(0.01);
  });

  test('default angle used when no parameter given', () => {
    const t = new TurtleInterpreter(45);
    const withDefault = t.interpret('+F(1)');
    // Compare against explicit 45
    const withExplicit = t.interpret('+(45)F(1)');

    expect(withDefault.branches[0].end.x).toBeCloseTo(
      withExplicit.branches[0].end.x,
      5,
    );
    expect(withDefault.branches[0].end.y).toBeCloseTo(
      withExplicit.branches[0].end.y,
      5,
    );
  });
});

// ---------------------------------------------------------------------------
// Stack push/pop (branching)
// ---------------------------------------------------------------------------

describe('stack push/pop', () => {
  test('[ and ] restore position after branch', () => {
    const result = turtle.interpret('F(2)[+(90)F(1)]F(1)');
    // Branch 0: trunk from 0 to 2
    // Branch 1: side branch from (0,2,0) turned 90
    // Branch 2: continues from (0,2,0) upward to (0,3,0) after pop
    expect(result.branches).toHaveLength(3);
    expect(result.branches[2].start.y).toBeCloseTo(2, 3);
    expect(result.branches[2].end.y).toBeCloseTo(3, 3);
  });

  test('depth increments on push and decrements on pop', () => {
    const result = turtle.interpret('F[F[F]]');
    // Depths: branch0 = 0, branch1 = 1, branch2 = 2
    expect(result.branches[0].depth).toBe(0);
    expect(result.branches[1].depth).toBe(1);
    expect(result.branches[2].depth).toBe(2);
  });

  test('parent index tracks segment hierarchy', () => {
    const result = turtle.interpret('F[F]');
    expect(result.branches[0].parentIndex).toBe(-1); // root
    expect(result.branches[1].parentIndex).toBe(0); // child of first
  });

  test('nested branches restore state correctly', () => {
    const result = turtle.interpret('F(3)[+(45)F(1)][-(45)F(1)]F(1)');
    // After two branches, the final F should continue from y=3
    const lastBranch = result.branches[result.branches.length - 1];
    expect(lastBranch.start.y).toBeCloseTo(3, 3);
    expect(lastBranch.end.y).toBeCloseTo(4, 3);
  });
});

// ---------------------------------------------------------------------------
// Node markers
// ---------------------------------------------------------------------------

describe('node markers (@)', () => {
  test('@ with file prefix creates file node', () => {
    const result = turtle.interpret('@(f:src/App.tsx)');
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].type).toBe('file');
    expect(result.nodes[0].path).toBe('src/App.tsx');
  });

  test('@ with directory prefix creates directory node', () => {
    const result = turtle.interpret('@(d:src/components)');
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].type).toBe('directory');
    expect(result.nodes[0].path).toBe('src/components');
  });

  test('node marker position matches turtle position', () => {
    const result = turtle.interpret('F(5)@(f:tip)');
    expect(result.nodes[0].position.y).toBeCloseTo(5, 3);
  });

  test('node marker records current radius', () => {
    const result = turtle.interpret('!(0.75)@(f:test)');
    expect(result.nodes[0].radius).toBeCloseTo(0.75, 5);
  });

  test('node marker records depth', () => {
    const result = turtle.interpret('[[@(f:deep)]]');
    expect(result.nodes[0].depth).toBe(2);
  });

  test('node direction is the turtle forward direction', () => {
    const result = turtle.interpret('@(f:origin)');
    // Default forward is +Y
    expect(result.nodes[0].direction.y).toBeCloseTo(1, 5);
    expect(result.nodes[0].direction.x).toBeCloseTo(0, 5);
  });
});

// ---------------------------------------------------------------------------
// Bounding box
// ---------------------------------------------------------------------------

describe('bounding box', () => {
  test('bounding box encompasses all branch endpoints', () => {
    const result = turtle.interpret('F(5)[+(90)F(3)]');
    const bb = result.boundingBox;

    for (const branch of result.branches) {
      expect(bb.containsPoint(branch.start)).toBe(true);
      expect(bb.containsPoint(branch.end)).toBe(true);
    }
  });

  test('bounding box encompasses all node markers', () => {
    const result = turtle.interpret('F(3)@(f:tip)[+(90)F(2)@(f:side)]');
    const bb = result.boundingBox;

    for (const node of result.nodes) {
      expect(bb.containsPoint(node.position)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Integration with LSystem output
// ---------------------------------------------------------------------------

describe('integration: LSystem string interpretation', () => {
  test('typical LSystem output with G, !, +, [, ] produces valid geometry', () => {
    const lsStr =
      '!(0.300)G(3.00)[/(0.0)+(50.0)!(0.120)G(2.50)@(f:src/a.ts)!(0.060)G][/(180.0)+(45.0)!(0.120)G(1.80)@(f:src/b.ts)!(0.060)G]';
    const result = turtle.interpret(lsStr);

    expect(result.branches.length).toBeGreaterThanOrEqual(3);
    expect(result.nodes.length).toBe(2);
    expect(result.nodes.map((n) => n.path)).toContain('src/a.ts');
    expect(result.nodes.map((n) => n.path)).toContain('src/b.ts');
  });
});
