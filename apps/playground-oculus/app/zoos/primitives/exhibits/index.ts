/**
 * Primitives Exhibit Registry
 *
 * Declares all 6 primitive exhibits with their categories,
 * controls, and metadata for ZooShell consumption.
 */

import type { ZooCategory, ZooExhibitDescriptor, ZooSortDimension } from '../../_zoo-kit/types';
import { IconBadgeExhibit } from './IconBadgeExhibit';
import { OrnateFrameExhibit } from './OrnateFrameExhibit';
import { PanelExhibit } from './PanelExhibit';
import { ProgressBarExhibit } from './ProgressBarExhibit';
import { StatLabelExhibit } from './StatLabelExhibit';
import { TooltipExhibit } from './TooltipExhibit';

// ── Categories ───────────────────────────────────────

export const CATEGORIES: ZooCategory[] = [
  { id: 'container', label: 'Container', icon: '📦' },
  { id: 'data-display', label: 'Data Display', icon: '📊' },
  { id: 'decoration', label: 'Decoration', icon: '✨' },
  { id: 'overlay', label: 'Overlay', icon: '🔲' },
];

// ── Sort Dimensions ──────────────────────────────────

export const SORT_DIMENSIONS: ZooSortDimension[] = [
  { id: 'name', label: 'Name', accessor: (d) => d.name },
  { id: 'complexity', label: 'Complexity', accessor: (d) => d.complexity },
  { id: 'props', label: 'Prop Count', accessor: (d) => d.propCount },
];

// ── Exhibit Registry ─────────────────────────────────

export const EXHIBIT_REGISTRY: ZooExhibitDescriptor[] = [
  {
    id: 'panel',
    name: 'Panel',
    icon: '📦',
    category: 'container',
    description: 'Glass-morphism container with optional glow and compact modes',
    propCount: 5,
    complexity: 1,
    tags: ['glass', 'container', 'layout'],
    component: PanelExhibit,
    controls: [
      { type: 'boolean', key: 'compact', label: 'compact', defaultValue: false },
      { type: 'boolean', key: 'glow', label: 'glow', defaultValue: false },
      { type: 'boolean', key: 'noPadding', label: 'noPadding', defaultValue: false },
    ],
  },
  {
    id: 'progress-bar',
    name: 'ProgressBar',
    icon: '📊',
    category: 'data-display',
    description: 'Animated value bar with 5 built-in variants and flash effect',
    propCount: 10,
    complexity: 3,
    tags: ['bar', 'health', 'mana', 'xp', 'animated'],
    component: ProgressBarExhibit,
    controls: [
      { type: 'range', key: 'value', label: 'Value', min: 0, max: 100, defaultValue: 75 },
      { type: 'range', key: 'max', label: 'Max', min: 1, max: 200, defaultValue: 100 },
      {
        type: 'select',
        key: 'variant',
        label: 'Variant',
        options: ['health', 'mana', 'xp', 'quest', 'custom'] as const,
        defaultValue: 'health',
      },
      { type: 'range', key: 'height', label: 'Height', min: 4, max: 24, defaultValue: 8 },
      { type: 'boolean', key: 'flash', label: 'flash', defaultValue: false },
    ],
  },
  {
    id: 'icon-badge',
    name: 'IconBadge',
    icon: '✨',
    category: 'decoration',
    description: 'Circular icon badge in 3 sizes with color customization',
    propCount: 4,
    complexity: 1,
    tags: ['badge', 'icon', 'circular'],
    component: IconBadgeExhibit,
    controls: [
      { type: 'text', key: 'icon', label: 'Icon', defaultValue: '🗡️' },
      { type: 'select', key: 'size', label: 'Size', options: ['sm', 'md', 'lg'] as const, defaultValue: 'md' },
      { type: 'color', key: 'color', label: 'Color', defaultValue: '#f5a97f' },
    ],
  },
  {
    id: 'stat-label',
    name: 'StatLabel',
    icon: '📋',
    category: 'data-display',
    description: 'Key-value label pair for stat displays with colored values',
    propCount: 3,
    complexity: 1,
    tags: ['stat', 'label', 'key-value'],
    component: StatLabelExhibit,
    controls: [
      { type: 'text', key: 'label', label: 'Label', defaultValue: 'Level' },
      { type: 'text', key: 'value', label: 'Value', defaultValue: '42' },
      { type: 'color', key: 'color', label: 'Color', defaultValue: '#f5a97f' },
    ],
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    icon: '💬',
    category: 'overlay',
    description: 'Hover tooltip with 4 position options and fade animation',
    propCount: 2,
    complexity: 2,
    tags: ['tooltip', 'hover', 'overlay', 'positioned'],
    component: TooltipExhibit,
    controls: [
      { type: 'text', key: 'content', label: 'Content', defaultValue: 'Tooltip content' },
      {
        type: 'select',
        key: 'position',
        label: 'Position',
        options: ['top', 'bottom', 'left', 'right'] as const,
        defaultValue: 'top',
      },
    ],
  },
  {
    id: 'ornate-frame',
    name: 'OrnateFrame',
    icon: '🖼️',
    category: 'container',
    description: 'Pillar-themed decorative frame with SVG ornaments in 4 variants',
    propCount: 6,
    complexity: 5,
    tags: ['frame', 'ornate', 'pillar', 'svg', 'decorative'],
    component: OrnateFrameExhibit,
    controls: [
      {
        type: 'select',
        key: 'pillar',
        label: 'Pillar',
        options: ['oculus', 'chronos', 'architectus', 'ludus', 'imaginarium', 'operatus'] as const,
        defaultValue: 'oculus',
      },
      {
        type: 'select',
        key: 'variant',
        label: 'Variant',
        options: ['modal', 'panel', 'compact', 'tooltip'] as const,
        defaultValue: 'panel',
      },
      { type: 'text', key: 'header', label: 'Header', defaultValue: 'Frame Title' },
    ],
  },
];
