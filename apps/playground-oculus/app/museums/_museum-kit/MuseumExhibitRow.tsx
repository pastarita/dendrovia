'use client';

/**
 * MuseumExhibitRow — Clickable row item in the exhibit list.
 *
 * Shows a color dot, name, inline badges, and optional metadata.
 */

import { badgeStyle, dotStyle, exhibitRowStyle } from './museum-styles';
import type { MuseumExhibitDescriptor } from './types';

interface MuseumExhibitRowProps {
  exhibit: MuseumExhibitDescriptor;
  selected: boolean;
  onClick: () => void;
}

export function MuseumExhibitRow({ exhibit, selected, onClick }: MuseumExhibitRowProps) {
  return (
    <button onClick={onClick} style={exhibitRowStyle(selected)}>
      <span style={dotStyle(exhibit.dotColor)} />
      <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: '0.8rem', flex: 1 }}>
        {exhibit.name}
      </span>
      {exhibit.badges.map((b) => (
        <span key={b.label} style={badgeStyle(b.color)}>
          {b.label}
        </span>
      ))}
    </button>
  );
}
