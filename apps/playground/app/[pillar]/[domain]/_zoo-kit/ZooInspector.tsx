'use client';

/**
 * ZooInspector — Sticky right panel showing exhibit details,
 * interactive PropPlayground controls, and a live preview.
 */

import type { ZooExhibitDescriptor, ExhibitRenderProps } from './types';
import { inspectorStyle, sectionHeaderStyle } from './zoo-styles';
import { PropPlayground } from './PropPlayground';

interface ZooInspectorProps {
  exhibit: ZooExhibitDescriptor;
  controlValues: Record<string, unknown>;
  onControlChange: (key: string, value: unknown) => void;
  onClose: () => void;
}

export function ZooInspector({
  exhibit,
  controlValues,
  onControlChange,
  onClose,
}: ZooInspectorProps) {
  const Preview = exhibit.component;
  const renderProps: ExhibitRenderProps = { controlValues, isInspecting: true };

  return (
    <div style={{
      ...inspectorStyle,
      position: 'sticky',
      top: 0,
      alignSelf: 'flex-start',
      maxHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{exhibit.icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{exhibit.name}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{exhibit.description}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid #333',
            borderRadius: '4px',
            color: 'inherit',
            cursor: 'pointer',
            padding: '0.2rem 0.5rem',
            fontSize: '0.8rem',
          }}
          title="Close inspector (Esc)"
        >
          &times;
        </button>
      </div>

      {/* Tags */}
      {exhibit.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {exhibit.tags.map((tag) => (
            <span key={tag} style={{
              fontSize: '0.65rem',
              padding: '0.1rem 0.4rem',
              borderRadius: '3px',
              border: '1px solid #333',
              opacity: 0.5,
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Controls */}
      {exhibit.controls.length > 0 && (
        <>
          <div style={sectionHeaderStyle}>Controls</div>
          <PropPlayground
            controls={exhibit.controls}
            values={controlValues}
            onChange={onControlChange}
          />
        </>
      )}

      {/* Live Preview */}
      <div style={sectionHeaderStyle}>Live Preview</div>
      <div style={{
        background: '#0a0a0a',
        borderRadius: '6px',
        padding: '1rem',
        overflow: 'hidden',
      }}>
        <Preview {...renderProps} />
      </div>
    </div>
  );
}
