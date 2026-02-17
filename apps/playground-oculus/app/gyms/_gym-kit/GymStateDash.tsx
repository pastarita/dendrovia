'use client';

/**
 * GymStateDash — Live Zustand store snapshot panel.
 *
 * Reads selected keys from useOculusStore and renders them as
 * key-value pairs with change highlighting (brief amber flash
 * when a value changes).
 */

import { useOculusStore } from '@dendrovia/oculus';
import { useEffect, useRef, useState } from 'react';
import { stateDashContainerStyle, stateDashHeaderStyle, stateDashListStyle, stateDashRowStyle } from './gym-styles';

const DEFAULT_KEYS = ['health', 'maxHealth', 'mana', 'maxMana', 'level', 'experience', 'cameraMode', 'activePanel'];

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return `[${val.length} items]`;
  if (typeof val === 'object') {
    const keys = Object.keys(val as object);
    return `{${keys.length} keys}`;
  }
  return String(val);
}

interface GymStateDashProps {
  watchedKeys?: string[];
  collapsed?: boolean;
}

export function GymStateDash({ watchedKeys, collapsed = false }: GymStateDashProps) {
  const keys = watchedKeys ?? DEFAULT_KEYS;
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [changedKeys, setChangedKeys] = useState<Set<string>>(new Set());
  const prevRef = useRef<Record<string, string>>({});

  // Subscribe to store and read watched keys
  const storeValues: Record<string, string> = {};
  const storeState = useOculusStore();
  for (const key of keys) {
    storeValues[key] = formatValue((storeState as unknown as Record<string, unknown>)[key]);
  }

  // Detect changes and flash highlight
  useEffect(() => {
    const changed = new Set<string>();
    for (const key of keys) {
      if (prevRef.current[key] !== undefined && prevRef.current[key] !== storeValues[key]) {
        changed.add(key);
      }
    }
    prevRef.current = { ...storeValues };
    if (changed.size > 0) {
      setChangedKeys(changed);
      const timer = setTimeout(() => setChangedKeys(new Set()), 400);
      return () => clearTimeout(timer);
    }
  }, [keys, storeValues]);

  if (isCollapsed) {
    return (
      <div style={{ ...stateDashContainerStyle, cursor: 'pointer' }} onClick={() => setIsCollapsed(false)}>
        <div style={stateDashHeaderStyle}>
          <span>State</span>
          <span style={{ opacity: 0.4, fontSize: '0.7rem' }}>({keys.length} keys)</span>
          <span style={{ marginLeft: 'auto', opacity: 0.4 }}>+</span>
        </div>
      </div>
    );
  }

  return (
    <div style={stateDashContainerStyle}>
      <div style={stateDashHeaderStyle}>
        <span style={{ cursor: 'pointer' }} onClick={() => setIsCollapsed(true)}>
          State
        </span>
        <span style={{ opacity: 0.4, fontSize: '0.7rem' }}>({keys.length} keys)</span>
        <span
          style={{ marginLeft: 'auto', opacity: 0.4, cursor: 'pointer', fontSize: '0.8rem' }}
          onClick={() => setIsCollapsed(true)}
        >
          -
        </span>
      </div>
      <div style={stateDashListStyle}>
        {keys.map((key) => (
          <div key={key} style={stateDashRowStyle(changedKeys.has(key))}>
            <span style={{ opacity: 0.5 }}>{key}</span>
            <span style={{ fontWeight: changedKeys.has(key) ? 600 : 400 }}>{storeValues[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
