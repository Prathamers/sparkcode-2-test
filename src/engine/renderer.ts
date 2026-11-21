import type {
  BlendModeType,
  CameraState,
  Particle,
  RenderBackendMode,
  RuntimeSpriteState,
  StageSettings,
} from '../types/project';
import {
  normalizeWebGL2Config,
  WebGL2LightingBloomPipeline,
} from './webgl2Pipeline';

function mapBlendMode(mode: BlendModeType): GlobalCompositeOperation {
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

function hexToRgba(hex: string, alpha: number): string {
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

export interface RenderFrameStats {
  drawCalls: number;
  requestedBackend: RenderBackendMode;
  activeBackend: RenderBackendMode;
  webgl2Supported: boolean;
  fallbackReason: string | null;
}

export class SparkRenderer {
  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D | null;
  private postCanvas: HTMLCanvasElement;
  private postCtx: CanvasRenderingContext2D | null;
  private sceneCanvas: HTMLCanvasElement | null = null;
  private sceneCtx: CanvasRenderingContext2D | null = null;
  private spriteMaskCanvas: HTMLCanvasElement | null = null;
  private spriteMaskCtx: CanvasRenderingContext2D | null = null;
  private webgl2Pipeline: WebGL2LightingBloomPipeline | null = null;
  private webgl2Initialized = false;
  private stars: Array<{ x: number; y: number; r: number; speed: number; alpha: number }> = [];

  constructor() {
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');
    this.postCanvas = document.createElement('canvas');
    this.postCtx = this.postCanvas.getContext('2d');

    // Deterministic procedural starfield
    for (let i = 0; i < 95; i++) {
      const s1 = Math.sin(i * 12.9898) * 43758.5453;
      const s2 = Math.sin(i * 78.233) * 43758.5453;
      const s3 = Math.sin(i * 45.164) * 43758.5453;
      this.stars.push({
        x: (s1 - Math.floor(s1)),
        y: (s2 - Math.floor(s2)),
        r: 0.6 + (s3 - Math.floor(s3)) * 1.8,
        speed: 8 + (i % 5) * 9,
        alpha: 0.3 + (i % 7) * 0.1,
      });
    }
  }

  public dispose(): void {
    if (this.webgl2Pipeline) {
      this.webgl2Pipeline.dispose();
      this.webgl2Pipeline = null;
    }
    this.webgl2Initialized = false;
  }

  private ensureWebGL2(): WebGL2LightingBloomPipeline | null {
    if (!this.webgl2Initialized) {
      this.webgl2Initialized = true;
      this.webgl2Pipeline = new WebGL2LightingBloomPipeline();
    }
    return this.webgl2Pipeline;
  }

  private ensureOffscreenCanvas(
    existing: HTMLCanvasElement | null,
    existingCtx: CanvasRenderingContext2D | null,
    w: number,
    h: number
  ): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null } {
    const canvas = existing ?? document.createElement('canvas');
    const ctx = existingCtx ?? canvas.getContext('2d');
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return { canvas, ctx };
  }

  public render(
    canvas: HTMLCanvasElement,
    stage: StageSettings,
    camera: CameraState,
    sprites: RuntimeSpriteState[],
    particles: Particle[],
    getSpriteTexture: (sourceId: string, costumeIdx: number) => HTMLCanvasElement | null,
    timeSec: number,
    selectedSpriteId: string | null
  ): RenderFrameStats {
    const ctx = canvas.getContext('2d');
    const glConfig = normalizeWebGL2Config(stage.webgl2);
    if (!ctx) {
      return {
        drawCalls: 0,
        requestedBackend: glConfig.backend,
        activeBackend: 'canvas2d',
        webgl2Supported: false,
        fallbackReason: '2D canvas context unavailable',
      };
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.max(1, canvas.clientWidth || stage.width);
    const cssH = Math.max(1, canvas.clientHeight || stage.height);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    // World-to-screen transform (Y-up world space centered on stage, mapped to Canvas Y-down)
    const scaleFit = Math.min(cssW / stage.width, cssH / stage.height);
    const camZoom = Math.max(0.2, camera.zoom) * scaleFit;
    const camX = camera.x + camera.offsetX;
    const camY = camera.y + camera.offsetY;

    const toScreenX = (wx: number) => cssW / 2 + (wx - camX) * camZoom;
    const toScreenY = (wy: number) => cssH / 2 - (wy - camY) * camZoom;

    const sorted = [...sprites]
      .filter((s) => s.visible && s.opacity > 0.005)
      .sort((a, b) => a.zIndex - b.zIndex);
    const lights = sorted.filter((s) => s.light.type !== 'none' && s.light.intensity > 0.01);
    const occluders = sorted.filter((s) => s.light.castsShadow && s.physics.solid);

    // Optional GPU-accelerated WebGL2 Hardware Shadow, Normal-Mapping & Bloom Pass
    if (glConfig.backend === 'webgl2') {
      const pipeline = this.ensureWebGL2();
      if (pipeline && pipeline.isAvailable()) {
        const sceneTarget = this.ensureOffscreenCanvas(
          this.sceneCanvas,
          this.sceneCtx,
          targetW,
          targetH
        );
        this.sceneCanvas = sceneTarget.canvas;
        this.sceneCtx = sceneTarget.ctx;

        if (this.sceneCtx) {
          let drawCalls = 0;
          const sCtx = this.sceneCtx;
          sCtx.save();
          sCtx.setTransform(1, 0, 0, 1, 0, 0);
          sCtx.clearRect(0, 0, targetW, targetH);
          sCtx.scale(dpr, dpr);

          // 1. Background Shader Pass into scene albedo buffer
          this.drawBackground(sCtx, cssW, cssH, stage, camera, timeSec);
          drawCalls += 1;

          // 2. Z-Index Sorted Sprites Pass into scene albedo buffer
          drawCalls += this.drawSprites(sCtx, sorted, getSpriteTexture, toScreenX, toScreenY, camZoom, false);

          // 3. Particle System Pass into scene albedo buffer
          drawCalls += this.drawParticles(sCtx, particles, toScreenX, toScreenY, camZoom);
          sCtx.restore();

          // Optional sprites-only alpha/height buffer for GPU Sobel Normal Map generation
          let spriteMask: HTMLCanvasElement | null = null;
          if (glConfig.normalMapping) {
            const maskTarget = this.ensureOffscreenCanvas(
              this.spriteMaskCanvas,
              this.spriteMaskCtx,
              targetW,
              targetH
            );
            this.spriteMaskCanvas = maskTarget.canvas;
            this.spriteMaskCtx = maskTarget.ctx;
            if (this.spriteMaskCtx) {
              const mCtx = this.spriteMaskCtx;
              mCtx.save();
              mCtx.setTransform(1, 0, 0, 1, 0, 0);
              mCtx.clearRect(0, 0, targetW, targetH);
              mCtx.scale(dpr, dpr);
              this.drawSprites(mCtx, sorted, getSpriteTexture, toScreenX, toScreenY, camZoom, false);
              mCtx.restore();
              spriteMask = this.spriteMaskCanvas;
            }
          }

          // 4. Execute GPU WebGL2 Deferred Normal Lighting, Analytic Soft Shadows, HDR Bloom & Post-FX
          const gpuPasses = pipeline.render({
            sceneCanvas: this.sceneCanvas,
            spriteCanvas: spriteMask,
            width: targetW,
            height: targetH,
            dpr,
            stage,
            config: glConfig,
            lights,
            occluders,
            toScreenX,
            toScreenY,
            camZoom,
          });

          const glCanvas = pipeline.getOutputCanvas();
          if (gpuPasses > 0 && glCanvas) {
            drawCalls += gpuPasses;

            // Blit GPU output onto visible stage canvas
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, targetW, targetH);
            ctx.drawImage(glCanvas, 0, 0, targetW, targetH);
            ctx.scale(dpr, dpr);

            // 5. Crisp 2D Speech Bubbles & Selected Sprite Reticle on top of GPU output
            drawCalls += this.drawOverlays(ctx, sorted, toScreenX, toScreenY, camZoom, selectedSpriteId);
            ctx.restore();

            return {
              drawCalls,
              requestedBackend: 'webgl2',
              activeBackend: 'webgl2',
              webgl2Supported: true,
              fallbackReason: null,
            };
          }
        }
      }
    }

    // =========================================================================
    // STANDARD / AUTOMATIC FALLBACK: NATIVE 2D CANVAS PIPELINE
    // =========================================================================
    let drawCalls = 0;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // 1. Background Shader Pass
    this.drawBackground(ctx, cssW, cssH, stage, camera, timeSec);
    drawCalls += 1;

    // 2. Z-Index Sorted Sprites Pass
    drawCalls += this.drawSprites(ctx, sorted, getSpriteTexture, toScreenX, toScreenY, camZoom, true);

    // 3. Particle System Pass
    drawCalls += this.drawParticles(ctx, particles, toScreenX, toScreenY, camZoom);

    // 4. Dynamic 2D Lighting & Real-Time Shadow Casting Pass
    if (stage.ambientDarkness > 0.01 || lights.length > 0) {
      this.renderLightingPass(ctx, cssW, cssH, stage, lights, occluders, toScreenX, toScreenY, camZoom);
      drawCalls += lights.length + 1;
    }

    // 5. Speech Bubbles & Selected Sprite Reticle (drawn over lighting so always legible)
    drawCalls += this.drawOverlays(ctx, sorted, toScreenX, toScreenY, camZoom, selectedSpriteId);

    ctx.restore();

    // 6. Stage Post-Processing Shader Pass (pixelate, chromatic aberration, vignette, tint)
    const fx = stage.stageEffects;
    if (fx.pixelate > 1 || fx.chromatic > 0.2 || fx.vignette > 0.01 || fx.tintAmount > 0.01) {
      this.applyPostEffects(canvas, ctx, cssW, cssH, dpr, fx);
      drawCalls += 1;
    }

    const webgl2Supported = this.webgl2Initialized
      ? Boolean(this.webgl2Pipeline?.isAvailable())
      : true;
    const fallbackReason =
      glConfig.backend === 'webgl2'
        ? this.webgl2Pipeline?.getFallbackReason() ?? 'WebGL2 unavailable — using 2D Canvas fallback'
        : null;

    return {
      drawCalls,
      requestedBackend: glConfig.backend,
      activeBackend: 'canvas2d',
      webgl2Supported,
      fallbackReason,
    };
  }

  private drawSprites(
    ctx: CanvasRenderingContext2D,
    sorted: RuntimeSpriteState[],
    getSpriteTexture: (sourceId: string, costumeIdx: number) => HTMLCanvasElement | null,
    toScreenX: (wx: number) => number,
    toScreenY: (wy: number) => number,
    camZoom: number,
    drawCoreHalos: boolean
  ): number {
    let draws = 0;
    for (const s of sorted) {
      const tex = getSpriteTexture(s.sourceId, s.activeCostumeIndex);
      const sx = toScreenX(s.x);
      const sy = toScreenY(s.y);

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, s.opacity));
      ctx.globalCompositeOperation = mapBlendMode(s.blendMode);
      ctx.translate(sx, sy);
      ctx.scale(camZoom, camZoom);
      // Y-up rotation -> canvas clockwise is negative
      ctx.rotate((-s.rotation * Math.PI) / 180);

      if (s.skewX !== 0 || s.skewY !== 0) {
        const tanX = Math.tan((s.skewX * Math.PI) / 180);
        const tanY = Math.tan((s.skewY * Math.PI) / 180);
        ctx.transform(1, tanY, tanX, 1, 0, 0);
      }

      ctx.scale(s.scaleX, s.scaleY);

      const drawW = s.width;
      const drawH = s.height;
      const ox = -drawW * s.pivotX;
      const oy = -drawH * s.pivotY;

      if (tex) {
        ctx.imageSmoothingEnabled = !(s.effects.pixelate > 1);
        ctx.drawImage(tex, ox, oy, drawW, drawH);

        // Optional per-sprite tint overlay
        if (s.effects.tintAmount > 0.01 && s.effects.tint) {
          ctx.globalCompositeOperation = 'source-atop';
          ctx.fillStyle = hexToRgba(s.effects.tint, s.effects.tintAmount);
          ctx.fillRect(ox, oy, drawW, drawH);
        }
      } else {
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(ox, oy, drawW, drawH);
      }

      // Subtle light emitter core halo (2D path draws here; WebGL2 computes volumetric halo + bloom on GPU)
      if (drawCoreHalos && s.light.type !== 'none') {
        ctx.globalCompositeOperation = 'lighter';
        const r = Math.max(drawW, drawH) * 0.7;
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
        grad.addColorStop(0, hexToRgba(s.light.color, 0.35 * s.light.intensity));
        grad.addColorStop(1, hexToRgba(s.light.color, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      draws += 1;
    }
    return draws;
  }

  private drawParticles(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    toScreenX: (wx: number) => number,
    toScreenY: (wy: number) => number,
    camZoom: number
  ): number {
    let draws = 0;
    for (const p of particles) {
      const lifeRatio = Math.max(0, Math.min(1, p.life / p.maxLife));
      const radius = Math.max(0.8, (p.endSize + (p.size - p.endSize) * lifeRatio) * camZoom);
      const px = toScreenX(p.x);
      const py = toScreenY(p.y);
      ctx.save();
      ctx.globalCompositeOperation = mapBlendMode(p.blend);
      ctx.globalAlpha = Math.max(0, Math.min(1, lifeRatio * p.alpha));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      draws += 1;
    }
    return draws;
  }

  private drawOverlays(
    ctx: CanvasRenderingContext2D,
    sorted: RuntimeSpriteState[],
    toScreenX: (wx: number) => number,
    toScreenY: (wy: number) => number,
    camZoom: number,
    selectedSpriteId: string | null
  ): number {
    let draws = 0;
    for (const s of sorted) {
      const sx = toScreenX(s.x);
      const sy = toScreenY(s.y);
      if (s.sayText && s.sayTimer > 0) {
        this.drawSpeechBubble(ctx, sx, sy - (s.height * Math.abs(s.scaleY) * camZoom) / 2 - 14, s.sayText);
        draws += 1;
      }
      if (selectedSpriteId && s.id === selectedSpriteId) {
        const hw = (s.width * Math.abs(s.scaleX) * camZoom) / 2 + 4;
        const hh = (s.height * Math.abs(s.scaleY) * camZoom) / 2 + 4;
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
        ctx.lineWidth = 1.25;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(sx - hw, sy - hh, hw * 2, hh * 2);
        ctx.restore();
      }
    }
    return draws;
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    stage: StageSettings,
    camera: CameraState,
    timeSec: number
  ): void {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, stage.bgColorA);
    grad.addColorStop(1, stage.bgColorB);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    if (stage.backgroundShader === 'solid') return;

    if (stage.backgroundShader === 'grid') {
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
      for (const st of this.stars) {
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
      // Subtle horizon glow
      const glow = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 50);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0)');
      glow.addColorStop(0.5, 'rgba(56, 189, 248, 0.16)');
      glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, horizonY - 40, w, 90);

      // Perspective grid lines below horizon
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
      for (let i = 0; i < 3; i++) {
        const cx = w * (0.25 + i * 0.25) + Math.sin(timeSec * 0.3 + i * 2) * 28;
        const cy = h * (0.35 + (i % 2) * 0.28) + Math.cos(timeSec * 0.25 + i) * 20;
        const rad = Math.max(w, h) * 0.42;
        const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, rad);
        const col = i === 1 ? '#0EA5E9' : i === 2 ? '#6366F1' : '#14B8A6';
        g.addColorStop(0, hexToRgba(col, 0.14));
        g.addColorStop(1, hexToRgba(col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();
    }
  }

  private renderLightingPass(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    stage: StageSettings,
    lights: RuntimeSpriteState[],
    occluders: RuntimeSpriteState[],
    toScreenX: (wx: number) => number,
    toScreenY: (wy: number) => number,
    camZoom: number
  ): void {
    const lCtx = this.lightCtx;
    if (!lCtx) return;

    const lw = Math.max(1, Math.round(w));
    const lh = Math.max(1, Math.round(h));
    if (this.lightCanvas.width !== lw || this.lightCanvas.height !== lh) {
      this.lightCanvas.width = lw;
      this.lightCanvas.height = lh;
    }

    // 1. Fill ambient darkness mask
    lCtx.save();
    lCtx.globalCompositeOperation = 'source-over';
    lCtx.clearRect(0, 0, lw, lh);
    lCtx.fillStyle = hexToRgba(stage.ambientColor || '#050811', stage.ambientDarkness);
    lCtx.fillRect(0, 0, lw, lh);

    // 2. Carve illumination cones/circles using destination-out
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

      // 3. Cast 2D shadow volumes behind solid occluders back onto the darkness mask
      if (occluders.length > 0 && stage.ambientDarkness > 0.15) {
        lCtx.save();
        lCtx.globalCompositeOperation = 'source-over';
        lCtx.fillStyle = hexToRgba(stage.ambientColor || '#050811', stage.ambientDarkness * 0.78);

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

          // Project each edge facing away from light
          const shadowLen = radius * 1.4;
          for (let i = 0; i < 4; i++) {
            const c1 = corners[i];
            const c2 = corners[(i + 1) % 4];
            const mx = (c1.x + c2.x) * 0.5;
            const my = (c1.y + c2.y) * 0.5;
            const ex = c2.x - c1.x;
            const ey = c2.y - c1.y;
            const nx = ey;
            const ny = -ex;
            // Edge faces away from light if dot with (mid - light) > 0
            if (nx * (mx - lx) + ny * (my - ly) > 0) {
              const d1 = Math.hypot(c1.x - lx, c1.y - ly) || 1;
              const d2 = Math.hypot(c2.x - lx, c2.y - ly) || 1;
              const p1x = c1.x + ((c1.x - lx) / d1) * shadowLen;
              const p1y = c1.y + ((c1.y - ly) / d1) * shadowLen;
              const p2x = c2.x + ((c2.x - lx) / d2) * shadowLen;
              const p2y = c2.y + ((c2.y - ly) / d2) * shadowLen;

              lCtx.beginPath();
              lCtx.moveTo(c1.x, c1.y);
              lCtx.lineTo(c2.x, c2.y);
              lCtx.lineTo(p2x, p2y);
              lCtx.lineTo(p1x, p1y);
              lCtx.closePath();
              lCtx.fill();
            }
          }
        }
        lCtx.restore();
      }
    }
    lCtx.restore();

    // Composite darkness + shadows over main canvas
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.lightCanvas, 0, 0, w, h);

    // 4. Additive colored light bloom on top
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

  private drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
    ctx.save();
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    const paddingX = 8;
    const w = Math.min(200, ctx.measureText(text).width + paddingX * 2);
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

  private applyPostEffects(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    cssW: number,
    cssH: number,
    dpr: number,
    fx: StageSettings['stageEffects']
  ): void {
    const pCtx = this.postCtx;
    if (!pCtx) return;

    const pw = canvas.width;
    const ph = canvas.height;

    if (fx.pixelate > 1) {
      const factor = Math.max(2, Math.min(24, Math.round(fx.pixelate)));
      const sw = Math.max(1, Math.floor(pw / factor));
      const sh = Math.max(1, Math.floor(ph / factor));
      if (this.postCanvas.width !== sw || this.postCanvas.height !== sh) {
        this.postCanvas.width = sw;
        this.postCanvas.height = sh;
      }
      pCtx.imageSmoothingEnabled = false;
      pCtx.clearRect(0, 0, sw, sh);
      pCtx.drawImage(canvas, 0, 0, sw, sh);

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, pw, ph);
      ctx.drawImage(this.postCanvas, 0, 0, sw, sh, 0, 0, pw, ph);
      ctx.restore();
    }

    if (fx.chromatic > 0.25) {
      if (this.postCanvas.width !== pw || this.postCanvas.height !== ph) {
        this.postCanvas.width = pw;
        this.postCanvas.height = ph;
      }
      pCtx.clearRect(0, 0, pw, ph);
      pCtx.drawImage(canvas, 0, 0);

      const shift = Math.min(12, fx.chromatic) * dpr;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.28;
      ctx.drawImage(this.postCanvas, -shift, 0);
      ctx.drawImage(this.postCanvas, shift, 0);
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
}
