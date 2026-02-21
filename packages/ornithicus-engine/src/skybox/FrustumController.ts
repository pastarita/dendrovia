/**
 * FrustumController
 *
 * Manages the view frustum and concentric dome layers for the
 * Ornithicus skybox. Provides LOD-aware culling for the tree canopy.
 */

export interface DomeLayer {
  radius: number;
  opacity: number;
  label: string;
}

export class FrustumController {
  private layers: DomeLayer[] = [];

  addLayer(layer: DomeLayer): void {
    this.layers.push(layer);
  }

  getLayers(): readonly DomeLayer[] {
    return this.layers;
  }
}
