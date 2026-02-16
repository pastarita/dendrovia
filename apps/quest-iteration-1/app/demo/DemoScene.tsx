'use client';

/**
 * DemoScene — Full 3D Dendrovia experience
 *
 * R3F canvas with dendrite branches, OCULUS-style HUD, and code reader.
 * Adapted from packages/proof-of-concept for Next.js + R3F v9.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { Mesh } from 'three';
import './demo.css';

// ── File nodes representing the Dendrovia codebase ──────────
interface FileNode {
  id: string;
  name: string;
  language: string;
  color: string;
  position: [number, number, number];
  height: number;
  radius: number;
  branches: number;
  snippet: string;
}

const FILE_NODES: FileNode[] = [
  {
    id: 'chronos',
    name: 'packages/chronos/src/parser/GitParser.ts',
    language: 'TypeScript',
    color: '#c77b3f',
    position: [0, 0, 0],
    height: 2.8,
    radius: 0.12,
    branches: 7,
    snippet: `export class GitParser {\n  private repo: string;\n\n  async parseHistory(): Promise<Topology> {\n    const commits = await this.getCommits();\n    const files = await this.getFileTree();\n    const hotspots = this.detectHotspots(commits);\n    return { commits, files, hotspots };\n  }\n\n  private detectHotspots(commits: Commit[]): Hotspot[] {\n    // Temporal coupling analysis\n    return commits\n      .flatMap(c => c.files)\n      .reduce(this.correlate, []);\n  }\n}`,
  },
  {
    id: 'imaginarium',
    name: 'packages/imaginarium/src/distillation/SDFCompiler.ts',
    language: 'TypeScript',
    color: '#A855F7',
    position: [-2.2, 0, 1.5],
    height: 2.2,
    radius: 0.1,
    branches: 5,
    snippet: `export class SDFCompiler {\n  compile(topology: Topology): SDFShader {\n    const branches = this.toBranchSDF(topology);\n    const palette = this.extractPalette(topology);\n    return {\n      glsl: this.assembleGLSL(branches),\n      parameters: {\n        time: 0,\n        color: palette.primary,\n      },\n    };\n  }\n\n  private toBranchSDF(t: Topology): string {\n    // Murray's Law compliant branching\n    return t.files.map(f => \n      \`sdBranch(p, \${f.complexity})\`\n    ).join(' + ');\n  }\n}`,
  },
  {
    id: 'architectus',
    name: 'packages/dendrovia-engine/src/canvas/Stage.tsx',
    language: 'TSX',
    color: '#3B82F6',
    position: [2.2, 0, 1.5],
    height: 2.5,
    radius: 0.11,
    branches: 6,
    snippet: `export function Stage({ children }: StageProps) {\n  const quality = useRendererStore(s => s.quality);\n\n  return (\n    <Canvas\n      gl={{ antialias: quality !== 'potato' }}\n      camera={{ position: [0, 5, 10], fov: 60 }}\n    >\n      <Lighting quality={quality} />\n      <Skybox />\n      <Terrain />\n      <CameraController />\n      {children}\n      <Effects quality={quality} />\n    </Canvas>\n  );\n}`,
  },
  {
    id: 'ludus',
    name: 'packages/ludus/src/combat/TurnBasedEngine.ts',
    language: 'TypeScript',
    color: '#EF4444',
    position: [-1.5, 0, -2],
    height: 2.0,
    radius: 0.09,
    branches: 4,
    snippet: `export class TurnBasedEngine {\n  async executeTurn(action: PlayerAction): Promise<TurnResult> {\n    // Phase 1: Player action\n    const playerResult = this.resolveAction(action);\n\n    // Phase 2: Status effects tick\n    this.tickStatusEffects();\n\n    // Phase 3: Enemy AI\n    const enemyAction = this.ai.decide(this.state);\n    const enemyResult = this.resolveAction(enemyAction);\n\n    // Phase 4: Resolution\n    return this.resolveTurn(playerResult, enemyResult);\n  }\n}`,
  },
  {
    id: 'oculus',
    name: 'packages/oculus/src/components/HUD.tsx',
    language: 'TSX',
    color: '#22C55E',
    position: [1.5, 0, -2],
    height: 1.8,
    radius: 0.09,
    branches: 3,
    snippet: `export function HUD() {\n  const health = useOculusStore(s => s.health);\n  const mana = useOculusStore(s => s.mana);\n  const battle = useOculusStore(s => s.battle);\n\n  return (\n    <div className="oculus-hud">\n      <Panel compact>\n        <ProgressBar value={health} max={100}\n          variant="health" flash />\n        <ProgressBar value={mana} max={50}\n          variant="mana" />\n      </Panel>\n      <StatusEffectBar />\n      {battle.active && <BattleUI />}\n      <LootPanel />\n    </div>\n  );\n}`,
  },
  {
    id: 'shared',
    name: 'packages/shared/src/events/index.ts',
    language: 'TypeScript',
    color: '#FFD700',
    position: [0, 0, 3],
    height: 1.6,
    radius: 0.08,
    branches: 3,
    snippet: `export const GameEvents = {\n  // CHRONOS\n  PARSE_COMPLETE: 'parse:complete',\n  TOPOLOGY_GENERATED: 'topology:generated',\n  // LUDUS\n  ENCOUNTER_TRIGGERED: 'encounter:triggered',\n  COMBAT_START: 'combat:start',\n  DAMAGE_DEALT: 'combat:damage',\n  // OCULUS\n  STATUS_EFFECT_APPLIED: 'status:applied',\n  LOOT_DROPPED: 'loot:dropped',\n  NODE_CLICKED: 'node:clicked',\n} as const;\n\n// 29 total events bridging all 6 pillars`,
  },
];

const GLOW_COLOR = '#6dffaa';
const PRIMARY_COLOR = '#4d9a6c';

// ── DendriteBranch ──────────────────────────────────────────
function DendriteBranch({ node, onClick }: { node: FileNode; onClick: (node: FileNode) => void }) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + node.position[0]) * 0.08;
    }
  });

  return (
    <group position={node.position}>
      {/* Main trunk */}
      <mesh
        ref={meshRef}
        position={[0, node.height / 2, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(node); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[node.radius * 0.7, node.radius, node.height, 16]} />
        <meshStandardMaterial
          color={hovered ? GLOW_COLOR : node.color}
          emissive={hovered ? GLOW_COLOR : node.color}
          emissiveIntensity={hovered ? 0.6 : 0.2}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Sub-branches */}
      {Array.from({ length: node.branches }).map((_, i) => {
        const angle = (i / node.branches) * Math.PI * 2;
        const h = 0.4 + (i / node.branches) * (node.height * 0.7);
        const x = Math.sin(angle) * 0.45;
        const z = Math.cos(angle) * 0.45;
        return (
          <mesh
            key={i}
            position={[x, h, z]}
            rotation={[Math.PI / 4, angle, 0]}
          >
            <cylinderGeometry args={[0.02, 0.04, 0.5, 8]} />
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={0.15}
            />
          </mesh>
        );
      })}

      {/* Label */}
      <mesh position={[0, node.height + 0.3, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial
          color={hovered ? GLOW_COLOR : node.color}
          emissive={hovered ? GLOW_COLOR : node.color}
          emissiveIntensity={hovered ? 1.0 : 0.4}
        />
      </mesh>

      {/* Glow when hovered */}
      {hovered && (
        <pointLight
          position={[0, node.height / 2, 0]}
          color={GLOW_COLOR}
          intensity={2}
          distance={3}
        />
      )}
    </group>
  );
}

// ── Ground grid ─────────────────────────────────────────────
function Ground() {
  return (
    <group>
      <gridHelper args={[20, 20, PRIMARY_COLOR, '#1a2a1f']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#050a07" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// ── Mycelial connections ────────────────────────────────────
function MycelialNetwork() {
  const ref = useRef<Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      (ref.current.material as any).opacity = 0.15 + Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
    }
  });

  // Draw lines between nodes on the ground plane
  const n = FILE_NODES;
  const connections: Array<[[number, number, number], [number, number, number]]> = [
    [n[0]!.position, n[1]!.position],
    [n[0]!.position, n[2]!.position],
    [n[0]!.position, n[5]!.position],
    [n[1]!.position, n[3]!.position],
    [n[2]!.position, n[4]!.position],
    [n[3]!.position, n[4]!.position],
    [n[5]!.position, n[1]!.position],
    [n[5]!.position, n[2]!.position],
  ];

  return (
    <group>
      {connections.map(([from, to], i) => {
        const midX = (from[0] + to[0]) / 2;
        const midZ = (from[2] + to[2]) / 2;
        const dx = to[0] - from[0];
        const dz = to[2] - from[2];
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);

        return (
          <mesh
            key={i}
            ref={i === 0 ? ref : undefined}
            position={[midX, 0.01, midZ]}
            rotation={[-Math.PI / 2, 0, -angle]}
          >
            <planeGeometry args={[0.02, len]} />
            <meshBasicMaterial color={GLOW_COLOR} transparent opacity={0.15} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Code Overlay ────────────────────────────────────────────
function CodeOverlay({ node, onClose }: { node: FileNode; onClose: () => void }) {
  return (
    <div className="demo-code-overlay">
      <div className="demo-code-header">
        <div>
          <span className="demo-code-lang" style={{ color: node.color }}>{node.language}</span>
          <h3>{node.name}</h3>
        </div>
        <button onClick={onClose}>{'\u{2715}'} Close</button>
      </div>
      <div className="demo-code-content">
        <pre><code>{node.snippet}</code></pre>
      </div>
      <div className="demo-code-footer">
        In the full experience, this opens a Miller Column navigator with syntax highlighting
      </div>
    </div>
  );
}

// ── HUD ─────────────────────────────────────────────────────
function DemoHUD({ selectedNode }: { selectedNode: FileNode | null }) {
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    if (selectedNode) setEventCount(c => c + 1);
  }, [selectedNode]);

  return (
    <div className="demo-hud">
      <div className="demo-hud-panel">
        <h4>DENDROVIA</h4>
        <div className="demo-hud-stats">
          <div>Mode: <span className="demo-highlight">Falcon</span></div>
          <div>Pillars: <span className="demo-highlight">6</span></div>
          <div>Events: <span className="demo-highlight">{eventCount}</span></div>
          {selectedNode && (
            <div>Selected: <span className="demo-highlight">{selectedNode.id.toUpperCase()}</span></div>
          )}
        </div>
      </div>

      <div className="demo-hud-legend">
        <h5>Controls</h5>
        <ul>
          <li>Left-drag: Orbit camera</li>
          <li>Click branch: View source</li>
          <li>Scroll: Zoom</li>
          <li>Right-drag: Pan</li>
        </ul>
      </div>
    </div>
  );
}

// ── Stats bar ───────────────────────────────────────────────
function StatsBar() {
  return (
    <div className="demo-stats-bar">
      <div className="demo-stat">
        <span className="demo-stat-label">HP</span>
        <div className="demo-stat-bar">
          <div className="demo-stat-fill demo-stat-health" style={{ width: '85%' }} />
        </div>
        <span className="demo-stat-value">85/100</span>
      </div>
      <div className="demo-stat">
        <span className="demo-stat-label">MP</span>
        <div className="demo-stat-bar">
          <div className="demo-stat-fill demo-stat-mana" style={{ width: '60%' }} />
        </div>
        <span className="demo-stat-value">30/50</span>
      </div>
    </div>
  );
}

// ── Main Scene ──────────────────────────────────────────────
export function DemoScene() {
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [showCode, setShowCode] = useState(false);

  const handleClick = useCallback((node: FileNode) => {
    setSelectedNode(node);
    setShowCode(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowCode(false);
  }, []);

  return (
    <div className="demo-app">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={55} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2.1}
        />

        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 8, -5]} intensity={0.6} color="#ffffff" />
        <directionalLight position={[-3, 4, 3]} intensity={0.3} color="#4d9a6c" />

        <fog attach="fog" args={['#0a0a0a', 10, 25]} />

        <Ground />
        <MycelialNetwork />

        {FILE_NODES.map((node) => (
          <DendriteBranch key={node.id} node={node} onClick={handleClick} />
        ))}
      </Canvas>

      {/* OCULUS-style HUD overlay */}
      <DemoHUD selectedNode={selectedNode} />
      <StatsBar />

      {showCode && selectedNode && (
        <CodeOverlay node={selectedNode} onClose={handleClose} />
      )}

      {/* Bottom instructions */}
      <div className="demo-instructions">
        <strong>Proof of Concept</strong> — Each dendrite represents a pillar of the Dendrovia codebase. Click to read source.
      </div>
    </div>
  );
}
