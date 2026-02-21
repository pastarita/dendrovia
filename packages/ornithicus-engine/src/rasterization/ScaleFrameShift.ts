/**
 * ScaleFrameShift
 *
 * Transforms the camera and scene framing from humanoid-scale (default
 * Dendrovia perspective) to bird-scale for Ornithicus's aerial viewpoint.
 */

export interface FrameShiftConfig {
  /** Scale multiplier for the perspective transform */
  scaleFactor: number;
  /** Vertical offset for the bird's eye origin */
  altitudeOffset: number;
}

export class ScaleFrameShift {
  private config: FrameShiftConfig;

  constructor(config?: Partial<FrameShiftConfig>) {
    this.config = {
      scaleFactor: config?.scaleFactor ?? 0.1,
      altitudeOffset: config?.altitudeOffset ?? 50,
    };
  }

  getConfig(): FrameShiftConfig {
    return { ...this.config };
  }
}
