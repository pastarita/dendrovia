/**
 * Minimal WebGPU type declarations for navigator.gpu detection.
 * Full WebGPU types available via @webgpu/types when needed.
 */

interface GPUAdapter {
  readonly limits: GPUSupportedLimits;
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
}

interface GPUSupportedLimits {
  readonly maxTextureDimension2D: number;
  readonly maxBufferSize: bigint | number;
}

interface GPUDeviceDescriptor {
  requiredFeatures?: string[];
  requiredLimits?: Record<string, number>;
}

interface GPUDevice {
  readonly limits: GPUSupportedLimits;
}

interface GPURequestAdapterOptions {
  powerPreference?: 'low-power' | 'high-performance';
}

interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
}

interface Navigator {
  readonly gpu?: GPU;
}
