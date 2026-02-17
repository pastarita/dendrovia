/**
 * ProgressBar — Animated fill bar for health, mana, XP, quest progress
 */

import { type CSSProperties, useEffect, useRef } from 'react';

export type ProgressBarVariant = 'health' | 'mana' | 'xp' | 'quest' | 'custom';

const variantColors: Record<Exclude<ProgressBarVariant, 'custom'>, string> = {
  health: 'var(--oculus-health)',
  mana: 'var(--oculus-mana)',
  xp: 'var(--oculus-xp)',
  quest: 'var(--oculus-amber)',
};

const variantBgColors: Record<Exclude<ProgressBarVariant, 'custom'>, string> = {
  health: 'var(--oculus-health-bg)',
  mana: 'var(--oculus-mana-bg)',
  xp: 'var(--oculus-xp-bg)',
  quest: 'rgba(245, 169, 127, 0.15)',
};

export interface ProgressBarProps {
  value: number;
  max: number;
  variant?: ProgressBarVariant;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  label?: string;
  height?: number;
  flash?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max,
  variant = 'health',
  color,
  bgColor,
  showLabel = false,
  label,
  height = 8,
  flash = false,
  className = '',
}: ProgressBarProps) {
  const fillRef = useRef<HTMLDivElement>(null);
  const prevValue = useRef(value);

  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const fillColor = color || (variant !== 'custom' ? variantColors[variant] : 'var(--oculus-amber)');
  const trackColor = bgColor || (variant !== 'custom' ? variantBgColors[variant] : 'rgba(245, 169, 127, 0.15)');

  // Flash on decrease
  useEffect(() => {
    if (flash && value < prevValue.current && fillRef.current) {
      fillRef.current.style.animation = 'none';
      // Force reflow
      void fillRef.current.offsetHeight;
      fillRef.current.style.animation = 'oculus-damage-flash 300ms ease-out';
    }
    prevValue.current = value;
  }, [value, flash]);

  const containerStyle: CSSProperties = {
    position: 'relative',
    height,
    borderRadius: height / 2,
    background: trackColor,
    overflow: 'hidden',
  };

  const fillStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: `${pct}%`,
    background: fillColor,
    borderRadius: height / 2,
    transition: 'width var(--oculus-transition-base)',
  };

  const displayLabel = label ?? `${Math.round(value)} / ${Math.round(max)}`;

  return (
    <div
      className={`oculus-progress ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label || `${variant} progress`}
    >
      <div style={containerStyle}>
        <div ref={fillRef} style={fillStyle} />
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: 'var(--oculus-font-xs)',
            color: 'var(--oculus-text-muted)',
            marginTop: 2,
            display: 'block',
          }}
        >
          {displayLabel}
        </span>
      )}
    </div>
  );
}
