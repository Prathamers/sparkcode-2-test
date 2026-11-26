// SPDX-License-Identifier: AGPL-3.0-or-later
import type { RuntimeSpriteState, WebGL2RenderConfig } from '../../types/project';

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

function clamp(v: number, min: number, max: number): number {
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;
}

export function normalizeWebGL2Config(cfg?: Partial<WebGL2RenderConfig>): WebGL2RenderConfig {
  return {
    backend: cfg?.backend === 'webgl2' ? 'webgl2' : DEFAULT_WEBGL2_CONFIG.backend,
    normalMapping: cfg?.normalMapping ?? DEFAULT_WEBGL2_CONFIG.normalMapping,
    normalStrength: clamp(cfg?.normalStrength ?? DEFAULT_WEBGL2_CONFIG.normalStrength, 0, 3),
    hardwareShadows: cfg?.hardwareShadows ?? DEFAULT_WEBGL2_CONFIG.hardwareShadows,
    shadowSoftness: clamp(cfg?.shadowSoftness ?? DEFAULT_WEBGL2_CONFIG.shadowSoftness, 0, 1),
    bloomEnabled: cfg?.bloomEnabled ?? DEFAULT_WEBGL2_CONFIG.bloomEnabled,
    bloomThreshold: clamp(cfg?.bloomThreshold ?? DEFAULT_WEBGL2_CONFIG.bloomThreshold, 0.15, 0.95),
    bloomIntensity: clamp(cfg?.bloomIntensity ?? DEFAULT_WEBGL2_CONFIG.bloomIntensity, 0, 2.5),
    bloomRadius: clamp(cfg?.bloomRadius ?? DEFAULT_WEBGL2_CONFIG.bloomRadius, 1, 6),
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
  posRad: Float32Array;
  colorType: Float32Array;
  spotDir: Float32Array;
}

export interface PackedOccludersData {
  count: number;
  boxes: Float32Array;
  rotations: Float32Array;
}

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
