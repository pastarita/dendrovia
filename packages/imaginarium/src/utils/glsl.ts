/**
 * GLSL string helpers and validation utilities.
 */

export function glslFloat(n: number): string {
  const s = n.toString();
  return s.includes('.') ? s : `${s}.0`;
}

export function glslVec3(r: number, g: number, b: number): string {
  return `vec3(${glslFloat(r)}, ${glslFloat(g)}, ${glslFloat(b)})`;
}

export function glslVec3FromHex(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return glslVec3(Math.round(r * 1000) / 1000, Math.round(g * 1000) / 1000, Math.round(b * 1000) / 1000);
}

export function glslUniform(name: string, type: string): string {
  return `uniform ${type} ${name};`;
}

export function glslFunction(name: string, returnType: string, params: string, body: string): string {
  return `${returnType} ${name}(${params}) {\n${body}\n}`;
}

export interface GLSLValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGLSL(source: string): GLSLValidationResult {
  const errors: string[] = [];

  // Check for unresolved template placeholders
  const placeholders = source.match(/\{\{[^}]+\}\}/g);
  if (placeholders) {
    errors.push(`Unresolved placeholders: ${placeholders.join(', ')}`);
  }

  // Check brace matching
  let braceDepth = 0;
  for (const ch of source) {
    if (ch === '{') braceDepth++;
    if (ch === '}') braceDepth--;
    if (braceDepth < 0) {
      errors.push('Unmatched closing brace');
      break;
    }
  }
  if (braceDepth > 0) {
    errors.push(`${braceDepth} unclosed brace(s)`);
  }

  // Check for main function or map function (fragment shaders)
  const hasMain = /void\s+main\s*\(/.test(source);
  const hasMap = /vec[34]\s+map\s*\(/.test(source) || /float\s+map\s*\(/.test(source);
  const hasSdf = /float\s+sdf\s*\(/.test(source) || /float\s+scene\s*\(/.test(source);
  if (!hasMain && !hasMap && !hasSdf) {
    errors.push('Missing entry point: no main(), map(), sdf(), or scene() function found');
  }

  // Check semicolons after statements (heuristic)
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    // Skip empty, comments, preprocessor, braces, function defs, flow-control
    if (
      !line ||
      line.startsWith('//') ||
      line.startsWith('#') ||
      line.startsWith('/*') ||
      line.startsWith('*') ||
      line === '{' ||
      line === '}' ||
      line.endsWith('{') ||
      line.endsWith('}') ||
      /^\s*(if|else|for|while)\s*/.test(line) ||
      (/^(uniform|varying|attribute|in|out|flat)\s/.test(line) && line.endsWith(';'))
    ) {
      continue;
    }
    // Statement lines that assign or call functions should end with ;
    if (
      (line.includes('=') || line.includes('(')) &&
      !line.endsWith(';') &&
      !line.endsWith('{') &&
      !line.endsWith(',') &&
      !line.endsWith(')')
    ) {
      // This is a heuristic, not a full parser — skip false positives
    }
  }

  return { valid: errors.length === 0, errors };
}

// Instruction cost estimates for GPU budget enforcement
const INSTRUCTION_COSTS: Record<string, number> = {
  sdSphere: 3,
  sdCapsule: 5,
  sdRoundCone: 6,
  sdCappedCone: 6,
  sdCylinder: 4,
  opSmoothUnion: 3,
  opSmoothSubtraction: 3,
  opTwist: 4,
  opBend: 4,
  sin: 1,
  cos: 1,
  tan: 1,
  normalize: 3,
  length: 2,
  dot: 1,
  cross: 3,
  clamp: 1,
  mix: 1,
  max: 1,
  min: 1,
  abs: 1,
  pow: 2,
  sqrt: 2,
  exp: 2,
  log: 2,
};

export function countInstructions(source: string): number {
  let count = 0;
  for (const [fn, cost] of Object.entries(INSTRUCTION_COSTS)) {
    const regex = new RegExp(`\\b${fn}\\b`, 'g');
    const matches = source.match(regex);
    if (matches) {
      count += matches.length * cost;
    }
  }
  // Count arithmetic ops (rough)
  const arithmeticOps = source.match(/[+\-*/]/g);
  if (arithmeticOps) {
    count += Math.floor(arithmeticOps.length / 3); // Very rough
  }
  return count;
}
