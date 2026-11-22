// SPDX-License-Identifier: AGPL-3.0-or-later
import type {
  RuntimeSpriteState,
  StageSettings,
  WebGL2RenderConfig,
} from '../types/project';

export const MAX_WEBGL2_LIGHTS = 16;
export const MAX_WEBGL2_OCCLUDERS = 32;

export const DEFAULT_WEBGL2_CONFIG: WebGL2RenderConfig = {
  backend: 'canvas2d',
  normalMapping: true,
  normalStrength: 1.6,
  hardwareShadows: true,
  shadowSoftness: 0.45,
  bloomEnabled: true,
  bloomThreshold: 0.58,
  bloomIntensity: 0.95,
  bloomRadius: 2.6,
};

export function normalizeWebGL2Config(cfg?: Partial<WebGL2RenderConfig>): WebGL2RenderConfig {
  const clamp = (v: number, min: number, max: number) =>
    Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;
  return {
    backend: cfg?.backend === 'webgl2' ? 'webgl2' : DEFAULT_WEBGL2_CONFIG.backend,
    normalMapping: cfg?.normalMapping ?? DEFAULT_WEBGL2_CONFIG.normalMapping,
    normalStrength: clamp(
      cfg?.normalStrength ?? DEFAULT_WEBGL2_CONFIG.normalStrength,
      0,
      3
    ),
    hardwareShadows: cfg?.hardwareShadows ?? DEFAULT_WEBGL2_CONFIG.hardwareShadows,
    shadowSoftness: clamp(
      cfg?.shadowSoftness ?? DEFAULT_WEBGL2_CONFIG.shadowSoftness,
      0,
      1
    ),
    bloomEnabled: cfg?.bloomEnabled ?? DEFAULT_WEBGL2_CONFIG.bloomEnabled,
    bloomThreshold: clamp(
      cfg?.bloomThreshold ?? DEFAULT_WEBGL2_CONFIG.bloomThreshold,
      0.15,
      0.95
    ),
    bloomIntensity: clamp(
      cfg?.bloomIntensity ?? DEFAULT_WEBGL2_CONFIG.bloomIntensity,
      0,
      2.5
    ),
    bloomRadius: clamp(
      cfg?.bloomRadius ?? DEFAULT_WEBGL2_CONFIG.bloomRadius,
      1,
      6
    ),
  };
}

export function hexToRgb01(hex: string): [number, number, number] {
  const clean = (hex || '').replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [0.22, 0.74, 0.97];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export interface PackedLightsData {
  count: number;
  /** vec4[MAX_WEBGL2_LIGHTS]: (glX, glY, radiusPx, intensity) */
  posRad: Float32Array;
  /** vec4[MAX_WEBGL2_LIGHTS]: (r, g, b, isSpot) */
  colorType: Float32Array;
  /** vec4[MAX_WEBGL2_LIGHTS]: (dirX, dirY, cosHalfCone, lightZ) */
  spotDir: Float32Array;
}

export interface PackedOccludersData {
  count: number;
  /** vec4[MAX_WEBGL2_OCCLUDERS]: (cxGl, cyGl, halfW, halfH) */
  boxes: Float32Array;
  /** vec2[MAX_WEBGL2_OCCLUDERS]: (cosA, sinA) */
  rotations: Float32Array;
}

/**
 * Packs dynamic lights into flat WebGL2 uniform Float32Arrays in GL pixel space (Y-up from bottom-left).
 */
export function packLightsUniformData(
  lights: RuntimeSpriteState[],
  toScreenX: (wx: number) => number,
  toScreenY: (wy: number) => number,
  camZoom: number,
  dpr: number,
  canvasHeightPx: number
): PackedLightsData {
  const posRad = new Float32Array(MAX_WEBGL2_LIGHTS * 4);
  const colorType = new Float32Array(MAX_WEBGL2_LIGHTS * 4);
  const spotDir = new Float32Array(MAX_WEBGL2_LIGHTS * 4);

  const count = Math.min(MAX_WEBGL2_LIGHTS, lights.length);
  for (let i = 0; i < count; i++) {
    const light = lights[i];
    const lx = toScreenX(light.x) * dpr;
    const ly = canvasHeightPx - toScreenY(light.y) * dpr;
    const radiusPx = Math.max(16 * dpr, light.light.radius * camZoom * dpr);
    const intensity = Math.max(0, Math.min(3, light.light.intensity));
    const [r, g, b] = hexToRgb01(light.light.color);
    const isSpot = light.light.type === 'spot' ? 1 : 0;

    // SparkCode world space and WebGL2 pixel space are both Y-up
    const dirRad = (light.rotation * Math.PI) / 180;
    const halfConeRad = (Math.max(5, Math.min(180, light.light.angle || 55)) * Math.PI) / 360;
    const lightZ = Math.max(24 * dpr, radiusPx * 0.28);

    const o4 = i * 4;
    posRad[o4] = lx;
    posRad[o4 + 1] = ly;
    posRad[o4 + 2] = radiusPx;
    posRad[o4 + 3] = intensity;

    colorType[o4] = r;
    colorType[o4 + 1] = g;
    colorType[o4 + 2] = b;
    colorType[o4 + 3] = isSpot;

    spotDir[o4] = Math.cos(dirRad);
    spotDir[o4 + 1] = Math.sin(dirRad);
    spotDir[o4 + 2] = Math.cos(halfConeRad);
    spotDir[o4 + 3] = lightZ;
  }

  return { count, posRad, colorType, spotDir };
}

/**
 * Packs solid shadow-casting sprites into oriented bounding boxes (OBBs) in GL pixel space.
 */
export function packOccludersUniformData(
  occluders: RuntimeSpriteState[],
  toScreenX: (wx: number) => number,
  toScreenY: (wy: number) => number,
  camZoom: number,
  dpr: number,
  canvasHeightPx: number
): PackedOccludersData {
  const boxes = new Float32Array(MAX_WEBGL2_OCCLUDERS * 4);
  const rotations = new Float32Array(MAX_WEBGL2_OCCLUDERS * 2);

  const count = Math.min(MAX_WEBGL2_OCCLUDERS, occluders.length);
  for (let i = 0; i < count; i++) {
    const occ = occluders[i];
    const cx = toScreenX(occ.x) * dpr;
    const cy = canvasHeightPx - toScreenY(occ.y) * dpr;
    const halfW = Math.max(2, (occ.width * Math.abs(occ.scaleX) * camZoom * dpr) / 2);
    const halfH = Math.max(2, (occ.height * Math.abs(occ.scaleY) * camZoom * dpr) / 2);
    const rad = (occ.rotation * Math.PI) / 180;

    const o4 = i * 4;
    boxes[o4] = cx;
    boxes[o4 + 1] = cy;
    boxes[o4 + 2] = halfW;
    boxes[o4 + 3] = halfH;

    const o2 = i * 2;
    rotations[o2] = Math.cos(rad);
    rotations[o2 + 1] = Math.sin(rad);
  }

  return { count, boxes, rotations };
}

// =========================================================================
// GLSL ES 3.00 SHADERS
// =========================================================================

const FULLSCREEN_VERT = `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
  vec2 pos = vec2(
    (gl_VertexID == 1) ? 3.0 : -1.0,
    (gl_VertexID == 2) ? 3.0 : -1.0
  );
  vUv = pos * 0.5 + 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const LIGHTING_FRAG = `#version 300 es
precision highp float;

#define MAX_LIGHTS ${MAX_WEBGL2_LIGHTS}
#define MAX_OCCLUDERS ${MAX_WEBGL2_OCCLUDERS}

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uSceneTex;
uniform sampler2D uSpriteTex;
uniform vec2 uResolution;
uniform vec3 uAmbientColor;
uniform float uAmbientDarkness;
uniform float uNormalMapping;
uniform float uNormalStrength;
uniform float uHardwareShadows;
uniform float uShadowSoftness;

uniform int uLightCount;
uniform vec4 uLightPosRad[MAX_LIGHTS];
uniform vec4 uLightColorType[MAX_LIGHTS];
uniform vec4 uLightSpotDir[MAX_LIGHTS];

uniform int uOccluderCount;
uniform vec4 uOccBox[MAX_OCCLUDERS];
uniform vec2 uOccRot[MAX_OCCLUDERS];

float sampleSpriteHeight(vec2 uv) {
  vec4 c = texture(uSpriteTex, clamp(uv, vec2(0.0), vec2(1.0)));
  float luma = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  // Combine beveled alpha silhouette + luminance relief for crisp 2D sprite normals
  return c.a * (0.45 + luma * 0.55);
}

vec3 computeSpriteNormal(vec2 uv, vec2 texel, float strength) {
  float tl = sampleSpriteHeight(uv + vec2(-texel.x,  texel.y));
  float t  = sampleSpriteHeight(uv + vec2( 0.0,      texel.y));
  float tr = sampleSpriteHeight(uv + vec2( texel.x,  texel.y));
  float l  = sampleSpriteHeight(uv + vec2(-texel.x,  0.0));
  float r  = sampleSpriteHeight(uv + vec2( texel.x,  0.0));
  float bl = sampleSpriteHeight(uv + vec2(-texel.x, -texel.y));
  float b  = sampleSpriteHeight(uv + vec2( 0.0,     -texel.y));
  float br = sampleSpriteHeight(uv + vec2( texel.x, -texel.y));

  float gx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
  float gy = (tl + 2.0 * t + tr) - (bl + 2.0 * b + br);

  return normalize(vec3(-gx * strength, -gy * strength, 1.0));
}

float sdBox2D(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

vec2 toLocal(vec2 v, vec2 rot) {
  return vec2(v.x * rot.x + v.y * rot.y, -v.x * rot.y + v.y * rot.x);
}

float computeHardSoftShadow(vec2 fragPos, vec2 lightPos, float rayLen) {
  if (uHardwareShadows < 0.5 || uOccluderCount <= 0 || rayLen < 2.0) {
    return 1.0;
  }

  float visibility = 1.0;

  for (int j = 0; j < MAX_OCCLUDERS; j++) {
    if (j >= uOccluderCount) break;

    vec4 occ = uOccBox[j];
    vec2 rot = uOccRot[j];
    vec2 halfExt = occ.zw;

    vec2 p0 = toLocal(fragPos - occ.xy, rot);
    // Keep solid occluders lit on their own body pixels so normal-mapped surfaces shine
    if (abs(p0.x) <= halfExt.x && abs(p0.y) <= halfExt.y) {
      continue;
    }

    vec2 p1 = toLocal(lightPos - occ.xy, rot);
    // Skip if the light source itself is embedded inside this occluder
    if (abs(p1.x) <= halfExt.x && abs(p1.y) <= halfExt.y) {
      continue;
    }

    vec2 d = p1 - p0;
    vec2 safeD = vec2(
      abs(d.x) < 1e-4 ? (d.x < 0.0 ? -1e-4 : 1e-4) : d.x,
      abs(d.y) < 1e-4 ? (d.y < 0.0 ? -1e-4 : 1e-4) : d.y
    );
    vec2 invD = 1.0 / safeD;

    vec2 t0 = (-halfExt - p0) * invD;
    vec2 t1 = ( halfExt - p0) * invD;
    vec2 tmin = min(t0, t1);
    vec2 tmax = max(t0, t1);
    float tEnter = max(tmin.x, tmin.y);
    float tExit = min(tmax.x, tmax.y);

    float penumbraBase = 1.2 + uShadowSoftness * 5.0;

    if (tExit >= max(tEnter, 0.0) && tEnter < 1.0) {
      float tHit = max(tEnter, 0.0);
      float tMid = clamp(0.5 * (tHit + min(tExit, 1.0)), 0.0, 1.0);
      float depth = -sdBox2D(p0 + d * tMid, halfExt);
      float occToFrag = tHit * rayLen;
      float penumbra = max(1.2, penumbraBase + uShadowSoftness * occToFrag * 0.14);
      float occVis = smoothstep(penumbra * 0.65, -penumbra * 0.35, depth);
      visibility = min(visibility, occVis);
      if (visibility < 0.01) return 0.0;
    } else if (uShadowSoftness > 0.02) {
      float denom = max(dot(d, d), 1e-4);
      float tClosest = clamp(dot(-p0, d) / denom, 0.0, 1.0);
      if (tClosest > 0.0 && tClosest < 1.0) {
        float missDist = sdBox2D(p0 + d * tClosest, halfExt);
        float occToFrag = tClosest * rayLen;
        float penumbra = penumbraBase + uShadowSoftness * occToFrag * 0.14;
        if (missDist < penumbra * 0.65) {
          float occVis = smoothstep(-penumbra * 0.35, penumbra * 0.65, missDist);
          visibility = min(visibility, occVis);
        }
      }
    }
  }

  return visibility;
}

void main() {
  vec4 scene = texture(uSceneTex, vUv);
  vec4 sprite = texture(uSpriteTex, vUv);
  vec2 texel = 1.0 / max(uResolution, vec2(1.0));
  vec2 fragPos = vUv * uResolution;

  vec3 normal = vec3(0.0, 0.0, 1.0);
  bool hasNormal = (uNormalMapping > 0.5 && uNormalStrength > 0.01 && sprite.a > 0.02);
  if (hasNormal) {
    normal = computeSpriteNormal(vUv, texel * 1.15, uNormalStrength);
  }

  // Ambient base (matches 2D Canvas ambientDarkness + ambientColor)
  float darkness = clamp(uAmbientDarkness, 0.0, 0.96);
  vec3 ambientTerm = mix(scene.rgb, uAmbientColor, darkness * 0.88) * (1.0 - darkness * 0.48);

  if (uLightCount <= 0 && darkness < 0.01) {
    fragColor = vec4(scene.rgb, 1.0);
    return;
  }

  vec3 litAccum = vec3(0.0);
  vec3 bloomBoost = vec3(0.0);
  vec3 viewDir = vec3(0.0, 0.0, 1.0);

  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uLightCount) break;

    vec4 pr = uLightPosRad[i];
    vec4 ct = uLightColorType[i];
    vec4 sd = uLightSpotDir[i];

    vec2 lightPos = pr.xy;
    float radius = max(pr.z, 1.0);
    float intensity = pr.w;
    vec3 lightCol = ct.rgb;
    bool isSpot = ct.w > 0.5;

    vec2 toFrag = fragPos - lightPos;
    float dist = length(toFrag);
    if (dist > radius) continue;

    // Smooth quadratic distance attenuation
    float normDist = clamp(dist / radius, 0.0, 1.0);
    float atten = pow(1.0 - normDist, 1.85);

    // Optional spotlight cone falloff
    float spotMask = 1.0;
    if (isSpot && dist > 1.0) {
      vec2 fragDir = toFrag / dist;
      float cosAngle = dot(fragDir, sd.xy);
      float cosOuter = sd.z;
      float cosInner = min(1.0, cosOuter + (1.0 - cosOuter) * 0.35 + 0.04);
      spotMask = smoothstep(cosOuter, cosInner, cosAngle);
      if (spotMask <= 0.001) continue;
    }

    // Hardware analytic soft shadow visibility
    float shadowVis = computeHardSoftShadow(fragPos, lightPos, dist);
    float lightEnergy = atten * spotMask * intensity * shadowVis;
    if (lightEnergy <= 0.001) continue;

    // Normal-mapped diffuse & Blinn-Phong specular on sprites
    float diff = 1.0;
    float spec = 0.0;
    if (hasNormal) {
      vec3 L = normalize(vec3(lightPos - fragPos, sd.w));
      float ndl = dot(normal, L);
      diff = mix(1.0, clamp(ndl * 0.78 + 0.32, 0.12, 1.35), sprite.a);
      vec3 H = normalize(L + viewDir);
      spec = pow(max(dot(normal, H), 0.0), 22.0) * 0.52 * sprite.a;
    }

    // Reveal underlying albedo + tint with colored light + specular highlight
    vec3 revealed = scene.rgb * (0.42 + lightCol * 0.92) * diff;
    vec3 specularCol = lightCol * spec;
    litAccum += (revealed + specularCol) * lightEnergy;

    // Soft additive volumetric light halo (feeds HDR bloom naturally)
    float coreGlow = pow(1.0 - normDist, 2.6) * spotMask * intensity * mix(0.28, 1.0, shadowVis);
    bloomBoost += lightCol * coreGlow * 0.42;
  }

  // Blend ambient darkness with dynamically illuminated regions and emissive core glow
  vec3 finalRgb = ambientTerm + litAccum * (0.55 + darkness * 0.85) + bloomBoost;

  // Preserve bright emissive elements (particles / bright neon sprites) so they punch through dark scenes
  float sceneLuma = dot(scene.rgb, vec3(0.2126, 0.7152, 0.0722));
  float emissiveMask = smoothstep(0.68, 0.98, sceneLuma);
  finalRgb = max(finalRgb, scene.rgb * (0.35 + emissiveMask * 0.85));

  fragColor = vec4(finalRgb, 1.0);
}
`;

const BLOOM_EXTRACT_FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uLitTex;
uniform float uThreshold;

void main() {
  vec3 col = texture(uLitTex, vUv).rgb;
  float luma = max(dot(col, vec3(0.2126, 0.7152, 0.0722)), max(col.r, max(col.g, col.b)) * 0.88);
  float knee = 0.22;
  float soft = clamp(luma - uThreshold + knee, 0.0, 2.0 * knee);
  soft = (soft * soft) / (4.0 * knee + 1e-5);
  float contrib = max(luma - uThreshold, soft) / max(luma, 1e-4);
  fragColor = vec4(col * clamp(contrib, 0.0, 2.5), 1.0);
}
`;

const BLOOM_BLUR_FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTex;
uniform vec2 uDirection;

void main() {
  const float weights[5] = float[](0.2270270, 0.1945946, 0.1216216, 0.0540541, 0.0162162);
  vec3 sum = texture(uTex, vUv).rgb * weights[0];
  for (int i = 1; i < 5; i++) {
    vec2 off = uDirection * float(i);
    sum += texture(uTex, clamp(vUv + off, vec2(0.0), vec2(1.0))).rgb * weights[i];
    sum += texture(uTex, clamp(vUv - off, vec2(0.0), vec2(1.0))).rgb * weights[i];
  }
  fragColor = vec4(sum, 1.0);
}
`;

const COMPOSITE_FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uLitTex;
uniform sampler2D uBloomTex;
uniform vec2 uResolution;
uniform float uBloomEnabled;
uniform float uBloomIntensity;
uniform float uPixelate;
uniform float uChromatic;
uniform float uVignette;
uniform vec3 uTintColor;
uniform float uTintAmount;

vec3 softFilmic(vec3 x) {
  // Subtle highlight roll-off that preserves shadows & midtones while preventing harsh bloom clipping
  vec3 a = x * (2.51 * x + 0.03);
  vec3 b = x * (2.43 * x + 0.59) + 0.14;
  return clamp(a / b, 0.0, 1.0);
}

void main() {
  vec2 uv = vUv;

  // GPU Pixelate
  if (uPixelate > 1.0) {
    vec2 grid = max(vec2(1.0), floor(uResolution / uPixelate));
    uv = (floor(uv * grid) + 0.5) / grid;
  }

  // GPU Chromatic Aberration (true RGB channel separation)
  vec3 litCol;
  if (uChromatic > 0.2) {
    vec2 shift = vec2(uChromatic / max(uResolution.x, 1.0), 0.0);
    litCol.r = texture(uLitTex, clamp(uv + shift, vec2(0.0), vec2(1.0))).r;
    litCol.g = texture(uLitTex, uv).g;
    litCol.b = texture(uLitTex, clamp(uv - shift, vec2(0.0), vec2(1.0))).b;
  } else {
    litCol = texture(uLitTex, uv).rgb;
  }

  vec3 color = litCol;
  if (uBloomEnabled > 0.5 && uBloomIntensity > 0.01) {
    vec3 bloom = texture(uBloomTex, uv).rgb;
    vec3 hdr = color + bloom * uBloomIntensity;
    // Blend gentle filmic compression only on bright highlights above 0.85
    float peak = max(hdr.r, max(hdr.g, hdr.b));
    float toneMix = smoothstep(0.85, 1.85, peak) * 0.72;
    color = mix(clamp(hdr, 0.0, 1.0), softFilmic(hdr), toneMix);
  } else {
    color = clamp(color, 0.0, 1.0);
  }

  // Screen Tint
  if (uTintAmount > 0.01) {
    color = mix(color, uTintColor, clamp(uTintAmount, 0.0, 0.65));
  }

  // Vignette
  if (uVignette > 0.01) {
    vec2 centered = (vUv - 0.5) * 2.0;
    float r = length(centered);
    float vig = smoothstep(0.55, 1.48, r) * clamp(uVignette * 0.85, 0.0, 0.9);
    color = mix(color, vec3(0.008, 0.024, 0.09), vig);
  }

  fragColor = vec4(color, 1.0);
}
`;

export const GLSL_SHADERS = {
  fullscreenVert: FULLSCREEN_VERT,
  lightingFrag: LIGHTING_FRAG,
  bloomExtractFrag: BLOOM_EXTRACT_FRAG,
  bloomBlurFrag: BLOOM_BLUR_FRAG,
  compositeFrag: COMPOSITE_FRAG,
} as const;

// =========================================================================
// WEBGL2 MULTI-PASS PIPELINE CLASS
// =========================================================================

interface FboTarget {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
  width: number;
  height: number;
}

export interface WebGL2PassInput {
  sceneCanvas: HTMLCanvasElement;
  spriteCanvas: HTMLCanvasElement | null;
  width: number;
  height: number;
  dpr: number;
  stage: StageSettings;
  config: WebGL2RenderConfig;
  lights: RuntimeSpriteState[];
  occluders: RuntimeSpriteState[];
  toScreenX: (wx: number) => number;
  toScreenY: (wy: number) => number;
  camZoom: number;
}

export class WebGL2LightingBloomPipeline {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private available = false;
  private fallbackReason: string | null = null;
  private useHalfFloat = false;

  private vao: WebGLVertexArrayObject | null = null;
  private sceneTex: WebGLTexture | null = null;
  private spriteTex: WebGLTexture | null = null;
  private blankTex: WebGLTexture | null = null;

  private litFbo: FboTarget | null = null;
  private bloomFboA: FboTarget | null = null;
  private bloomFboB: FboTarget | null = null;

  private lightingProg: WebGLProgram | null = null;
  private extractProg: WebGLProgram | null = null;
  private blurProg: WebGLProgram | null = null;
  private compositeProg: WebGLProgram | null = null;

  private onContextLostBound: (e: Event) => void;
  private onContextRestoredBound: () => void;

  constructor() {
    this.onContextLostBound = (e: Event) => {
      e.preventDefault();
      this.available = false;
      this.fallbackReason = 'WebGL2 context lost — using 2D Canvas fallback';
    };
    this.onContextRestoredBound = () => {
      this.initResources();
    };

    if (typeof document === 'undefined') {
      this.available = false;
      this.fallbackReason = 'Headless environment (no DOM canvas)';
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });

      if (!gl) {
        this.available = false;
        this.fallbackReason = 'WebGL2 is not supported by this browser or GPU';
        return;
      }

      this.canvas = canvas;
      this.gl = gl;
      canvas.addEventListener('webglcontextlost', this.onContextLostBound);
      canvas.addEventListener('webglcontextrestored', this.onContextRestoredBound);

      this.initResources();
    } catch (err) {
      this.available = false;
      this.fallbackReason = err instanceof Error ? err.message : 'Failed to initialize WebGL2';
    }
  }

  public isAvailable(): boolean {
    return this.available && Boolean(this.gl) && Boolean(this.canvas);
  }

  public getFallbackReason(): string | null {
    return this.fallbackReason;
  }

  public getOutputCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  private initResources(): void {
    const gl = this.gl;
    if (!gl) return;

    try {
      // Enable HDR floating-point render targets if supported
      const extColorFloat = gl.getExtension('EXT_color_buffer_float');
      const extFloatLinear = gl.getExtension('OES_texture_float_linear');
      this.useHalfFloat = Boolean(extColorFloat && extFloatLinear);

      this.lightingProg = this.createProgram(gl, FULLSCREEN_VERT, LIGHTING_FRAG);
      this.extractProg = this.createProgram(gl, FULLSCREEN_VERT, BLOOM_EXTRACT_FRAG);
      this.blurProg = this.createProgram(gl, FULLSCREEN_VERT, BLOOM_BLUR_FRAG);
      this.compositeProg = this.createProgram(gl, FULLSCREEN_VERT, COMPOSITE_FRAG);

      this.vao = gl.createVertexArray();
      this.sceneTex = this.createDynamicTexture(gl);
      this.spriteTex = this.createDynamicTexture(gl);
      this.blankTex = this.createBlankTexture(gl);

      this.available = true;
      this.fallbackReason = null;
    } catch (err) {
      this.available = false;
      this.fallbackReason =
        err instanceof Error ? `WebGL2 shader error: ${err.message}` : 'WebGL2 shader compile failed';
    }
  }

  private compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Unable to allocate WebGL2 shader');
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) || 'Unknown shader compile error';
      gl.deleteShader(shader);
      throw new Error(log);
    }
    return shader;
  }

  private createProgram(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string): WebGLProgram {
    const vs = this.compileShader(gl, gl.VERTEX_SHADER, vertSrc);
    const fs = this.compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    const prog = gl.createProgram();
    if (!prog) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      throw new Error('Unable to allocate WebGL2 program');
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog) || 'Unknown program link error';
      gl.deleteProgram(prog);
      throw new Error(log);
    }
    return prog;
  }

  private createDynamicTexture(gl: WebGL2RenderingContext): WebGLTexture {
    const tex = gl.createTexture();
    if (!tex) throw new Error('Unable to create WebGL2 texture');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  private createBlankTexture(gl: WebGL2RenderingContext): WebGLTexture {
    const tex = this.createDynamicTexture(gl);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0])
    );
    return tex;
  }

  private createFbo(gl: WebGL2RenderingContext, width: number, height: number): FboTarget {
    const fbo = gl.createFramebuffer();
    const tex = this.createDynamicTexture(gl);
    if (!fbo) throw new Error('Unable to create WebGL2 framebuffer');

    const alloc = (useFloat: boolean) => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      if (useFloat) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    };

    if (this.useHalfFloat && !alloc(true)) {
      this.useHalfFloat = false;
      if (!alloc(false)) {
        throw new Error('WebGL2 framebuffer incomplete');
      }
    } else if (!this.useHalfFloat) {
      if (!alloc(false)) {
        throw new Error('WebGL2 framebuffer incomplete');
      }
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex, width, height };
  }

  private destroyFbo(gl: WebGL2RenderingContext, target: FboTarget | null): void {
    if (!target) return;
    gl.deleteFramebuffer(target.fbo);
    gl.deleteTexture(target.tex);
  }

  private ensureTargets(gl: WebGL2RenderingContext, width: number, height: number): void {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const bw = Math.max(1, Math.floor(w / 2));
    const bh = Math.max(1, Math.floor(h / 2));

    if (this.canvas && (this.canvas.width !== w || this.canvas.height !== h)) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    if (!this.litFbo || this.litFbo.width !== w || this.litFbo.height !== h) {
      this.destroyFbo(gl, this.litFbo);
      this.litFbo = this.createFbo(gl, w, h);
    }

    if (!this.bloomFboA || this.bloomFboA.width !== bw || this.bloomFboA.height !== bh) {
      this.destroyFbo(gl, this.bloomFboA);
      this.destroyFbo(gl, this.bloomFboB);
      this.bloomFboA = this.createFbo(gl, bw, bh);
      this.bloomFboB = this.createFbo(gl, bw, bh);
    }
  }

  /**
   * Executes the full WebGL2 pass chain:
   * 1. Deferred Normal-Mapped Lighting + Hardware Analytic Soft Shadows -> litFbo
   * 2. Bright-Pass Extraction -> bloomFboA (half-res)
   * 3. Dual-Pass Separable 9-Tap Gaussian Blur (ping-pong bloomFboA <-> bloomFboB)
   * 4. Final Composite + Tone Mapping + GPU Post-FX -> offscreen WebGL2 canvas
   * Returns number of GPU passes executed, or -1 if fallback is needed.
   */
  public render(input: WebGL2PassInput): number {
    const gl = this.gl;
    if (
      !this.available ||
      !gl ||
      !this.canvas ||
      !this.vao ||
      !this.sceneTex ||
      !this.spriteTex ||
      !this.blankTex ||
      !this.lightingProg ||
      !this.extractProg ||
      !this.blurProg ||
      !this.compositeProg
    ) {
      return -1;
    }

    try {
      this.ensureTargets(gl, input.width, input.height);
      const litFbo = this.litFbo!;
      const bloomA = this.bloomFboA!;
      const bloomB = this.bloomFboB!;

      // Upload scene & sprite albedo textures (flip Y so canvas top maps to UV y=1)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, input.sceneCanvas);

      gl.activeTexture(gl.TEXTURE1);
      if (input.spriteCanvas && input.config.normalMapping) {
        gl.bindTexture(gl.TEXTURE_2D, this.spriteTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, input.spriteCanvas);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, this.blankTex);
      }

      gl.bindVertexArray(this.vao);

      // Pack light & occluder uniform arrays
      const packedLights = packLightsUniformData(
        input.lights,
        input.toScreenX,
        input.toScreenY,
        input.camZoom,
        input.dpr,
        input.height
      );
      const packedOccluders = packOccludersUniformData(
        input.occluders,
        input.toScreenX,
        input.toScreenY,
        input.camZoom,
        input.dpr,
        input.height
      );
      const [ambR, ambG, ambB] = hexToRgb01(input.stage.ambientColor || '#050811');

      // -----------------------------------------------------------------
      // PASS 1: Deferred Normal-Mapped Lighting + Hardware Soft Shadows
      // -----------------------------------------------------------------
      gl.bindFramebuffer(gl.FRAMEBUFFER, litFbo.fbo);
      gl.viewport(0, 0, litFbo.width, litFbo.height);
      gl.useProgram(this.lightingProg);

      gl.uniform1i(gl.getUniformLocation(this.lightingProg, 'uSceneTex'), 0);
      gl.uniform1i(gl.getUniformLocation(this.lightingProg, 'uSpriteTex'), 1);
      gl.uniform2f(
        gl.getUniformLocation(this.lightingProg, 'uResolution'),
        input.width,
        input.height
      );
      gl.uniform3f(gl.getUniformLocation(this.lightingProg, 'uAmbientColor'), ambR, ambG, ambB);
      gl.uniform1f(
        gl.getUniformLocation(this.lightingProg, 'uAmbientDarkness'),
        input.stage.ambientDarkness
      );
      gl.uniform1f(
        gl.getUniformLocation(this.lightingProg, 'uNormalMapping'),
        input.config.normalMapping ? 1 : 0
      );
      gl.uniform1f(
        gl.getUniformLocation(this.lightingProg, 'uNormalStrength'),
        input.config.normalStrength
      );
      gl.uniform1f(
        gl.getUniformLocation(this.lightingProg, 'uHardwareShadows'),
        input.config.hardwareShadows ? 1 : 0
      );
      gl.uniform1f(
        gl.getUniformLocation(this.lightingProg, 'uShadowSoftness'),
        input.config.shadowSoftness
      );

      gl.uniform1i(gl.getUniformLocation(this.lightingProg, 'uLightCount'), packedLights.count);
      gl.uniform4fv(
        gl.getUniformLocation(this.lightingProg, 'uLightPosRad'),
        packedLights.posRad
      );
      gl.uniform4fv(
        gl.getUniformLocation(this.lightingProg, 'uLightColorType'),
        packedLights.colorType
      );
      gl.uniform4fv(
        gl.getUniformLocation(this.lightingProg, 'uLightSpotDir'),
        packedLights.spotDir
      );

      gl.uniform1i(
        gl.getUniformLocation(this.lightingProg, 'uOccluderCount'),
        packedOccluders.count
      );
      gl.uniform4fv(gl.getUniformLocation(this.lightingProg, 'uOccBox'), packedOccluders.boxes);
      gl.uniform2fv(
        gl.getUniformLocation(this.lightingProg, 'uOccRot'),
        packedOccluders.rotations
      );

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      let passes = 1;

      // -----------------------------------------------------------------
      // PASS 2 & 3: Bright-Pass Extraction + Dual-Pass Separable Blur
      // -----------------------------------------------------------------
      if (input.config.bloomEnabled && input.config.bloomIntensity > 0.01) {
        // 2a. Bright-pass extract into half-res bloomFboA
        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
        gl.viewport(0, 0, bloomA.width, bloomA.height);
        gl.useProgram(this.extractProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, litFbo.tex);
        gl.uniform1i(gl.getUniformLocation(this.extractProg, 'uLitTex'), 0);
        gl.uniform1f(
          gl.getUniformLocation(this.extractProg, 'uThreshold'),
          input.config.bloomThreshold
        );
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        passes += 1;

        // 2b. Two ping-pong separable Gaussian blur iterations (wide & silky bloom)
        gl.useProgram(this.blurProg);
        const texLoc = gl.getUniformLocation(this.blurProg, 'uTex');
        const dirLoc = gl.getUniformLocation(this.blurProg, 'uDirection');
        gl.uniform1i(texLoc, 0);

        const baseRadius = input.config.bloomRadius * Math.max(1, input.dpr * 0.65);
        for (let iter = 0; iter < 2; iter++) {
          const r = baseRadius * (iter === 0 ? 1.0 : 1.75);

          // Horizontal: bloomA -> bloomB
          gl.bindFramebuffer(gl.FRAMEBUFFER, bloomB.fbo);
          gl.viewport(0, 0, bloomB.width, bloomB.height);
          gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
          gl.uniform2f(dirLoc, r / bloomA.width, 0);
          gl.drawArrays(gl.TRIANGLES, 0, 3);

          // Vertical: bloomB -> bloomA
          gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
          gl.viewport(0, 0, bloomA.width, bloomA.height);
          gl.bindTexture(gl.TEXTURE_2D, bloomB.tex);
          gl.uniform2f(dirLoc, 0, r / bloomA.height);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          passes += 2;
        }
      }

      // -----------------------------------------------------------------
      // PASS 4: Final Composite + Soft Filmic Tone Mapping + GPU Post-FX
      // -----------------------------------------------------------------
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, input.width, input.height);
      gl.useProgram(this.compositeProg);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, litFbo.tex);
      gl.uniform1i(gl.getUniformLocation(this.compositeProg, 'uLitTex'), 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
      gl.uniform1i(gl.getUniformLocation(this.compositeProg, 'uBloomTex'), 1);

      const fx = input.stage.stageEffects;
      const [tintR, tintG, tintB] = hexToRgb01(fx.tint || '#38BDF8');

      gl.uniform2f(
        gl.getUniformLocation(this.compositeProg, 'uResolution'),
        input.width,
        input.height
      );
      gl.uniform1f(
        gl.getUniformLocation(this.compositeProg, 'uBloomEnabled'),
        input.config.bloomEnabled ? 1 : 0
      );
      gl.uniform1f(
        gl.getUniformLocation(this.compositeProg, 'uBloomIntensity'),
        input.config.bloomIntensity
      );
      gl.uniform1f(
        gl.getUniformLocation(this.compositeProg, 'uPixelate'),
        fx.pixelate > 1 ? Math.max(2, Math.min(24, Math.round(fx.pixelate))) : 0
      );
      gl.uniform1f(
        gl.getUniformLocation(this.compositeProg, 'uChromatic'),
        fx.chromatic > 0.2 ? Math.min(14, fx.chromatic) * input.dpr : 0
      );
      gl.uniform1f(gl.getUniformLocation(this.compositeProg, 'uVignette'), fx.vignette);
      gl.uniform3f(
        gl.getUniformLocation(this.compositeProg, 'uTintColor'),
        tintR,
        tintG,
        tintB
      );
      gl.uniform1f(gl.getUniformLocation(this.compositeProg, 'uTintAmount'), fx.tintAmount);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      passes += 1;

      return passes;
    } catch (err) {
      this.available = false;
      this.fallbackReason =
        err instanceof Error ? `WebGL2 render error: ${err.message}` : 'WebGL2 render failure';
      return -1;
    }
  }

  public dispose(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('webglcontextlost', this.onContextLostBound);
      this.canvas.removeEventListener('webglcontextrestored', this.onContextRestoredBound);
    }
    const gl = this.gl;
    if (gl) {
      this.destroyFbo(gl, this.litFbo);
      this.destroyFbo(gl, this.bloomFboA);
      this.destroyFbo(gl, this.bloomFboB);
      if (this.sceneTex) gl.deleteTexture(this.sceneTex);
      if (this.spriteTex) gl.deleteTexture(this.spriteTex);
      if (this.blankTex) gl.deleteTexture(this.blankTex);
      if (this.vao) gl.deleteVertexArray(this.vao);
      if (this.lightingProg) gl.deleteProgram(this.lightingProg);
      if (this.extractProg) gl.deleteProgram(this.extractProg);
      if (this.blurProg) gl.deleteProgram(this.blurProg);
      if (this.compositeProg) gl.deleteProgram(this.compositeProg);
    }
    this.litFbo = null;
    this.bloomFboA = null;
    this.bloomFboB = null;
    this.gl = null;
    this.canvas = null;
    this.available = false;
  }
}
