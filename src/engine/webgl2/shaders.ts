// SPDX-License-Identifier: AGPL-3.0-or-later
import { MAX_WEBGL2_LIGHTS, MAX_WEBGL2_OCCLUDERS } from './uniforms';

export const FULLSCREEN_VERT = `#version 300 es
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

export const LIGHTING_FRAG = `#version 300 es
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
    if (abs(p0.x) <= halfExt.x && abs(p0.y) <= halfExt.y) {
      continue;
    }

    vec2 p1 = toLocal(lightPos - occ.xy, rot);
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

    float normDist = clamp(dist / radius, 0.0, 1.0);
    float atten = pow(1.0 - normDist, 1.85);

    float spotMask = 1.0;
    if (isSpot && dist > 1.0) {
      vec2 fragDir = toFrag / dist;
      float cosAngle = dot(fragDir, sd.xy);
      float cosOuter = sd.z;
      float cosInner = min(1.0, cosOuter + (1.0 - cosOuter) * 0.35 + 0.04);
      spotMask = smoothstep(cosOuter, cosInner, cosAngle);
      if (spotMask <= 0.001) continue;
    }

    float shadowVis = computeHardSoftShadow(fragPos, lightPos, dist);
    float lightEnergy = atten * spotMask * intensity * shadowVis;
    if (lightEnergy <= 0.001) continue;

    float diff = 1.0;
    float spec = 0.0;
    if (hasNormal) {
      vec3 L = normalize(vec3(lightPos - fragPos, sd.w));
      float ndl = dot(normal, L);
      diff = mix(1.0, clamp(ndl * 0.78 + 0.32, 0.12, 1.35), sprite.a);
      vec3 H = normalize(L + viewDir);
      spec = pow(max(dot(normal, H), 0.0), 22.0) * 0.52 * sprite.a;
    }

    vec3 revealed = scene.rgb * (0.42 + lightCol * 0.92) * diff;
    vec3 specularCol = lightCol * spec;
    litAccum += (revealed + specularCol) * lightEnergy;

    float coreGlow = pow(1.0 - normDist, 2.6) * spotMask * intensity * mix(0.28, 1.0, shadowVis);
    bloomBoost += lightCol * coreGlow * 0.42;
  }

  vec3 finalRgb = ambientTerm + litAccum * (0.55 + darkness * 0.85) + bloomBoost;
  float sceneLuma = dot(scene.rgb, vec3(0.2126, 0.7152, 0.0722));
  float emissiveMask = smoothstep(0.68, 0.98, sceneLuma);
  finalRgb = max(finalRgb, scene.rgb * (0.35 + emissiveMask * 0.85));

  fragColor = vec4(finalRgb, 1.0);
}
`;

export const BLOOM_EXTRACT_FRAG = `#version 300 es
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

export const BLOOM_BLUR_FRAG = `#version 300 es
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

export const COMPOSITE_FRAG = `#version 300 es
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
  vec3 a = x * (2.51 * x + 0.03);
  vec3 b = x * (2.43 * x + 0.59) + 0.14;
  return clamp(a / b, 0.0, 1.0);
}

void main() {
  vec2 uv = vUv;

  if (uPixelate > 1.0) {
    vec2 grid = max(vec2(1.0), floor(uResolution / uPixelate));
    uv = (floor(uv * grid) + 0.5) / grid;
  }

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
    float peak = max(hdr.r, max(hdr.g, hdr.b));
    float toneMix = smoothstep(0.85, 1.85, peak) * 0.72;
    color = mix(clamp(hdr, 0.0, 1.0), softFilmic(hdr), toneMix);
  } else {
    color = clamp(color, 0.0, 1.0);
  }

  if (uTintAmount > 0.01) {
    color = mix(color, uTintColor, clamp(uTintAmount, 0.0, 0.65));
  }

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
