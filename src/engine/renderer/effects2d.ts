// SPDX-License-Identifier: AGPL-3.0-or-later
import type {
  BlendModeType,
  CameraState,
  RuntimeSpriteState,
  StageSettings,
} from '../../types/project';

export interface StarSeed {
  x: number;
  y: number;
  r: number;
  speed: number;
  alpha: number;
}

export function mapBlendMode(mode: BlendModeType): GlobalCompositeOperation {
  switch (mode) {
    case 'add':
      return 'lighter';
    case 'multiply':
      return 'multiply';
    case 'screen':
      return 'screen';
    default:
      return 'source-over';
  }
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(56, 189, 248, ${alpha})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function drawStageBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stage: StageSettings,
  camera: CameraState,
  timeSec: number,
  stars: StarSeed[],
  backdropImg: HTMLImageElement | null
): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, stage.bgColorA);
  grad.addColorStop(1, stage.bgColorB);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (backdropImg) {
    const imgAspect = backdropImg.naturalWidth / Math.max(1, backdropImg.naturalHeight);
    const viewAspect = w / Math.max(1, h);
    let drawW = w;
    let drawH = h;
    let drawX = 0;
    let drawY = 0;
    if (viewAspect > imgAspect) {
      drawH = w / imgAspect;
      drawY = (h - drawH) / 2;
    } else {
      drawW = h * imgAspect;
      drawX = (w - drawW) / 2;
    }
    ctx.drawImage(backdropImg, drawX, drawY, drawW, drawH);
  }

  if (stage.backgroundShader === 'solid') return;

  if (stage.backgroundShader === 'grid') {
    if (backdropImg) return;
    const spacing = 36 * Math.max(0.5, camera.zoom);
    const ox = ((-camera.x * 0.5) % spacing + spacing) % spacing;
    const oy = ((camera.y * 0.5) % spacing + spacing) % spacing;
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = ox; x < w; x += spacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = oy; y < h; y += spacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (stage.backgroundShader === 'starfield') {
    ctx.save();
    for (const st of stars) {
      const sx = ((st.x * w - camera.x * 0.15) % w + w) % w;
      const sy = ((st.y * h + timeSec * st.speed + camera.y * 0.15) % h + h) % h;
      ctx.fillStyle = `rgba(226, 232, 240, ${st.alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (stage.backgroundShader === 'synthwave') {
    const horizonY = h * 0.58;
    ctx.save();
    const glow = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 50);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0)');
    glow.addColorStop(0.5, 'rgba(56, 189, 248, 0.16)');
    glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, horizonY - 40, w, 90);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const scroll = (timeSec * 0.5) % 1;
    for (let i = 0; i < 10; i++) {
      const t = Math.pow((i + scroll) / 10, 1.85);
      const y = horizonY + t * (h - horizonY);
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    const centerX = w / 2 - camera.x * 0.18;
    for (let i = -8; i <= 8; i++) {
      ctx.moveTo(centerX + i * 24, horizonY);
      ctx.lineTo(centerX + i * 130, h);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (stage.backgroundShader === 'nebula') {
    ctx.save();
    const nebulaColors = ['#14B8A6', '#0EA5E9', '#6366F1'];
    for (let i = 0; i < 3; i++) {
      const cx = w * (0.25 + i * 0.25) + Math.sin(timeSec * 0.3 + i * 2) * 28;
      const cy = h * (0.35 + (i % 2) * 0.28) + Math.cos(timeSec * 0.25 + i) * 20;
      const rad = Math.max(w, h) * 0.42;
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, rad);
      g.addColorStop(0, hexToRgba(nebulaColors[i], 0.14));
      g.addColorStop(1, hexToRgba(nebulaColors[i], 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }
}

export function render2DLightingPass(
  ctx: CanvasRenderingContext2D,
  lightCanvas: HTMLCanvasElement,
  lCtx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stage: StageSettings,
  lights: RuntimeSpriteState[],
  occluders: RuntimeSpriteState[],
  toScreenX: (wx: number) => number,
  toScreenY: (wy: number) => number,
  camZoom: number
): void {
  const lw = Math.max(1, Math.round(w));
  const lh = Math.max(1, Math.round(h));
  if (lightCanvas.width !== lw || lightCanvas.height !== lh) {
    lightCanvas.width = lw;
    lightCanvas.height = lh;
  }

  lCtx.save();
  lCtx.globalCompositeOperation = 'source-over';
  lCtx.clearRect(0, 0, lw, lh);
  lCtx.fillStyle = hexToRgba(stage.ambientColor || '#050811', stage.ambientDarkness);
  lCtx.fillRect(0, 0, lw, lh);

  for (const light of lights) {
    const lx = toScreenX(light.x);
    const ly = toScreenY(light.y);
    const radius = Math.max(16, light.light.radius * camZoom);

    lCtx.save();
    lCtx.globalCompositeOperation = 'destination-out';
    if (light.light.type === 'spot') {
      const dirRad = (-light.rotation * Math.PI) / 180;
      const halfCone = ((light.light.angle || 55) * Math.PI) / 360;
      lCtx.beginPath();
      lCtx.moveTo(lx, ly);
      lCtx.arc(lx, ly, radius, dirRad - halfCone, dirRad + halfCone);
      lCtx.closePath();
      lCtx.clip();
    }

    const grad = lCtx.createRadialGradient(lx, ly, 2, lx, ly, radius);
    grad.addColorStop(0, `rgba(0,0,0,${Math.min(1, light.light.intensity)})`);
    grad.addColorStop(0.55, `rgba(0,0,0,${Math.min(1, light.light.intensity * 0.58)})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    lCtx.fillStyle = grad;
    lCtx.beginPath();
    lCtx.arc(lx, ly, radius, 0, Math.PI * 2);
    lCtx.fill();
    lCtx.restore();

    if (occluders.length > 0 && stage.ambientDarkness > 0.15) {
      lCtx.save();
      lCtx.globalCompositeOperation = 'source-over';
      lCtx.fillStyle = hexToRgba(stage.ambientColor || '#050811', stage.ambientDarkness * 0.78);
      const shadowLen = radius * 1.4;

      for (const occ of occluders) {
        if (occ.id === light.id) continue;
        const ox = toScreenX(occ.x);
        const oy = toScreenY(occ.y);
        const dist = Math.hypot(ox - lx, oy - ly);
        if (dist > radius * 1.15 || dist < 4) continue;

        const hw = (occ.width * Math.abs(occ.scaleX) * camZoom) / 2;
        const hh = (occ.height * Math.abs(occ.scaleY) * camZoom) / 2;
        const corners = [
          { x: ox - hw, y: oy - hh },
          { x: ox + hw, y: oy - hh },
          { x: ox + hw, y: oy + hh },
          { x: ox - hw, y: oy + hh },
        ];

        for (let i = 0; i < 4; i++) {
          const c1 = corners[i];
          const c2 = corners[(i + 1) % 4];
          const mx = (c1.x + c2.x) * 0.5;
          const my = (c1.y + c2.y) * 0.5;
          const nx = c2.y - c1.y;
          const ny = -(c2.x - c1.x);
          if (nx * (mx - lx) + ny * (my - ly) > 0) {
            const d1 = Math.hypot(c1.x - lx, c1.y - ly) || 1;
            const d2 = Math.hypot(c2.x - lx, c2.y - ly) || 1;
            lCtx.beginPath();
            lCtx.moveTo(c1.x, c1.y);
            lCtx.lineTo(c2.x, c2.y);
            lCtx.lineTo(c2.x + ((c2.x - lx) / d2) * shadowLen, c2.y + ((c2.y - ly) / d2) * shadowLen);
            lCtx.lineTo(c1.x + ((c1.x - lx) / d1) * shadowLen, c1.y + ((c1.y - ly) / d1) * shadowLen);
            lCtx.closePath();
            lCtx.fill();
          }
        }
      }
      lCtx.restore();
    }
  }
  lCtx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(lightCanvas, 0, 0, w, h);

  ctx.globalCompositeOperation = 'lighter';
  for (const light of lights) {
    const lx = toScreenX(light.x);
    const ly = toScreenY(light.y);
    const radius = Math.max(16, light.light.radius * camZoom);

    ctx.save();
    if (light.light.type === 'spot') {
      const dirRad = (-light.rotation * Math.PI) / 180;
      const halfCone = ((light.light.angle || 55) * Math.PI) / 360;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.arc(lx, ly, radius, dirRad - halfCone, dirRad + halfCone);
      ctx.closePath();
      ctx.clip();
    }

    const bloom = ctx.createRadialGradient(lx, ly, 2, lx, ly, radius);
    bloom.addColorStop(0, hexToRgba(light.light.color, 0.28 * light.light.intensity));
    bloom.addColorStop(0.5, hexToRgba(light.light.color, 0.09 * light.light.intensity));
    bloom.addColorStop(1, hexToRgba(light.light.color, 0));
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(lx, ly, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
  ctx.save();
  ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
  const w = Math.min(200, ctx.measureText(text).width + 16);
  const h = 24;
  const rx = Math.max(8, x - w / 2);
  const ry = Math.max(8, y - h);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(rx, ry, w, h, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#F8FAFC';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, rx + w / 2, ry + h / 2, w - 10);
  ctx.restore();
}

export function apply2DPostEffects(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  postCanvas: HTMLCanvasElement,
  pCtx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  dpr: number,
  fx: StageSettings['stageEffects']
): void {
  const pw = canvas.width;
  const ph = canvas.height;

  if (fx.pixelate > 1) {
    const factor = Math.max(2, Math.min(24, Math.round(fx.pixelate)));
    const sw = Math.max(1, Math.floor(pw / factor));
    const sh = Math.max(1, Math.floor(ph / factor));
    if (postCanvas.width !== sw || postCanvas.height !== sh) {
      postCanvas.width = sw;
      postCanvas.height = sh;
    }
    pCtx.imageSmoothingEnabled = false;
    pCtx.clearRect(0, 0, sw, sh);
    pCtx.drawImage(canvas, 0, 0, sw, sh);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, pw, ph);
    ctx.drawImage(postCanvas, 0, 0, sw, sh, 0, 0, pw, ph);
    ctx.restore();
  }

  if (fx.chromatic > 0.25) {
    if (postCanvas.width !== pw || postCanvas.height !== ph) {
      postCanvas.width = pw;
      postCanvas.height = ph;
    }
    pCtx.clearRect(0, 0, pw, ph);
    pCtx.drawImage(canvas, 0, 0);

    const shift = Math.min(12, fx.chromatic) * dpr;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.28;
    ctx.drawImage(postCanvas, -shift, 0);
    ctx.drawImage(postCanvas, shift, 0);
    ctx.restore();
  }

  if (fx.tintAmount > 0.01 && fx.tint) {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = hexToRgba(fx.tint, Math.min(0.65, fx.tintAmount));
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.restore();
  }

  if (fx.vignette > 0.01) {
    ctx.save();
    ctx.scale(dpr, dpr);
    const rad = Math.hypot(cssW, cssH) * 0.56;
    const vGrad = ctx.createRadialGradient(cssW / 2, cssH / 2, rad * 0.42, cssW / 2, cssH / 2, rad);
    vGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vGrad.addColorStop(1, `rgba(2, 6, 23, ${Math.min(0.9, fx.vignette * 0.85)})`);
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.restore();
  }
}
