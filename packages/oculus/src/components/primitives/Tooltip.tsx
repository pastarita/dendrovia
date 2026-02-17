/**
 * Tooltip — Floating info popup anchored to an element
 */

import { type CSSProperties, type ReactNode, useRef, useState } from 'react';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const offsets: Record<string, CSSProperties> = {
  top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
  bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
  left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 },
  right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 },
};

export function Tooltip({ content, children, position = 'top', className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), 200);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  return (
    <span
      className={`oculus-tooltip-wrapper ${className}`}
      style={{ position: 'relative', display: 'inline-flex' }}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className="oculus-tooltip"
          style={{
            position: 'absolute',
            ...offsets[position],
            background: 'var(--oculus-bg-solid)',
            border: 'var(--oculus-panel-border)',
            borderRadius: 6,
            padding: 'var(--oculus-space-xs) var(--oculus-space-sm)',
            fontSize: 'var(--oculus-font-xs)',
            color: 'var(--oculus-text)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 'var(--oculus-z-modal)',
            animation: 'oculus-fade-in var(--oculus-transition-fast)',
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
