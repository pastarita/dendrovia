'use client';

/**
 * ShaderViewport — WebGL2 canvas for SDF raymarching preview.
 *
 * IMAGINARIUM's signature component. No other pillar renders shaders.
 * Takes a GLSL scene function and palette colors, renders them on a
 * fullscreen quad with a raymarching fragment shader.
 *
 * Features:
 * - Orbiting camera with slow rotation
 * - Height-based palette coloring
 * - Rim lighting with glow color
 * - Fog for depth
 * - Graceful fallback to GLSL code display on WebGL2 failure
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  viewportStyle,
  viewportCanvasStyle,
  viewportOverlayStyle,
  viewportErrorStyle,
  viewportWatermarkStyle,
  glslBlockStyle,
} from './distill-styles';

// ── Props ─────────────────────────────────────────────

interface ShaderViewportProps {
  /** GLSL scene function body (must define `float scene(vec3 p)`) */
  sceneSDF?: string;
  /** Palette colors as hex strings */
  palette?: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
  };
  /** Viewport height CSS value */
  height?: string;
  /** Force code display mode instead of WebGL rendering */
  codeMode?: boolean;
}

// ── Default scene (binary-branch dendrite) ────────────

const DEFAULT_SCENE = `float scene(vec3 p) {
  float trunk = sdCapsule(p, vec3(0.0, 0.0, 0.0), vec3(0.0, 3.0, 0.0), 0.25);
  float b1 = sdCapsule(p, vec3(0.0, 2.5, 0.0), vec3(1.5, 4.5, 0.5), 0.15);
  float b2 = sdCapsule(p, vec3(0.0, 2.5, 0.0), vec3(-1.2, 4.0, -0.3), 0.15);
  float b3 = sdCapsule(p, vec3(0.0, 3.5, 0.0), vec3(0.8, 5.5, -0.5), 0.1);
  float d = opSmoothUnion(trunk, b1, 0.3);
  d = opSmoothUnion(d, b2, 0.3);
  d = opSmoothUnion(d, b3, 0.25);
  return d;
}`;

const DEFAULT_PALETTE = {
  primary: '#8b5cf6',
  secondary: '#6d28d9',
  accent: '#a78bfa',
  glow: '#7c3aed',
};

// ── GLSL Shader Templates ─────────────────────────────

const VERTEX_SRC = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

function buildFragmentSrc(sceneSDF: string, palette: typeof DEFAULT_PALETTE): string {
  const p = hexToVec3(palette.primary);
  const s = hexToVec3(palette.secondary);
  const a = hexToVec3(palette.accent);
  const g = hexToVec3(palette.glow);

  return `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;

out vec4 fragColor;

// ── SDF Primitives ────────────────────────────────
float sdSphere(vec3 p, float r) { return length(p) - r; }

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float sdCylinder(vec3 p, float h, float r) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdRoundCone(vec3 p, float r1, float r2, float h) {
  vec2 q = vec2(length(p.xz), p.y);
  float b = (r1 - r2) / h;
  float a2 = sqrt(1.0 - b * b);
  float k = dot(q, vec2(-b, a2));
  if (k < 0.0) return length(q) - r1;
  if (k > a2 * h) return length(q - vec2(0.0, h)) - r2;
  return dot(q, vec2(a2, b)) - r1;
}

float opSmoothUnion(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

float opSmoothSubtraction(float d1, float d2, float k) {
  float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
  return mix(d2, -d1, h) + k * h * (1.0 - h);
}

vec3 opTwist(vec3 p, float k) {
  float c = cos(k * p.y);
  float s2 = sin(k * p.y);
  mat2 m = mat2(c, -s2, s2, c);
  return vec3(m * p.xz, p.y);
}

// ── Scene ─────────────────────────────────────────
${sceneSDF}

// ── Raymarching ───────────────────────────────────
vec3 calcNormal(vec3 p) {
  float e = 0.001;
  return normalize(vec3(
    scene(p + vec3(e, 0, 0)) - scene(p - vec3(e, 0, 0)),
    scene(p + vec3(0, e, 0)) - scene(p - vec3(0, e, 0)),
    scene(p + vec3(0, 0, e)) - scene(p - vec3(0, 0, e))
  ));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);

  // Orbiting camera
  float camDist = 12.0;
  float angle = uTime * 0.15;
  vec3 ro = vec3(camDist * sin(angle), 4.0, camDist * cos(angle));
  vec3 target = vec3(0.0, 2.5, 0.0);
  vec3 fwd = normalize(target - ro);
  vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, fwd);
  vec3 rd = normalize(fwd + uv.x * right + uv.y * up);

  // March
  float t = 0.0;
  float d = 0.0;
  for (int i = 0; i < 80; i++) {
    d = scene(ro + rd * t);
    if (d < 0.001 || t > 50.0) break;
    t += d;
  }

  // Background
  vec3 col = vec3(0.02, 0.01, 0.04);

  if (d < 0.001) {
    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);

    // Lighting
    vec3 lightDir = normalize(vec3(1.0, 2.0, 1.5));
    float diff = max(dot(n, lightDir), 0.0);
    float amb = 0.15;

    // Palette
    vec3 cPrimary = ${p};
    vec3 cSecondary = ${s};
    vec3 cAccent = ${a};
    vec3 cGlow = ${g};

    // Height-based palette blending
    float h = clamp(p.y / 6.0, 0.0, 1.0);
    vec3 baseCol;
    if (h < 0.33) baseCol = mix(cPrimary, cSecondary, h * 3.0);
    else if (h < 0.66) baseCol = mix(cSecondary, cAccent, (h - 0.33) * 3.0);
    else baseCol = mix(cAccent, cGlow, (h - 0.66) * 3.0);

    col = baseCol * (amb + diff * 0.85);

    // Rim light
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    col += cGlow * rim * 0.4;

    // Fog
    float fog = 1.0 - exp(-t * 0.04);
    col = mix(col, vec3(0.02, 0.01, 0.04), fog);
  }

  // Gamma correction
  col = pow(col, vec3(1.0 / 2.2));

  fragColor = vec4(col, 1.0);
}`;
}

function hexToVec3(hex: string): string {
  const h = hex.replace('#', '');
  const r = (parseInt(h.substring(0, 2), 16) / 255).toFixed(3);
  const g = (parseInt(h.substring(2, 4), 16) / 255).toFixed(3);
  const b = (parseInt(h.substring(4, 6), 16) / 255).toFixed(3);
  return `vec3(${r}, ${g}, ${b})`;
}

// ── WebGL Helpers ─────────────────────────────────────

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | string {
  const shader = gl.createShader(type);
  if (!shader) return 'Failed to create shader';
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'Unknown error';
    gl.deleteShader(shader);
    return log;
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | string {
  const program = gl.createProgram();
  if (!program) return 'Failed to create program';
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'Unknown error';
    gl.deleteProgram(program);
    return log;
  }
  return program;
}

// ── Component ─────────────────────────────────────────

export function ShaderViewport({
  sceneSDF,
  palette,
  height,
  codeMode = false,
}: ShaderViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const fpsRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(0);

  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [webglSupported, setWebglSupported] = useState(true);

  const scene = sceneSDF ?? DEFAULT_SCENE;
  const pal = palette ?? DEFAULT_PALETTE;

  // Build and compile shader program
  const buildProgram = useCallback((gl: WebGL2RenderingContext, sceneSrc: string, palColors: typeof DEFAULT_PALETTE) => {
    // Clean up old program
    if (programRef.current) {
      gl.deleteProgram(programRef.current);
      programRef.current = null;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    if (typeof vs === 'string') {
      setError(`Vertex shader: ${vs}`);
      return null;
    }

    const fragSrc = buildFragmentSrc(sceneSrc, palColors);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (typeof fs === 'string') {
      gl.deleteShader(vs);
      setError(`Fragment shader: ${fs}`);
      return null;
    }

    const prog = createProgram(gl, vs, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (typeof prog === 'string') {
      setError(`Link: ${prog}`);
      return null;
    }

    setError(null);
    programRef.current = prog;
    return prog;
  }, []);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || codeMode) return;

    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) {
      setWebglSupported(false);
      return;
    }
    glRef.current = gl;

    // Fullscreen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    startTimeRef.current = performance.now();
    lastFpsTimeRef.current = performance.now();

    // Render loop
    const render = () => {
      if (!glRef.current || !programRef.current) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const now = performance.now();
      const time = (now - startTimeRef.current) / 1000;

      // FPS calculation
      frameCountRef.current++;
      if (now - lastFpsTimeRef.current >= 1000) {
        fpsRef.current = frameCountRef.current;
        setFps(fpsRef.current);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(programRef.current);

      // Set uniforms
      const uTime = gl.getUniformLocation(programRef.current, 'uTime');
      const uResolution = gl.getUniformLocation(programRef.current, 'uResolution');
      gl.uniform1f(uTime, time);
      gl.uniform2f(uResolution, canvas.width, canvas.height);

      // Bind position attribute
      const aPos = gl.getAttribLocation(programRef.current, 'aPosition');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (programRef.current) gl.deleteProgram(programRef.current);
      if (buffer) gl.deleteBuffer(buffer);
      programRef.current = null;
      glRef.current = null;
    };
  }, [codeMode]);

  // Recompile on scene/palette change
  useEffect(() => {
    if (!glRef.current || codeMode) return;
    buildProgram(glRef.current, scene, pal);
  }, [scene, pal, buildProgram, codeMode]);

  // Code mode or WebGL not supported
  if (codeMode || !webglSupported) {
    return (
      <div style={viewportStyle(height)}>
        <div style={viewportWatermarkStyle}>{'\u{1F3A8}'}</div>
        <div style={{ position: 'absolute', inset: '1rem', overflow: 'auto' }}>
          {!webglSupported && (
            <div style={{ color: '#EF4444', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              WebGL2 not available — showing GLSL source
            </div>
          )}
          <div style={glslBlockStyle}>{scene}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={viewportStyle(height)}>
      <canvas ref={canvasRef} style={viewportCanvasStyle} />

      {error && (
        <div style={viewportErrorStyle}>
          <div style={{ fontSize: '2rem' }}>{'\u26A0\uFE0F'}</div>
          <div style={{ fontFamily: 'var(--font-geist-mono, monospace)', maxWidth: 400, fontSize: '0.7rem', opacity: 0.8 }}>
            {error}
          </div>
          <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>Shader compilation failed</div>
        </div>
      )}

      <div style={viewportOverlayStyle}>
        {fps > 0 && <span>{fps} fps</span>}
        <span>WebGL2</span>
      </div>
    </div>
  );
}
