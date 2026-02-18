/**
 * Zoo Kit — Shared types for zoo page layouts.
 *
 * Every zoo page (primitives, frames, views, etc.) can declare its
 * exhibits as ZooExhibitDescriptor[] and pass a ZooPageConfig to
 * ZooShell for a consistent filtered / sorted / inspectable grid.
 */

import type { ComponentType } from 'react';

// ── View & Layout ────────────────────────────────────

export type ZooViewMode = 'grid' | 'list';

// ── Categories & Sorting ─────────────────────────────

export interface ZooCategory {
  id: string;
  label: string;
  icon: string;
}

export interface ZooSortDimension {
  id: string;
  label: string;
  /** Extract comparable value from a descriptor */
  accessor: (d: ZooExhibitDescriptor) => string | number;
}

// ── Prop Controls ────────────────────────────────────

export type PropControl =
  | { type: 'boolean'; key: string; label: string; defaultValue: boolean }
  | { type: 'range'; key: string; label: string; min: number; max: number; step?: number; defaultValue: number }
  | { type: 'select'; key: string; label: string; options: readonly string[]; defaultValue: string }
  | { type: 'text'; key: string; label: string; defaultValue: string }
  | { type: 'color'; key: string; label: string; defaultValue: string };

// ── Exhibit Descriptor ───────────────────────────────

export interface ExhibitRenderProps {
  controlValues: Record<string, unknown>;
  isInspecting: boolean;
}

export interface ZooExhibitDescriptor {
  /** URL hash anchor + key (e.g. "panel", "progress-bar") */
  id: string;
  name: string;
  icon: string;
  /** Must match a ZooCategory.id */
  category: string;
  description: string;
  propCount: number;
  /** 1-5 for sorting */
  complexity: number;
  tags: string[];
  component: ComponentType<ExhibitRenderProps>;
  controls: PropControl[];
}

// ── Page Config ──────────────────────────────────────

export interface ZooPageConfig {
  title: string;
  subtitle: string;
  icon: string;
  backHref: string;
  backLabel: string;
  categories: ZooCategory[];
  sortDimensions: ZooSortDimension[];
  exhibits: ZooExhibitDescriptor[];
  defaultView?: ZooViewMode;
}
