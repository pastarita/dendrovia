'use client';

/**
 * PrimitivesZooClient — Builds a ZooPageConfig from the exhibit
 * registry and renders <ZooShell> for the primitives gallery.
 */

import { ZooShell } from '../_zoo-kit';
import type { ZooPageConfig } from '../_zoo-kit';
import { EXHIBIT_REGISTRY, CATEGORIES, SORT_DIMENSIONS } from './exhibits';

const CONFIG: ZooPageConfig = {
  title: 'Primitives Gallery',
  subtitle: 'Every OCULUS primitive — navigable, sortable, inspectable',
  icon: '🧩',
  backHref: '/',
  backLabel: 'OCULUS',
  categories: CATEGORIES,
  sortDimensions: SORT_DIMENSIONS,
  exhibits: EXHIBIT_REGISTRY,
  defaultView: 'grid',
};

export function PrimitivesZooClient() {
  return <ZooShell config={CONFIG} />;
}
