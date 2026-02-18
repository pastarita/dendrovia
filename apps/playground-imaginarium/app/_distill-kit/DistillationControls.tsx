'use client';

/**
 * DistillationControls — Parameter controls for the distillation pipeline.
 *
 * IMAGINARIUM's equivalent of OCULUS's PropPlayground, but specialized
 * for distillation parameters: language, complexity, harmony scheme,
 * noise type, L-system iterations, seed, and OKLCH color adjustments.
 *
 * Auto-wires to DistillationProvider via useDistillation().
 */

import { useDistillation } from './DistillationProvider';
import type { DistillationConfig } from './types';
import {
  controlPanelStyle,
  controlLabelStyle,
  controlInputStyle,
  controlSelectStyle,
  sectionHeaderStyle,
  distillBtnStyle,
  distillBtnPrimaryStyle,
  swatchStyle,
} from './distill-styles';

const LANGUAGES = [
  'typescript', 'javascript', 'rust', 'python', 'go', 'java',
  'c', 'cpp', 'ruby', 'html', 'css', 'json', 'swift', 'kotlin',
  'scala', 'elixir', 'haskell', 'shell',
];

const HARMONY_SCHEMES = [
  { value: 'analogous', label: 'Analogous' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'triadic', label: 'Triadic' },
  { value: 'split-complementary', label: 'Split-Complementary' },
] as const;

const NOISE_TYPES = [
  { value: 'simplex', label: 'Simplex' },
  { value: 'perlin', label: 'Perlin' },
  { value: 'fbm', label: 'FBM (Fractal)' },
  { value: 'worley', label: 'Worley (Cell)' },
] as const;

interface DistillationControlsProps {
  /** Hide specific control groups */
  hide?: Array<'topology' | 'palette' | 'noise' | 'lsystem' | 'seed'>;
}

export function DistillationControls({ hide = [] }: DistillationControlsProps) {
  const { config, output, updateConfig, recompute, isComputing } = useDistillation();

  const show = (group: string) => !hide.includes(group as never);

  return (
    <div style={controlPanelStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
          Distillation Parameters
        </h3>
        <button
          style={distillBtnPrimaryStyle}
          onClick={recompute}
          disabled={isComputing}
        >
          {isComputing ? 'Computing...' : 'Distill'}
        </button>
      </div>

      {/* Topology Controls */}
      {show('topology') && (
        <>
          <div style={sectionHeaderStyle}>Topology</div>

          <label style={controlLabelStyle}>
            <span style={{ minWidth: 100 }}>Language</span>
            <select
              value={config.language}
              onChange={(e) => updateConfig({ language: e.target.value })}
              style={{ ...controlSelectStyle, flex: 1 }}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </label>

          <label style={{ ...controlLabelStyle, flexWrap: 'wrap' }}>
            <span style={{ minWidth: 100 }}>Complexity</span>
            <input
              type="range"
              min={1}
              max={25}
              value={config.complexity}
              onChange={(e) => updateConfig({ complexity: +e.target.value })}
              style={{ flex: 1, minWidth: 80 }}
            />
            <span style={{ fontSize: '0.75rem', opacity: 0.6, minWidth: 28, textAlign: 'right' }}>
              {config.complexity}
            </span>
          </label>

          <label style={{ ...controlLabelStyle, flexWrap: 'wrap' }}>
            <span style={{ minWidth: 100 }}>File Count</span>
            <input
              type="range"
              min={1}
              max={500}
              step={5}
              value={config.fileCount}
              onChange={(e) => updateConfig({ fileCount: +e.target.value })}
              style={{ flex: 1, minWidth: 80 }}
            />
            <span style={{ fontSize: '0.75rem', opacity: 0.6, minWidth: 36, textAlign: 'right' }}>
              {config.fileCount}
            </span>
          </label>

          <label style={{ ...controlLabelStyle, flexWrap: 'wrap' }}>
            <span style={{ minWidth: 100 }}>Max Depth</span>
            <input
              type="range"
              min={1}
              max={8}
              value={config.maxDepth}
              onChange={(e) => updateConfig({ maxDepth: +e.target.value })}
              style={{ flex: 1, minWidth: 80 }}
            />
            <span style={{ fontSize: '0.75rem', opacity: 0.6, minWidth: 28, textAlign: 'right' }}>
              {config.maxDepth}
            </span>
          </label>
        </>
      )}

      {/* Palette Controls */}
      {show('palette') && (
        <>
          <div style={sectionHeaderStyle}>Palette</div>

          <label style={controlLabelStyle}>
            <span style={{ minWidth: 100 }}>Harmony</span>
            <select
              value={config.harmonyScheme}
              onChange={(e) => updateConfig({ harmonyScheme: e.target.value as DistillationConfig['harmonyScheme'] })}
              style={{ ...controlSelectStyle, flex: 1 }}
            >
              {HARMONY_SCHEMES.map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </label>

          <label style={{ ...controlLabelStyle, flexWrap: 'wrap' }}>
            <span style={{ minWidth: 100 }}>Saturation</span>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.05}
              value={config.saturationMultiplier}
              onChange={(e) => updateConfig({ saturationMultiplier: +e.target.value })}
              style={{ flex: 1, minWidth: 80 }}
            />
            <span style={{ fontSize: '0.75rem', opacity: 0.6, minWidth: 36, textAlign: 'right' }}>
              {config.saturationMultiplier.toFixed(2)}
            </span>
          </label>

          <label style={{ ...controlLabelStyle, flexWrap: 'wrap' }}>
            <span style={{ minWidth: 100 }}>Lightness</span>
            <input
              type="range"
              min={-0.2}
              max={0.2}
              step={0.01}
              value={config.lightnessOffset}
              onChange={(e) => updateConfig({ lightnessOffset: +e.target.value })}
              style={{ flex: 1, minWidth: 80 }}
            />
            <span style={{ fontSize: '0.75rem', opacity: 0.6, minWidth: 36, textAlign: 'right' }}>
              {config.lightnessOffset >= 0 ? '+' : ''}{config.lightnessOffset.toFixed(2)}
            </span>
          </label>

          {/* Live palette preview */}
          {output.palette && (
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
              {(['primary', 'secondary', 'accent', 'glow', 'background'] as const).map((role) => (
                <div key={role} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                  <div style={swatchStyle(output.palette![role])} title={`${role}: ${output.palette![role]}`} />
                  <span style={{ fontSize: '0.55rem', opacity: 0.4 }}>{role}</span>
                </div>
              ))}
              <span style={{ fontSize: '0.65rem', opacity: 0.4, alignSelf: 'center', marginLeft: '0.5rem' }}>
                {output.palette.mood}
              </span>
            </div>
          )}
        </>
      )}

      {/* Noise Controls */}
      {show('noise') && (
        <>
          <div style={sectionHeaderStyle}>Noise</div>

          <label style={controlLabelStyle}>
            <span style={{ minWidth: 100 }}>Type</span>
            <select
              value={config.noiseType}
              onChange={(e) => updateConfig({ noiseType: e.target.value as DistillationConfig['noiseType'] })}
              style={{ ...controlSelectStyle, flex: 1 }}
            >
              {NOISE_TYPES.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </label>
        </>
      )}

      {/* L-System Controls */}
      {show('lsystem') && (
        <>
          <div style={sectionHeaderStyle}>L-System</div>

          <label style={{ ...controlLabelStyle, flexWrap: 'wrap' }}>
            <span style={{ minWidth: 100 }}>Iterations</span>
            <input
              type="range"
              min={1}
              max={5}
              value={config.lsystemIterations}
              onChange={(e) => updateConfig({ lsystemIterations: +e.target.value })}
              style={{ flex: 1, minWidth: 80 }}
            />
            <span style={{ fontSize: '0.75rem', opacity: 0.6, minWidth: 28, textAlign: 'right' }}>
              {config.lsystemIterations}
            </span>
          </label>

          {output.lsystem && (
            <div style={{ fontSize: '0.7rem', opacity: 0.5, fontFamily: 'var(--font-geist-mono, monospace)' }}>
              {output.lsystem.segmentCount} segments, {output.lsystem.angle}&deg; angle
            </div>
          )}
        </>
      )}

      {/* Seed Controls */}
      {show('seed') && (
        <>
          <div style={sectionHeaderStyle}>Seed</div>

          <label style={controlLabelStyle}>
            <span style={{ minWidth: 100 }}>Seed</span>
            <input
              type="text"
              value={config.seed}
              onChange={(e) => updateConfig({ seed: e.target.value })}
              style={{ ...controlInputStyle, flex: 1, fontFamily: 'var(--font-geist-mono, monospace)' }}
              placeholder="deterministic seed"
            />
          </label>
        </>
      )}

      {/* Reset */}
      <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          style={distillBtnStyle}
          onClick={() => updateConfig({
            language: 'typescript',
            complexity: 8,
            fileCount: 50,
            maxDepth: 4,
            seed: 'dendrovia-001',
            harmonyScheme: 'split-complementary',
            noiseType: 'fbm',
            lsystemIterations: 3,
            saturationMultiplier: 1.0,
            lightnessOffset: 0,
          })}
        >
          Reset Defaults
        </button>
      </div>
    </div>
  );
}
