import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRendererStore } from '../store/useRendererStore';
import { useCameraEditorStore } from '../store/useCameraEditorStore';
import { DEFAULT_AUTHORED_PARAMS } from '../systems/CameraParams';
import type {
  AuthoredCameraParams,
  CameraStateSnapshot,
  EditableMarkerKey,
  ViewQualityReport,
} from '../systems/CameraParams';

/**
 * NEST INSPECTOR
 *
 * Diagnostic panel overlay that displays as-rendered measurements, positions,
 * keyboard controls, transition state, authored/computed camera params,
 * camera marker editing, copy/paste, presets, and view quality.
 *
 * Renders as an HTML overlay portal.
 *
 * Toggled via store.inspectionMode (press I). Updates every ~6 frames.
 */

interface InspectorData {
  cameraPos: [number, number, number];
  cameraDist: number;
  nestPos: [number, number, number] | null;
  nestRadius: number;
  nestDepth: number;
  viewNear: number;
  viewFar: number;
  anchorCount: number;
  falconPhase: string;
  cameraMode: string;
  qualityTier: string;
  treeHeight: number;
  treeSpan: number;
  trunkRadius: number;
  isOnPlatform: boolean;
  isTransitioning: boolean;
  fps: number;
  devMode: boolean;
  viewFrameVisible: boolean;
}

const INITIAL_DATA: InspectorData = {
  cameraPos: [0, 0, 0],
  cameraDist: 0,
  nestPos: null,
  nestRadius: 0,
  nestDepth: 0,
  viewNear: 0,
  viewFar: 0,
  anchorCount: 0,
  falconPhase: 'idle',
  cameraMode: 'falcon',
  qualityTier: 'high',
  treeHeight: 0,
  treeSpan: 0,
  trunkRadius: 0,
  isOnPlatform: false,
  isTransitioning: false,
  fps: 0,
  devMode: false,
  viewFrameVisible: false,
};

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function vec3Str(arr: [number, number, number]): string {
  return `(${fmt(arr[0])}, ${fmt(arr[1])}, ${fmt(arr[2])})`;
}

/**
 * Inner component that runs inside R3F context to collect measurements.
 * Pushes data to the shared state callback every ~6 frames.
 */
function InspectorCollector({ onUpdate }: { onUpdate: (data: InspectorData) => void }) {
  const { camera } = useThree();
  const frameCount = useRef(0);

  useFrame(() => {
    frameCount.current += 1;
    if (frameCount.current % 6 !== 0) return;

    const state = useRendererStore.getState();
    const nest = state.activeNest;
    const pConfig = state.platformConfig;

    const pos = camera.position;
    const nestPos: [number, number, number] | null = nest
      ? [nest.nestPosition.x, nest.nestPosition.y, nest.nestPosition.z]
      : null;

    const dist = nest
      ? pos.distanceTo(nest.nestPosition)
      : 0;

    onUpdate({
      cameraPos: [pos.x, pos.y, pos.z],
      cameraDist: dist,
      nestPos,
      nestRadius: nest?.nestRadius ?? 0,
      nestDepth: nest?.depth ?? 0,
      viewNear: nest?.viewNearRadius ?? 0,
      viewFar: nest?.viewFarRadius ?? 0,
      anchorCount: nest?.nestBranchAnchors.length ?? 0,
      falconPhase: state.falconPhase,
      cameraMode: state.cameraMode,
      qualityTier: state.qualityTier,
      treeHeight: pConfig?.treeHeight ?? 0,
      treeSpan: pConfig?.treeSpan ?? 0,
      trunkRadius: pConfig?.trunkRadius ?? 0,
      isOnPlatform: state.isOnPlatform,
      isTransitioning: state.cameraTransitioning,
      fps: state.fps,
      devMode: state.devMode,
      viewFrameVisible: state.viewFrameVisible,
    });
  });

  return null;
}

/**
 * 3D debug labels rendered at key entity positions.
 * Only shown when devMode + inspectionMode are both active.
 */
function DebugLabels() {
  const activeNest = useRendererStore((s) => s.activeNest);
  const platformConfig = useRendererStore((s) => s.platformConfig);

  if (!activeNest) return null;

  const { nestPosition, nestRadius, viewNearRadius } = activeNest;

  return (
    <group name="debug-labels">
      {/* Nest center marker */}
      <mesh position={[nestPosition.x, nestPosition.y, nestPosition.z]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshBasicMaterial color="#FF00FF" />
      </mesh>

      {/* Nest radius boundary ring */}
      <mesh
        position={[nestPosition.x, nestPosition.y, nestPosition.z]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[nestRadius, 0.02, 4, 32]} />
        <meshBasicMaterial color="#FF00FF" transparent opacity={0.5} wireframe />
      </mesh>

      {/* View near boundary */}
      <mesh
        position={[nestPosition.x, nestPosition.y, nestPosition.z]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[viewNearRadius, 0.02, 4, 32]} />
        <meshBasicMaterial color="#00FF00" transparent opacity={0.3} wireframe />
      </mesh>

      {/* Origin marker (world origin) */}
      {platformConfig && (
        <mesh position={platformConfig.origin}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#FFFF00" />
        </mesh>
      )}
    </group>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const PANEL: React.CSSProperties = {
  position: 'fixed',
  top: 12,
  right: 12,
  width: 340,
  maxHeight: 'calc(100vh - 24px)',
  overflowY: 'auto',
  padding: '10px 14px',
  background: 'rgba(10, 10, 25, 0.94)',
  border: '1px solid rgba(168, 85, 247, 0.4)',
  borderRadius: 8,
  color: '#CBD5E1',
  fontFamily: 'JetBrains Mono, Fira Code, monospace',
  fontSize: 10.5,
  lineHeight: 1.55,
  zIndex: 9999,
  pointerEvents: 'none',
  backdropFilter: 'blur(8px)',
};

const SECTION_HDR: React.CSSProperties = {
  color: '#A855F7',
  fontWeight: 700,
  fontSize: 11,
  marginTop: 8,
  marginBottom: 4,
  borderBottom: '1px solid rgba(168, 85, 247, 0.25)',
  paddingBottom: 2,
  letterSpacing: '0.05em',
};

const FIRST_HDR: React.CSSProperties = {
  ...SECTION_HDR,
  marginTop: 0,
};

const ROW: React.CSSProperties = {
  marginBottom: 2,
  display: 'flex',
  justifyContent: 'space-between',
};

const LBL: React.CSSProperties = { color: '#64748B' };
const VAL: React.CSSProperties = { color: '#E2E8F0', fontWeight: 500 };

const BTN: React.CSSProperties = {
  pointerEvents: 'auto',
  cursor: 'pointer',
  background: 'rgba(168, 85, 247, 0.2)',
  border: '1px solid rgba(168, 85, 247, 0.4)',
  borderRadius: 3,
  color: '#CBD5E1',
  fontSize: 9.5,
  padding: '2px 6px',
  fontFamily: 'inherit',
};

const BTN_SMALL: React.CSSProperties = {
  ...BTN,
  padding: '1px 4px',
  fontSize: 9,
};

const INPUT_STYLE: React.CSSProperties = {
  pointerEvents: 'auto',
  background: 'rgba(30, 30, 50, 0.9)',
  border: '1px solid rgba(168, 85, 247, 0.3)',
  borderRadius: 3,
  color: '#E2E8F0',
  fontSize: 10,
  padding: '1px 4px',
  width: 50,
  textAlign: 'right',
  fontFamily: 'inherit',
};

const TEXTAREA_STYLE: React.CSSProperties = {
  pointerEvents: 'auto',
  background: 'rgba(30, 30, 50, 0.9)',
  border: '1px solid rgba(168, 85, 247, 0.3)',
  borderRadius: 3,
  color: '#E2E8F0',
  fontSize: 9,
  padding: '4px',
  width: '100%',
  fontFamily: 'inherit',
  resize: 'vertical',
  minHeight: 40,
};

/** A single key-binding row */
function KbRow({
  keys,
  desc,
  active,
  highlight,
}: {
  keys: string;
  desc: string;
  active?: boolean;
  highlight?: string;
}) {
  return (
    <div style={{
      ...ROW,
      background: active ? 'rgba(168, 85, 247, 0.15)' : undefined,
      borderRadius: active ? 3 : undefined,
      padding: active ? '1px 4px' : '0 4px',
    }}>
      <span style={{
        color: highlight ?? '#94A3B8',
        fontWeight: 600,
        minWidth: 70,
      }}>
        {keys}
      </span>
      <span style={{
        color: active ? '#E2E8F0' : '#94A3B8',
        textAlign: 'right',
        flex: 1,
      }}>
        {desc}
      </span>
    </div>
  );
}

/** Editable value row — click to edit inline */
function EditableRow({
  label,
  value,
  defaultValue,
  onChange,
  color,
}: {
  label: string;
  value: number;
  defaultValue: number;
  onChange: (v: number) => void;
  color?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(value));
  const isDirty = Math.abs(value - defaultValue) > 0.0001;

  const handleSubmit = () => {
    const parsed = parseFloat(inputVal);
    if (!isNaN(parsed)) onChange(parsed);
    setEditing(false);
  };

  return (
    <div style={ROW}>
      <span style={{ ...LBL, color: color ?? LBL.color }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {editing ? (
          <input
            style={INPUT_STYLE}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
          />
        ) : (
          <span
            style={{ ...VAL, cursor: 'pointer', pointerEvents: 'auto', color: isDirty ? '#F59E0B' : VAL.color }}
            onClick={() => { setInputVal(String(value)); setEditing(true); }}
          >
            {fmt(value, 3)}
          </span>
        )}
        {isDirty && (
          <button style={BTN_SMALL} onClick={() => onChange(defaultValue)} title="Reset to default">
            R
          </button>
        )}
      </span>
    </div>
  );
}

// ─── SECTION COMPONENTS ──────────────────────────────────────────────────────

function AuthoredParamsSection() {
  const params = useCameraEditorStore((s) => s.authoredParams);
  const setParam = useCameraEditorStore((s) => s.setAuthoredParam);
  const setFov = useCameraEditorStore((s) => s.setFov);
  const setNestVerticalOffset = useCameraEditorStore((s) => s.setNestVerticalOffset);
  const resetAll = useCameraEditorStore((s) => s.resetAuthoredParams);
  const d = DEFAULT_AUTHORED_PARAMS;

  return (
    <>
      <div style={{ ...SECTION_HDR, color: '#3B82F6', borderBottomColor: 'rgba(59, 130, 246, 0.25)' }}>
        AUTHORED PARAMS
        <button style={{ ...BTN_SMALL, float: 'right' }} onClick={resetAll}>Reset All</button>
      </div>

      <div style={{ color: '#475569', fontSize: 9, marginBottom: 3 }}>Falcon</div>
      <EditableRow label="guidePull" value={params.falcon.guidePull} defaultValue={d.falcon.guidePull} onChange={(v) => setParam('falcon', 'guidePull', v)} color="#3B82F6" />
      <EditableRow label="nudgeSpeed" value={params.falcon.nudgeSpeed} defaultValue={d.falcon.nudgeSpeed} onChange={(v) => setParam('falcon', 'nudgeSpeed', v)} color="#3B82F6" />
      <EditableRow label="zoomSpeed" value={params.falcon.zoomSpeed} defaultValue={d.falcon.zoomSpeed} onChange={(v) => setParam('falcon', 'zoomSpeed', v)} color="#3B82F6" />
      <EditableRow label="zoomMin" value={params.falcon.zoomMin} defaultValue={d.falcon.zoomMin} onChange={(v) => setParam('falcon', 'zoomMin', v)} color="#3B82F6" />
      <EditableRow label="zoomMax" value={params.falcon.zoomMax} defaultValue={d.falcon.zoomMax} onChange={(v) => setParam('falcon', 'zoomMax', v)} color="#3B82F6" />
      <EditableRow label="offsetDecay" value={params.falcon.offsetDecay} defaultValue={d.falcon.offsetDecay} onChange={(v) => setParam('falcon', 'offsetDecay', v)} color="#3B82F6" />

      <div style={{ color: '#475569', fontSize: 9, marginBottom: 3, marginTop: 4 }}>Player 1P</div>
      <EditableRow label="mouseSens" value={params.player1p.mouseSensitivity} defaultValue={d.player1p.mouseSensitivity} onChange={(v) => setParam('player1p', 'mouseSensitivity', v)} color="#22C55E" />

      <div style={{ color: '#475569', fontSize: 9, marginBottom: 3, marginTop: 4 }}>Player 3P</div>
      <EditableRow label="chaseLag" value={params.player3p.chaseLag} defaultValue={d.player3p.chaseLag} onChange={(v) => setParam('player3p', 'chaseLag', v)} color="#3B82F6" />
      <EditableRow label="orbitSens" value={params.player3p.orbitSensitivity} defaultValue={d.player3p.orbitSensitivity} onChange={(v) => setParam('player3p', 'orbitSensitivity', v)} color="#3B82F6" />
      <EditableRow label="minDist" value={params.player3p.minDistance} defaultValue={d.player3p.minDistance} onChange={(v) => setParam('player3p', 'minDistance', v)} color="#3B82F6" />
      <EditableRow label="maxDist" value={params.player3p.maxDistance} defaultValue={d.player3p.maxDistance} onChange={(v) => setParam('player3p', 'maxDistance', v)} color="#3B82F6" />

      <div style={{ color: '#475569', fontSize: 9, marginBottom: 3, marginTop: 4 }}>Transition</div>
      <EditableRow label="duration" value={params.transition.transitionDuration} defaultValue={d.transition.transitionDuration} onChange={(v) => setParam('transition', 'transitionDuration', v)} color="#3B82F6" />
      <EditableRow label="flyinDur" value={params.transition.flyinDuration} defaultValue={d.transition.flyinDuration} onChange={(v) => setParam('transition', 'flyinDuration', v)} color="#3B82F6" />

      <div style={{ color: '#475569', fontSize: 9, marginBottom: 3, marginTop: 4 }}>Global</div>
      <EditableRow label="fov" value={params.fov} defaultValue={d.fov} onChange={(v) => setFov(v)} color="#F59E0B" />
      <EditableRow label="nestOffset" value={params.nestVerticalOffset} defaultValue={d.nestVerticalOffset} onChange={(v) => setNestVerticalOffset(v)} color="#F59E0B" />
    </>
  );
}

function ComputedParamsSection() {
  const cp = useCameraEditorStore((s) => s.computedParams);
  if (!cp) return null;

  return (
    <>
      <div style={{ ...SECTION_HDR, color: '#F59E0B', borderBottomColor: 'rgba(245, 158, 11, 0.25)' }}>
        COMPUTED PARAMS
      </div>
      <div style={ROW}>
        <span style={{ ...LBL, color: '#F59E0B' }}>nestPos</span>
        <span style={VAL}>{vec3Str(cp.nestPosition)}</span>
      </div>
      <div style={ROW}>
        <span style={{ ...LBL, color: '#F59E0B' }}>nestR</span>
        <span style={VAL}>{fmt(cp.nestRadius)}</span>
        <span style={{ ...LBL, color: '#F59E0B', marginLeft: 6 }}>depth</span>
        <span style={VAL}>{fmt(cp.nestDepth)}</span>
      </div>
      <div style={ROW}>
        <span style={{ ...LBL, color: '#F59E0B' }}>viewNear</span>
        <span style={VAL}>{fmt(cp.viewNearRadius)}</span>
        <span style={{ ...LBL, color: '#F59E0B', marginLeft: 4 }}>far</span>
        <span style={VAL}>{fmt(cp.viewFarRadius)}</span>
      </div>
      <div style={ROW}>
        <span style={{ ...LBL, color: '#F59E0B' }}>orbit</span>
        <span style={VAL}>a={fmt(cp.orbitSemiMajor)} b={fmt(cp.orbitSemiMinor)}</span>
      </div>
    </>
  );
}

function CameraMarkersSection() {
  const markers = useCameraEditorStore((s) => s.markerStates);
  const editingMarker = useCameraEditorStore((s) => s.editingMarker);
  const dirty = useCameraEditorStore((s) => s.markersDirty);
  const mode = useRendererStore((s) => s.cameraMode);

  if (mode !== 'spectator') return null;

  const markerKeys: EditableMarkerKey[] = ['falcon', 'player-1p', 'player-3p'];
  const colors: Record<EditableMarkerKey, string> = {
    falcon: '#00FFFF',
    'player-1p': '#22C55E',
    'player-3p': '#EAB308',
  };

  return (
    <>
      <div style={SECTION_HDR}>
        CAMERA MARKERS
        {dirty && <span style={{ color: '#F59E0B', fontSize: 9, marginLeft: 6 }}>(edited)</span>}
        <button
          style={{ ...BTN_SMALL, float: 'right' }}
          onClick={() => useCameraEditorStore.getState().resetMarkerStates()}
        >
          Reset
        </button>
      </div>
      {markerKeys.map((key) => (
        <div key={key} style={{ marginBottom: 4 }}>
          <div style={{
            ...ROW,
            background: editingMarker === key ? 'rgba(168, 85, 247, 0.15)' : undefined,
            borderRadius: 3,
            padding: '1px 4px',
          }}>
            <span style={{ color: colors[key], fontWeight: 600, fontSize: 10 }}>{key}</span>
            <button
              style={BTN_SMALL}
              onClick={() => {
                const store = useCameraEditorStore.getState();
                store.setEditingMarker(store.editingMarker === key ? null : key);
              }}
            >
              {editingMarker === key ? 'Deselect' : 'Select'}
            </button>
          </div>
          <div style={{ ...ROW, paddingLeft: 8 }}>
            <span style={LBL}>pos</span>
            <span style={{ ...VAL, fontSize: 9.5 }}>{vec3Str(markers[key].position)}</span>
          </div>
          <div style={{ ...ROW, paddingLeft: 8 }}>
            <span style={LBL}>target</span>
            <span style={{ ...VAL, fontSize: 9.5 }}>{vec3Str(markers[key].target)}</span>
          </div>
        </div>
      ))}
    </>
  );
}

function CopyPasteSection() {
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');

  const handleCopyState = useCallback(() => {
    const snapshot = useCameraEditorStore.getState().exportSnapshot();
    navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2)).catch(() => {});
  }, []);

  const handleCopyAsCode = useCallback(() => {
    const snapshot = useCameraEditorStore.getState().exportSnapshot();
    const code = `const CAMERA_STATE: CameraStateSnapshot = ${JSON.stringify(snapshot, null, 2)} as const;`;
    navigator.clipboard.writeText(code).catch(() => {});
  }, []);

  const handlePaste = useCallback(() => {
    try {
      const parsed = JSON.parse(pasteText) as CameraStateSnapshot;
      if (!parsed.markers || !parsed.authoredParams) {
        setPasteError('Invalid snapshot: missing markers or authoredParams');
        return;
      }
      useCameraEditorStore.getState().importSnapshot(parsed);
      setPasteText('');
      setPasteError('');
    } catch {
      setPasteError('Invalid JSON');
    }
  }, [pasteText]);

  return (
    <>
      <div style={SECTION_HDR}>COPY / PASTE</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        <button style={BTN} onClick={handleCopyState}>Copy State</button>
        <button style={BTN} onClick={handleCopyAsCode}>Copy as Code</button>
      </div>
      <textarea
        style={TEXTAREA_STYLE}
        placeholder="Paste JSON snapshot here..."
        value={pasteText}
        onChange={(e) => { setPasteText(e.target.value); setPasteError(''); }}
      />
      {pasteText && (
        <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
          <button style={BTN} onClick={handlePaste}>Apply</button>
          <button style={BTN} onClick={() => { setPasteText(''); setPasteError(''); }}>Clear</button>
        </div>
      )}
      {pasteError && (
        <div style={{ color: '#EF4444', fontSize: 9, marginTop: 2 }}>{pasteError}</div>
      )}
    </>
  );
}

function PresetsSection() {
  const presets = useCameraEditorStore((s) => s.presets);
  const computedParams = useCameraEditorStore((s) => s.computedParams);
  const [newName, setNewName] = useState('');
  const [savingMode, setSavingMode] = useState<'falcon' | 'player-1p' | 'player-3p'>('falcon');

  const viewFarRadius = computedParams?.viewFarRadius ?? 1;
  const nestPosition = computedParams?.nestPosition ?? [0, 0, 0] as [number, number, number];

  const handleSave = useCallback(() => {
    if (!newName.trim()) return;
    useCameraEditorStore.getState().savePreset(newName.trim(), savingMode, viewFarRadius);
    setNewName('');
  }, [newName, savingMode, viewFarRadius]);

  const modes: Array<'falcon' | 'player-1p' | 'player-3p'> = ['falcon', 'player-1p', 'player-3p'];

  return (
    <>
      <div style={SECTION_HDR}>PRESETS</div>

      {/* Save new preset */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
        <input
          style={{ ...INPUT_STYLE, width: 100 }}
          placeholder="Name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
        />
        <select
          style={{ ...INPUT_STYLE, width: 70 }}
          value={savingMode}
          onChange={(e) => setSavingMode(e.target.value as typeof savingMode)}
        >
          {modes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <button style={BTN_SMALL} onClick={handleSave}>Save</button>
      </div>

      {/* Preset list */}
      {presets.length === 0 && (
        <div style={{ color: '#475569', fontSize: 9 }}>No presets saved yet</div>
      )}
      {presets.map((p) => (
        <div key={p.id} style={{
          ...ROW,
          alignItems: 'center',
          background: p.starred ? 'rgba(245, 158, 11, 0.1)' : undefined,
          borderRadius: 3,
          padding: '1px 4px',
          marginBottom: 2,
        }}>
          <button
            style={{ ...BTN_SMALL, color: p.starred ? '#F59E0B' : '#475569', background: 'none', border: 'none' }}
            onClick={() => useCameraEditorStore.getState().starPreset(p.id)}
            title={p.starred ? 'Default preset' : 'Set as default'}
          >
            {p.starred ? '\u2605' : '\u2606'}
          </button>
          <span style={{ ...VAL, fontSize: 9.5, flex: 1 }}>{p.name}</span>
          <span style={{ color: '#64748B', fontSize: 8.5, marginRight: 4 }}>{p.mode}</span>
          <button
            style={BTN_SMALL}
            onClick={() => useCameraEditorStore.getState().applyPreset(p.id, viewFarRadius, nestPosition)}
          >
            Apply
          </button>
          <button
            style={{ ...BTN_SMALL, color: '#EF4444', marginLeft: 2 }}
            onClick={() => useCameraEditorStore.getState().deletePreset(p.id)}
          >
            X
          </button>
        </div>
      ))}
    </>
  );
}

function ViewQualitySection() {
  const viewQuality = useCameraEditorStore((s) => s.viewQuality);
  const cameraMode = useRendererStore((s) => s.cameraMode);

  if (!cameraMode.startsWith('player')) return null;

  const scoreColor = viewQuality.score >= 80 ? '#22C55E'
    : viewQuality.score >= 50 ? '#F59E0B'
    : '#EF4444';

  return (
    <>
      <div style={SECTION_HDR}>
        VIEW QUALITY
        <button
          style={{ ...BTN_SMALL, float: 'right' }}
          onClick={() => useCameraEditorStore.getState().toggleViewQuality()}
        >
          {viewQuality.enabled ? 'Disable' : 'Enable'}
        </button>
      </div>
      <div style={ROW}>
        <span style={LBL}>Score</span>
        <span style={{ ...VAL, color: scoreColor }}>{viewQuality.score}/100</span>
      </div>
      {viewQuality.issues.length === 0 && viewQuality.enabled && (
        <div style={{ color: '#22C55E', fontSize: 9 }}>No issues detected</div>
      )}
      {!viewQuality.enabled && (
        <div style={{ color: '#475569', fontSize: 9 }}>Validation disabled</div>
      )}
      {viewQuality.issues.map((issue, i) => (
        <div key={i} style={{
          ...ROW,
          background: issue.severity === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          borderRadius: 3,
          padding: '1px 4px',
          marginBottom: 2,
        }}>
          <span style={{
            color: issue.severity === 'error' ? '#EF4444' : '#F59E0B',
            fontWeight: 600,
            fontSize: 9,
            minWidth: 24,
          }}>
            {issue.severity === 'error' ? 'ERR' : 'WRN'}
          </span>
          <span style={{ color: '#CBD5E1', fontSize: 9.5 }}>{issue.message}</span>
        </div>
      ))}
    </>
  );
}

// ─── MAIN PANEL ──────────────────────────────────────────────────────────────

/**
 * HTML overlay panel for the inspection display.
 */
function InspectorPanel({ data }: { data: InspectorData }) {
  const phaseColor = data.falconPhase === 'orbit' ? '#3B82F6'
    : data.falconPhase === 'approach' ? '#F59E0B'
    : data.falconPhase === 'arrived' ? '#22C55E'
    : '#475569';

  const modeColor = data.cameraMode === 'falcon' ? '#00FFFF'
    : data.cameraMode === 'spectator' ? '#F59E0B'
    : data.cameraMode === 'player-1p' ? '#22C55E'
    : data.cameraMode === 'player-3p' ? '#EAB308'
    : '#94A3B8';

  return (
    <div style={PANEL}>
      {/* ─── CONTROLS ─── */}
      <div style={FIRST_HDR}>CONTROLS</div>
      <KbRow keys="C" desc="Cycle: falcon → 1P → 3P" active={false} />
      <KbRow keys="Tab" desc="Quick toggle 1P ↔ 3P" active={data.cameraMode.startsWith('player')} highlight="#22C55E" />
      <KbRow keys="Shift-V" desc="Spectator (free orbit + cam viz)" active={data.cameraMode === 'spectator'} highlight="#F59E0B" />
      <KbRow keys="V" desc={`View frame ${data.viewFrameVisible ? '(ON)' : '(off)'}`} active={data.viewFrameVisible} />
      <KbRow keys="`" desc={`Dev mode ${data.devMode ? '(ON)' : '(off)'}`} active={data.devMode} />
      <KbRow keys="I" desc="This panel" active={true} highlight="#A855F7" />
      <KbRow keys="Shift-C" desc="Copy camera state" active={false} highlight="#64748B" />
      <div style={{ ...ROW, marginTop: 2 }}>
        <span style={{ color: '#475569', fontSize: 9.5 }}>
          WASD: move &nbsp; Space: jump &nbsp; Scroll: zoom (falcon)
        </span>
      </div>

      {/* ─── CAMERA ─── */}
      <div style={SECTION_HDR}>CAMERA</div>
      <div style={ROW}>
        <span style={LBL}>Mode</span>
        <span style={{ ...VAL, color: modeColor }}>{data.cameraMode}</span>
      </div>
      <div style={ROW}>
        <span style={LBL}>Position</span>
        <span style={VAL}>{vec3Str(data.cameraPos)}</span>
      </div>
      {data.nestPos && (
        <div style={ROW}>
          <span style={LBL}>Dist→Nest</span>
          <span style={VAL}>{fmt(data.cameraDist)}u</span>
        </div>
      )}
      <div style={ROW}>
        <span style={LBL}>Platform</span>
        <span style={{ ...VAL, color: data.isOnPlatform ? '#22C55E' : '#64748B' }}>
          {data.isOnPlatform ? 'ON' : 'off'}
        </span>
      </div>

      {/* ─── TRANSITION ─── */}
      {data.isTransitioning && (
        <>
          <div style={{
            ...SECTION_HDR,
            color: '#F59E0B',
            borderBottom: '1px solid rgba(245, 158, 11, 0.4)',
          }}>
            TRANSITION ACTIVE
          </div>
          <div style={{
            ...ROW,
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: 3,
            padding: '2px 4px',
          }}>
            <span style={{ color: '#F59E0B' }}>
              Camera interpolating to target...
            </span>
          </div>
        </>
      )}

      {/* ─── FALCON ─── */}
      <div style={SECTION_HDR}>FALCON</div>
      <div style={ROW}>
        <span style={LBL}>Phase</span>
        <span style={{ ...VAL, color: phaseColor }}>{data.falconPhase}</span>
      </div>

      {/* ─── GEOMETRY ─── */}
      <div style={SECTION_HDR}>GEOMETRY</div>
      {data.nestPos && (
        <div style={ROW}>
          <span style={LBL}>Nest</span>
          <span style={VAL}>{vec3Str(data.nestPos)}</span>
        </div>
      )}
      <div style={ROW}>
        <span style={LBL}>Nest r</span>
        <span style={VAL}>{fmt(data.nestRadius)}u</span>
        <span style={{ ...LBL, marginLeft: 8 }}>d</span>
        <span style={VAL}>{fmt(data.nestDepth)}u</span>
      </div>
      <div style={ROW}>
        <span style={LBL}>View</span>
        <span style={VAL}>{fmt(data.viewNear)}u</span>
        <span style={{ ...LBL, marginLeft: 4 }}>→</span>
        <span style={VAL}>{fmt(data.viewFar)}u</span>
      </div>
      <div style={ROW}>
        <span style={LBL}>Trunk</span>
        <span style={VAL}>r={fmt(data.trunkRadius, 3)}</span>
        <span style={{ ...LBL, marginLeft: 8 }}>H</span>
        <span style={VAL}>{fmt(data.treeHeight)}</span>
        <span style={{ ...LBL, marginLeft: 4 }}>W</span>
        <span style={VAL}>{fmt(data.treeSpan)}</span>
      </div>
      <div style={ROW}>
        <span style={LBL}>Anchors</span>
        <span style={VAL}>{data.anchorCount}</span>
      </div>

      {/* ─── AUTHORED PARAMS ─── */}
      <AuthoredParamsSection />

      {/* ─── COMPUTED PARAMS ─── */}
      <ComputedParamsSection />

      {/* ─── CAMERA MARKERS ─── */}
      <CameraMarkersSection />

      {/* ─── COPY / PASTE ─── */}
      <CopyPasteSection />

      {/* ─── PRESETS ─── */}
      <PresetsSection />

      {/* ─── VIEW QUALITY ─── */}
      <ViewQualitySection />

      {/* ─── PERF ─── */}
      <div style={SECTION_HDR}>PERF</div>
      <div style={ROW}>
        <span style={LBL}>FPS</span>
        <span style={{
          ...VAL,
          color: data.fps >= 55 ? '#22C55E' : data.fps >= 30 ? '#F59E0B' : '#EF4444',
        }}>
          {data.fps}
        </span>
        <span style={{ ...LBL, marginLeft: 12 }}>Tier</span>
        <span style={VAL}>{data.qualityTier}</span>
      </div>
    </div>
  );
}

// ─── PUBLIC COMPONENTS ───────────────────────────────────────────────────────

/**
 * NestInspector — composed from collector (R3F), panel (DOM), and labels (R3F).
 *
 * The collector + labels are R3F children (must be inside <Canvas>).
 * The panel renders via a React portal to the document body.
 */
export function NestInspector() {
  const inspectionMode = useRendererStore((s) => s.inspectionMode);
  const devMode = useRendererStore((s) => s.devMode);
  const [data, setData] = useState<InspectorData>(INITIAL_DATA);

  // Portal target for the HTML panel
  const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!inspectionMode) {
      if (portalTarget) {
        portalTarget.remove();
        setPortalTarget(null);
      }
      return;
    }

    // Create a portal div in the document body
    const div = document.createElement('div');
    div.id = 'nest-inspector-portal';
    document.body.appendChild(div);
    setPortalTarget(div);

    return () => {
      div.remove();
      setPortalTarget(null);
    };
  }, [inspectionMode]);

  const handleUpdate = useCallback((d: InspectorData) => {
    setData(d);
  }, []);

  if (!inspectionMode) return null;

  return (
    <>
      {/* Data collector runs inside R3F */}
      <InspectorCollector onUpdate={handleUpdate} />

      {/* 3D debug labels when both devMode + inspectionMode are active */}
      {devMode && <DebugLabels />}

      {/* DOM overlay panel — portaled to document.body outside the Canvas */}
      {portalTarget && createPortal(<InspectorPanel data={data} />, portalTarget)}
    </>
  );
}

/**
 * Companion DOM component that renders the inspection panel.
 * Must be placed OUTSIDE the Canvas (sibling, not child).
 */
export function NestInspectorPanel() {
  const inspectionMode = useRendererStore((s) => s.inspectionMode);
  const [data, setData] = useState<InspectorData>(INITIAL_DATA);

  // Subscribe to store updates for panel rendering
  useEffect(() => {
    if (!inspectionMode) return;

    // Poll store at ~10Hz for panel updates
    const interval = setInterval(() => {
      const state = useRendererStore.getState();
      const nest = state.activeNest;
      const pConfig = state.platformConfig;

      setData({
        cameraPos: state.playerPosition,
        cameraDist: 0,
        nestPos: nest ? [nest.nestPosition.x, nest.nestPosition.y, nest.nestPosition.z] : null,
        nestRadius: nest?.nestRadius ?? 0,
        nestDepth: nest?.depth ?? 0,
        viewNear: nest?.viewNearRadius ?? 0,
        viewFar: nest?.viewFarRadius ?? 0,
        anchorCount: nest?.nestBranchAnchors.length ?? 0,
        falconPhase: state.falconPhase,
        cameraMode: state.cameraMode,
        qualityTier: state.qualityTier,
        treeHeight: pConfig?.treeHeight ?? 0,
        treeSpan: pConfig?.treeSpan ?? 0,
        trunkRadius: pConfig?.trunkRadius ?? 0,
        isOnPlatform: state.isOnPlatform,
        isTransitioning: state.cameraTransitioning,
        fps: state.fps,
        devMode: state.devMode,
        viewFrameVisible: state.viewFrameVisible,
      });
    }, 100);

    return () => clearInterval(interval);
  }, [inspectionMode]);

  if (!inspectionMode) return null;

  return <InspectorPanel data={data} />;
}
