'use client';

/**
 * ZooExhibitCard — Card wrapper for exhibit grid / list items.
 *
 * Shows: icon, name, category badge, description, preview,
 * and prop count. Eats its own cooking by wrapping in <Panel>.
 */

import type { ExhibitRenderProps, ZooExhibitDescriptor, ZooViewMode } from './types';
import { cardStyle, categoryBadgeStyle, listRowStyle } from './zoo-styles';

interface ZooExhibitCardProps {
  exhibit: ZooExhibitDescriptor;
  selected: boolean;
  onClick: () => void;
  viewMode: ZooViewMode;
  controlValues: Record<string, unknown>;
}

export function ZooExhibitCard({ exhibit, selected, onClick, viewMode, controlValues }: ZooExhibitCardProps) {
  const Preview = exhibit.component;
  const renderProps: ExhibitRenderProps = { controlValues, isInspecting: false };

  if (viewMode === 'list') {
    return (
      <div
        role="button"
        tabIndex={0}
        style={listRowStyle(selected)}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onClick();
        }}
      >
        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{exhibit.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{exhibit.name}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{exhibit.description}</div>
        </div>
        <span style={categoryBadgeStyle()}>{exhibit.category}</span>
        <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>{exhibit.propCount} props</span>
      </div>
    );
  }

  // Grid card
  return (
    <div
      role="button"
      tabIndex={0}
      style={cardStyle(selected)}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick();
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.25rem' }}>{exhibit.icon}</span>
        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{exhibit.name}</span>
      </div>

      {/* Preview area */}
      <div
        style={{
          background: '#0a0a0a',
          borderRadius: '6px',
          padding: '0.75rem',
          marginBottom: '0.5rem',
          minHeight: 60,
          overflow: 'hidden',
        }}
      >
        <Preview {...renderProps} />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={categoryBadgeStyle()}>{exhibit.category}</span>
        <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>{exhibit.propCount} props</span>
      </div>
    </div>
  );
}
