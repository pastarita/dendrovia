import * as THREE from 'three';

/**
 * PARTICLE SYSTEM (D6)
 *
 * CPU-based particle simulation with pooled allocation.
 * Renders via InstancedBufferGeometry with point sprites.
 *
 * Particle types:
 *   - ambient: fireflies drifting through the scene
 *   - burst: damage/encounter VFX at a specific position
 *   - trail: emitted from a moving source (future)
 *
 * The system respects the quality tier's maxParticles budget.
 * WebGPU compute shader path deferred to future iteration.
 */

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  /** Remaining lifetime in seconds */
  life: number;
  /** Total lifetime (for fade calculation) */
  maxLife: number;
  /** Size multiplier */
  size: number;
  /** Whether this slot is active */
  active: boolean;
}

export interface EmitterConfig {
  /** Number of particles to emit */
  count: number;
  /** Position to emit from */
  position: THREE.Vector3;
  /** Spread radius for initial positions */
  spread: number;
  /** Initial speed range [min, max] */
  speed: [number, number];
  /** Lifetime range in seconds [min, max] */
  lifetime: [number, number];
  /** Size range [min, max] */
  size: [number, number];
  /** Color for particles */
  color: THREE.Color;
  /** Gravity vector (default: slight upward drift) */
  gravity?: THREE.Vector3;
}

/** Default ambient firefly config */
export const FIREFLY_CONFIG: Omit<EmitterConfig, 'position'> = {
  count: 1,
  spread: 0.5,
  speed: [0.02, 0.08],
  lifetime: [4, 8],
  size: [0.03, 0.08],
  color: new THREE.Color('#00ffcc'),
  gravity: new THREE.Vector3(0, 0.01, 0),
};

/** Default burst config for damage/encounter VFX */
export const BURST_CONFIG: Omit<EmitterConfig, 'position'> = {
  count: 15,
  spread: 0.3,
  speed: [0.5, 1.5],
  lifetime: [0.3, 0.8],
  size: [0.04, 0.12],
  color: new THREE.Color('#ff4444'),
};

// Temp vector for calculations
const _tmpVec = new THREE.Vector3();

export class ParticleSystem {
  private pool: Particle[] = [];
  private maxParticles: number;
  private _activeCount = 0;

  /** Position buffer for instanced rendering (x,y,z per particle) */
  readonly positions: Float32Array;
  /** Color buffer (r,g,b per particle) */
  readonly colors: Float32Array;
  /** Size+opacity buffer (size, opacity per particle) */
  readonly scales: Float32Array;
  /** Dirty flag — set true when buffers updated, consumer resets */
  dirty = false;

  constructor(maxParticles: number) {
    this.maxParticles = maxParticles;
    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.scales = new Float32Array(maxParticles * 2);

    // Pre-allocate pool
    for (let i = 0; i < maxParticles; i++) {
      this.pool.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        life: 0,
        maxLife: 1,
        size: 0.05,
        active: false,
      });
    }
  }

  get activeCount(): number {
    return this._activeCount;
  }

  /**
   * Emit particles according to config.
   * Activates dormant particles from the pool.
   */
  emit(config: EmitterConfig): void {
    let emitted = 0;
    for (let i = 0; i < this.pool.length && emitted < config.count; i++) {
      const p = this.pool[i]!;
      if (p.active) continue;

      // Random position within spread sphere
      _tmpVec.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ).normalize().multiplyScalar(Math.random() * config.spread);

      p.position.copy(config.position).add(_tmpVec);

      // Random velocity in random direction
      const speed = config.speed[0] + Math.random() * (config.speed[1] - config.speed[0]);
      p.velocity.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ).normalize().multiplyScalar(speed);

      if (config.gravity) {
        p.velocity.add(config.gravity);
      }

      p.life = config.lifetime[0] + Math.random() * (config.lifetime[1] - config.lifetime[0]);
      p.maxLife = p.life;
      p.size = config.size[0] + Math.random() * (config.size[1] - config.size[0]);
      p.color.copy(config.color);
      p.active = true;
      emitted++;
    }
  }

  /**
   * Emit a burst of particles at a position (convenience wrapper).
   */
  burst(position: THREE.Vector3, config?: Partial<Omit<EmitterConfig, 'position'>>): void {
    this.emit({
      ...BURST_CONFIG,
      ...config,
      position,
      count: config?.count ?? BURST_CONFIG.count,
      spread: config?.spread ?? BURST_CONFIG.spread,
      speed: config?.speed ?? BURST_CONFIG.speed,
      lifetime: config?.lifetime ?? BURST_CONFIG.lifetime,
      size: config?.size ?? BURST_CONFIG.size,
      color: config?.color ?? BURST_CONFIG.color,
    });
  }

  /**
   * Update all active particles. Call once per frame with delta time.
   * Writes updated positions/colors/scales into typed arrays for rendering.
   */
  update(deltaTime: number): void {
    let writeIdx = 0;

    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i]!;
      if (!p.active) continue;

      // Age particle
      p.life -= deltaTime;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      // Integrate velocity
      p.position.addScaledVector(p.velocity, deltaTime);

      // Slight upward drift for ambient particles
      p.velocity.y += 0.005 * deltaTime;

      // Damping
      p.velocity.multiplyScalar(0.995);

      // Fade based on remaining life
      const lifeFraction = p.life / p.maxLife;
      const opacity = lifeFraction < 0.3
        ? lifeFraction / 0.3         // Fade in first 30%
        : lifeFraction > 0.7
          ? (1 - lifeFraction) / 0.3 // Fade out last 30%
          : 1;                        // Full opacity in middle

      // Write to buffers
      const p3 = writeIdx * 3;
      this.positions[p3] = p.position.x;
      this.positions[p3 + 1] = p.position.y;
      this.positions[p3 + 2] = p.position.z;

      this.colors[p3] = p.color.r;
      this.colors[p3 + 1] = p.color.g;
      this.colors[p3 + 2] = p.color.b;

      const s2 = writeIdx * 2;
      this.scales[s2] = p.size;
      this.scales[s2 + 1] = opacity;

      writeIdx++;
    }

    this._activeCount = writeIdx;

    // Zero out remaining buffer positions (prevent ghost particles)
    for (let i = writeIdx * 3; i < Math.min((writeIdx + 1) * 3, this.positions.length); i++) {
      this.positions[i] = 0;
    }

    this.dirty = true;
  }

  /**
   * Spawn ambient firefly particles within a bounding box.
   * Call periodically (e.g., every 0.5s) to maintain a steady population.
   */
  spawnAmbient(bounds: THREE.Box3, color?: THREE.Color): void {
    // Only spawn if we have headroom
    if (this._activeCount >= this.maxParticles * 0.8) return;

    const center = new THREE.Vector3();
    bounds.getCenter(center);
    const size = new THREE.Vector3();
    bounds.getSize(size);

    // Random position within bounds
    const pos = new THREE.Vector3(
      center.x + (Math.random() - 0.5) * size.x,
      center.y + (Math.random() - 0.5) * size.y,
      center.z + (Math.random() - 0.5) * size.z,
    );

    this.emit({
      ...FIREFLY_CONFIG,
      position: pos,
      color: color ?? FIREFLY_CONFIG.color,
    });
  }

  /** Reset all particles (e.g., on scene change) */
  clear(): void {
    for (const p of this.pool) {
      p.active = false;
    }
    this._activeCount = 0;
    this.dirty = true;
  }
}
