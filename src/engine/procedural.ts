export type ProceduralPreset =
  | 'symmetry_ship'
  | 'symmetry_bot'
  | 'symmetry_gem'
  | 'noise_nebula'
  | 'noise_plasma'
  | 'noise_stone'
  | 'geo_platform'
  | 'geo_crystal'
  | 'geo_laser'
  | 'geo_star'
  | 'geo_pillar'
  | 'geo_drone';

export interface ProceduralOptions {
  preset: ProceduralPreset;
  width: number;
  height: number;
  seed: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
}

export interface RgbaBuffer {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [56, 189, 248];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function setPixel(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a: number
): void {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const idx = (y * w + x) * 4;
  data[idx] = Math.max(0, Math.min(255, Math.round(r)));
  data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
  data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
  data[idx + 3] = Math.max(0, Math.min(255, Math.round(a)));
}

function hash2D(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2D(xi, yi, seed);
  const b = hash2D(xi + 1, yi, seed);
  const c = hash2D(xi, yi + 1, seed);
  const d = hash2D(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += amp * valueNoise(x * freq, y * freq, seed + i * 31);
    freq *= 2;
    amp *= 0.5;
  }
  return value;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Generates a deterministic RGBA pixel buffer for procedural sprites, tiles, and noise shaders.
 */
export function generateProceduralBuffer(options: ProceduralOptions): RgbaBuffer {
  const { preset, width, height, seed, primaryColor, secondaryColor, accentColor = '#FFFFFF' } = options;
  const data = new Uint8ClampedArray(width * height * 4);
  const [r1, g1, b1] = hexToRgb(primaryColor);
  const [r2, g2, b2] = hexToRgb(secondaryColor);
  const [ra, ga, ba] = hexToRgb(accentColor);
  const rand = mulberry32(seed);

  if (preset === 'symmetry_ship' || preset === 'symmetry_bot' || preset === 'symmetry_gem') {
    const gridW = 12;
    const gridH = 12;
    const halfW = gridW / 2;
    const grid: number[][] = Array.from({ length: gridH }, () => Array(gridW).fill(0));

    for (let gy = 1; gy < gridH - 1; gy++) {
      for (let gx = 1; gx < halfW; gx++) {
        const distFromCenter = (halfW - 0.5 - gx) / halfW;
        const distFromMidY = Math.abs(gy - (gridH - 1) / 2) / (gridH / 2);
        let density = 0.72 - distFromCenter * 0.55 - distFromMidY * 0.35;
        if (preset === 'symmetry_ship') {
          // Pointed nose at top, wider wings toward bottom
          const noseBias = gy < 4 ? (halfW - gx <= gy + 1 ? 0.35 : -0.5) : 0.15;
          density += noseBias;
        } else if (preset === 'symmetry_gem') {
          const diamond = Math.abs(gx - (halfW - 0.5)) / halfW + Math.abs(gy - (gridH - 1) / 2) / (gridH / 2);
          density = diamond < 0.85 ? 0.95 : -1;
        }
        const roll = rand();
        let cell = 0;
        if (roll < density) {
          cell = roll < density * 0.28 ? 3 : roll < density * 0.65 ? 1 : 2;
        }
        grid[gy][gx] = cell;
        grid[gy][gridW - 1 - gx] = cell;
      }
    }

    // Add dark crisp outline around filled cells
    const outlined = grid.map((row) => [...row]);
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        if (grid[gy][gx] !== 0) continue;
        const hasNeighbor =
          (gy > 0 && grid[gy - 1][gx] > 0) ||
          (gy < gridH - 1 && grid[gy + 1][gx] > 0) ||
          (gx > 0 && grid[gy][gx - 1] > 0) ||
          (gx < gridW - 1 && grid[gy][gx + 1] > 0);
        if (hasNeighbor) outlined[gy][gx] = 4;
      }
    }

    const cellW = width / gridW;
    const cellH = height / gridH;
    for (let y = 0; y < height; y++) {
      const gy = Math.min(gridH - 1, Math.floor(y / cellH));
      for (let x = 0; x < width; x++) {
        const gx = Math.min(gridW - 1, Math.floor(x / cellW));
        const val = outlined[gy][gx];
        if (val === 1) setPixel(data, width, height, x, y, r1, g1, b1, 255);
        else if (val === 2) setPixel(data, width, height, x, y, r2, g2, b2, 255);
        else if (val === 3) setPixel(data, width, height, x, y, ra, ga, ba, 255);
        else if (val === 4) setPixel(data, width, height, x, y, 15, 23, 42, 240);
      }
    }
    return { width, height, data };
  }

  if (preset === 'noise_nebula' || preset === 'noise_plasma' || preset === 'noise_stone') {
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.min(cx, cy);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x / width) * 5;
        const ny = (y / height) * 5;
        const n = fbm(nx, ny, seed, 4);
        const dx = (x - cx) / maxR;
        const dy = (y - cy) / maxR;
        const dist = Math.hypot(dx, dy);

        if (preset === 'noise_plasma') {
          if (dist > 0.96) continue;
          const core = Math.max(0, 1 - dist);
          const wave = Math.sin((n * 6 + core * 3) * Math.PI) * 0.5 + 0.5;
          const t = Math.min(1, core * 0.65 + wave * 0.45);
          const r = lerp(r2, r1, t) + core * core * (ra - r1) * 0.6;
          const g = lerp(g2, g1, t) + core * core * (ga - g1) * 0.6;
          const b = lerp(b2, b1, t) + core * core * (ba - b1) * 0.6;
          const alpha = Math.min(255, Math.max(0, (1 - Math.pow(dist, 2.4)) * 255));
          setPixel(data, width, height, x, y, r, g, b, alpha);
        } else if (preset === 'noise_nebula') {
          const falloff = Math.max(0, 1 - dist * 1.05);
          const alpha = Math.min(255, Math.max(0, falloff * n * 380));
          setPixel(data, width, height, x, y, lerp(r2, r1, n), lerp(g2, g1, n), lerp(b2, b1, n), alpha);
        } else {
          // Stone tile with crisp beveled edge
          const edge = Math.min(x, y, width - 1 - x, height - 1 - y);
          const bevel = edge < 3 ? 1.25 : edge < 5 ? 0.78 : 1;
          const shade = (0.55 + n * 0.55) * bevel;
          setPixel(
            data,
            width,
            height,
            x,
            y,
            lerp(r2, r1, n) * shade,
            lerp(g2, g1, n) * shade,
            lerp(b2, b1, n) * shade,
            255
          );
        }
      }
    }
    return { width, height, data };
  }

  if (preset === 'geo_platform') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isTopStrip = y < Math.max(3, Math.floor(height * 0.2));
        const isBorder = x < 2 || x >= width - 2 || y >= height - 2;
        const hatch = ((x + y) % 12 < 2) && y > height * 0.35;
        if (isTopStrip) {
          const glow = 1 - y / (height * 0.22);
          setPixel(data, width, height, x, y, lerp(r1, ra, glow * 0.45), lerp(g1, ga, glow * 0.45), lerp(b1, ba, glow * 0.45), 255);
        } else if (isBorder) {
          setPixel(data, width, height, x, y, r1 * 0.7, g1 * 0.7, b1 * 0.7, 255);
        } else {
          const factor = hatch ? 1.18 : 0.92 - (y / height) * 0.25;
          setPixel(data, width, height, x, y, r2 * factor, g2 * factor, b2 * factor, 255);
        }
      }
    }
    return { width, height, data };
  }

  if (preset === 'geo_pillar') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const border = x < 3 || y < 3 || x >= width - 3 || y >= height - 3;
        const inner = x >= 8 && y >= 8 && x < width - 8 && y < height - 8;
        const centerX = Math.abs(x - width / 2) < 2;
        const centerY = Math.abs(y - height / 2) < 2;
        if (border) {
          setPixel(data, width, height, x, y, r1, g1, b1, 255);
        } else if (inner && (centerX || centerY)) {
          setPixel(data, width, height, x, y, ra, ga, ba, 210);
        } else {
          const shade = inner ? 0.72 : 1.0;
          setPixel(data, width, height, x, y, r2 * shade, g2 * shade, b2 * shade, 255);
        }
      }
    }
    return { width, height, data };
  }

  if (preset === 'geo_laser') {
    const cx = width / 2;
    const cy = height / 2;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x - cx) / (width * 0.45);
        const ny = (y - cy) / (height * 0.45);
        const d = Math.hypot(nx, ny);
        if (d > 1) continue;
        const core = Math.max(0, 1 - d * 1.4);
        setPixel(
          data,
          width,
          height,
          x,
          y,
          lerp(r1, ra, core),
          lerp(g1, ga, core),
          lerp(b1, ba, core),
          Math.min(255, (1 - d * d) * 255)
        );
      }
    }
    return { width, height, data };
  }

  if (preset === 'geo_drone') {
    const cx = width / 2;
    const cy = height / 2;
    const rad = Math.min(cx, cy) * 0.84;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const d = Math.hypot(dx, dy);
        if (d > rad) continue;
        const ring = Math.abs(d - rad * 0.76) < rad * 0.12;
        const eye = Math.hypot(dx - rad * 0.32, dy) < rad * 0.22;
        if (eye) {
          setPixel(data, width, height, x, y, ra, ga, ba, 255);
        } else if (ring) {
          setPixel(data, width, height, x, y, r1, g1, b1, 255);
        } else {
          const shade = 0.75 + 0.3 * (1 - d / rad);
          setPixel(data, width, height, x, y, r2 * shade, g2 * shade, b2 * shade, 255);
        }
      }
    }
    return { width, height, data };
  }

  // geo_crystal / geo_star
  const cx = width / 2;
  const cy = height / 2;
  const rad = Math.min(cx, cy) * 0.88;
  const points = preset === 'geo_star' ? 5 : 4;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const angle = Math.atan2(dy, dx);
      const dist = Math.hypot(dx, dy);
      const wave =
        preset === 'geo_star'
          ? 0.52 + 0.48 * Math.pow(Math.cos(angle * points), 2)
          : 0.65 + 0.35 * Math.abs(Math.cos(angle * 2));
      const maxR = rad * wave;
      if (dist > maxR) continue;
      const facet = (dx > 0 ? 1.12 : 0.88) * (dy < 0 ? 1.08 : 0.9);
      const t = dist / maxR;
      const r = lerp(ra, lerp(r1, r2, t), Math.min(1, t * 1.15)) * facet;
      const g = lerp(ga, lerp(g1, g2, t), Math.min(1, t * 1.15)) * facet;
      const b = lerp(ba, lerp(b1, b2, t), Math.min(1, t * 1.15)) * facet;
      setPixel(data, width, height, x, y, r, g, b, 255);
    }
  }
  return { width, height, data };
}

/**
 * Pure iterative flood fill on an RGBA buffer (used by the native Costume Editor Fill Bucket tool).
 */
export function floodFillPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  fillRgba: [number, number, number, number],
  tolerance = 24
): boolean {
  const sx = Math.floor(startX);
  const sy = Math.floor(startY);
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return false;

  const startIdx = (sy * width + sx) * 4;
  const tr = data[startIdx];
  const tg = data[startIdx + 1];
  const tb = data[startIdx + 2];
  const ta = data[startIdx + 3];

  const [fr, fg, fb, fa] = fillRgba;
  if (
    Math.abs(tr - fr) <= 2 &&
    Math.abs(tg - fg) <= 2 &&
    Math.abs(tb - fb) <= 2 &&
    Math.abs(ta - fa) <= 2
  ) {
    return false;
  }

  const visited = new Uint8Array(width * height);
  const stack: number[] = [sx, sy];
  let filledAny = false;

  const matches = (idx: number): boolean =>
    Math.abs(data[idx] - tr) <= tolerance &&
    Math.abs(data[idx + 1] - tg) <= tolerance &&
    Math.abs(data[idx + 2] - tb) <= tolerance &&
    Math.abs(data[idx + 3] - ta) <= tolerance;

  while (stack.length > 0) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    const pos = y * width + x;
    if (visited[pos]) continue;
    const idx = pos * 4;
    if (!matches(idx)) continue;

    visited[pos] = 1;
    data[idx] = fr;
    data[idx + 1] = fg;
    data[idx + 2] = fb;
    data[idx + 3] = fa;
    filledAny = true;

    if (x > 0) stack.push(x - 1, y);
    if (x < width - 1) stack.push(x + 1, y);
    if (y > 0) stack.push(x, y - 1);
    if (y < height - 1) stack.push(x, y + 1);
  }

  return filledAny;
}

/**
 * Helper to render an RgbaBuffer into a PNG data URL in browser environments.
 */
export function rgbaBufferToDataUrl(buffer: RgbaBuffer): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = buffer.width;
  canvas.height = buffer.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const imgData = new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height);
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}
