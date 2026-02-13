/**
 * IconBadge — Small badge with icon and optional tooltip
 */

import React from 'react';

export interface IconBadgeProps {
  icon: string;
  label?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 20, md: 28, lg: 36 };
const fontSizes = { sm: 10, md: 14, lg: 18 };

export function IconBadge({
  icon,
  label,
  color = 'var(--oculus-amber)',
  size = 'md',
  className = '',
}: IconBadgeProps) {
  const px = sizes[size];
  const fs = fontSizes[size];

  return (
    <span
      className={`oculus-icon-badge ${className}`}
      title={label}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: px,
        height: px,
        borderRadius: '50%',
        background: `color-mix(in srgb, ${color} 20%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
        fontSize: fs,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {icon}
    </span>
  );
}
