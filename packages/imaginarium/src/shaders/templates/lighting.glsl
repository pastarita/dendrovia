// ============================================================
// Lighting & Color Grading
// Blinn-Phong diffuse + specular, SDF-based AO, edge glow
// ============================================================

vec3 calcNormal(vec3 p) {
  const float h = 0.001;
  const vec2 k = vec2(1.0, -1.0);
  return normalize(
    k.xyy * scene(p + k.xyy * h) +
    k.yyx * scene(p + k.yyx * h) +
    k.yxy * scene(p + k.yxy * h) +
    k.xxx * scene(p + k.xxx * h)
  );
}

float calcAO(vec3 pos, vec3 nor) {
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float h = 0.01 + 0.12 * float(i) / 4.0;
    float d = scene(pos + h * nor);
    occ += (h - d) * sca;
    sca *= 0.95;
  }
  return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}

float calcSoftShadow(vec3 ro, vec3 rd, float tmin, float tmax) {
  float res = 1.0;
  float t = tmin;
  for (int i = 0; i < 16; i++) {
    float h = scene(ro + rd * t);
    res = min(res, 8.0 * h / t);
    t += clamp(h, 0.02, 0.10);
    if (res < 0.005 || t > tmax) break;
  }
  return clamp(res, 0.0, 1.0);
}

vec3 applyLighting(vec3 pos, vec3 nor, vec3 rd, vec3 baseColor, vec3 glowColor) {
  // Light direction
  vec3 lig = normalize(vec3(0.6, 0.8, -0.5));

  // Diffuse (Lambert)
  float dif = clamp(dot(nor, lig), 0.0, 1.0);

  // Specular (Blinn-Phong)
  vec3 hal = normalize(lig - rd);
  float spe = pow(clamp(dot(nor, hal), 0.0, 1.0), 32.0);

  // Ambient occlusion
  float ao = calcAO(pos, nor);

  // Combine
  vec3 col = baseColor * (0.15 + 0.65 * dif * ao);
  col += spe * 0.3 * glowColor;

  // Edge glow (Fresnel-like)
  float fre = pow(1.0 - abs(dot(nor, -rd)), 3.0);
  col += fre * 0.4 * glowColor;

  return col;
}
