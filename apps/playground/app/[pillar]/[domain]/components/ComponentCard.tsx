'use client';

import { useState } from 'react';
import { OrnateFrame } from '@dendrovia/oculus';

export interface ComponentEntry {
  id: string;
  name: string;
  category: 'rendering' | 'camera' | 'effects' | 'systems';
  description: string;
  propsSignature: string;
  snippet: string;
}

interface ComponentCardProps {
  entry: ComponentEntry;
  selected: boolean;
  onSelect: () => void;
}

export function ComponentCard({ entry, selected, onSelect }: ComponentCardProps) {
  return (
    <OrnateFrame pillar="architectus" variant="compact" style={{ background: selected ? '#1a1a3e' : 'transparent', marginBottom: '0.35rem' }}>
      <button
        onClick={onSelect}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          background: 'transparent',
          color: '#ededed',
          border: 'none',
        }}
      >
        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{entry.name}</div>
        <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.15rem' }}>
          {entry.description}
        </div>
      </button>
    </OrnateFrame>
  );
}

// Info panel shown below the Canvas for the selected component
export function ComponentInfo({ entry }: { entry: ComponentEntry }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(entry.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <OrnateFrame pillar="architectus" variant="panel" style={{ background: '#111' }}>
      <div style={{
        fontFamily: 'var(--font-geist-mono), monospace',
        fontSize: '0.8rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ color: 'var(--pillar-accent)', fontWeight: 700 }}>{entry.name}</span>
            <span style={{ opacity: 0.4, marginLeft: '0.5rem', fontSize: '0.7rem' }}>{entry.category}</span>
          </div>
          <button
            onClick={handleCopy}
            style={{
              padding: '0.25rem 0.5rem',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: copied ? '#00ff66' : '#999',
              fontSize: '0.7rem',
              cursor: 'pointer',
            }}
          >
            {copied ? 'Copied!' : 'Copy snippet'}
          </button>
        </div>

        {/* Props */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4, marginBottom: '0.3rem' }}>
            Props
          </div>
          <pre style={{
            padding: '0.5rem',
            background: '#0a0a1e',
            border: '1px solid #1a1a3e',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            fontSize: '0.75rem',
            lineHeight: 1.5,
            color: '#aaccff',
          }}>
            {entry.propsSignature}
          </pre>
        </div>

        {/* Code snippet */}
        <div>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4, marginBottom: '0.3rem' }}>
            Usage
          </div>
          <pre style={{
            padding: '0.5rem',
            background: '#0a0a1e',
            border: '1px solid #1a1a3e',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            fontSize: '0.75rem',
            lineHeight: 1.5,
            color: '#ccddee',
          }}>
            {entry.snippet}
          </pre>
        </div>
      </div>
    </OrnateFrame>
  );
}
