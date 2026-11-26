// SPDX-License-Identifier: AGPL-3.0-or-later
import type {
  CameraState,
  Particle,
  RenderBackendMode,
  RuntimeSpriteState,
  StageSettings,
} from '../types/project';
import {
  apply2DPostEffects,
  drawSpeechBubble,
  drawStageBackdrop,
  hexToRgba,
  mapBlendMode,
  render2DLightingPass,
  type StarSeed,
} from './renderer/effects2d';
import { normalizeWebGL2Config, WebGL2LightingBloomPipeline } from './webgl2Pipeline';

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
  private backdropImageCache = new Map<string, HTMLImageElement>();
  private stars: StarSeed[] = [];

  constructor() {
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');
    this.postCanvas = document.createElement('canvas');
    this.postCtx = this.postCanvas.getContext('2d');

    for (let i = 0; i < 95; i++) {
      const s1 = Math.sin(i * 12.9898) * 43758.5453;
      const s2 = Math.sin(i * 78.233) * 43758.5453;
      const s3 = Math.sin(i * 45.164) * 43758.5453;
      this.stars.push({
        x: s1 - Math.floor(s1),
        y: s2 - Math.floor(s2),
        r: 0.6 + (s3 - Math.floor(s3)) * 1.8,
        speed: 8 + (i % 5) * 9,
        alpha: 0.3 + (i % 7) * 0.1,
      });
    }
  }

  public dispose(): void {
    this.webgl2Pipeline?.dispose();
    this.webgl2Pipeline = null;
    this.webgl2Initialized = false;
    this.backdropImageCache.clear();
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

  private getLoadedBackdropImage(url?: string): HTMLImageElement | null {
    if (!url || typeof Image === 'undefined') return null;
    let img = this.backdropImageCache.get(url);
    if (!img) {
      img = new Image();
      img.src = url;
      if (this.backdropImageCache.size > 24) {
        const oldestKey = this.backdropImageCache.keys().next().value;
        if (oldestKey) this.backdropImageCache.delete(oldestKey);
      }
      this.backdropImageCache.set(url, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
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
    const backdropImg = this.getLoadedBackdropImage(stage.backdropUrl);

    if (glConfig.backend === 'webgl2') {
      const pipeline = this.ensureWebGL2();
      if (pipeline?.isAvailable()) {
        const sceneTarget = this.ensureOffscreenCanvas(this.sceneCanvas, this.sceneCtx, targetW, targetH);
        this.sceneCanvas = sceneTarget.canvas;
        this.sceneCtx = sceneTarget.ctx;

        if (this.sceneCtx) {
          let drawCalls = 0;
          const sCtx = this.sceneCtx;
          sCtx.save();
          sCtx.setTransform(1, 0, 0, 1, 0, 0);
          sCtx.clearRect(0, 0, targetW, targetH);
          sCtx.scale(dpr, dpr);
          drawStageBackdrop(sCtx, cssW, cssH, stage, camera, timeSec, this.stars, backdropImg);
          drawCalls += 1 + this.drawSprites(sCtx, sorted, getSpriteTexture, toScreenX, toScreenY, camZoom, false);
          drawCalls += this.drawParticles(sCtx, particles, toScreenX, toScreenY, camZoom);
          sCtx.restore();

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
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, targetW, targetH);
            ctx.drawImage(glCanvas, 0, 0, targetW, targetH);
            ctx.scale(dpr, dpr);
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

    let drawCalls = 0;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    drawStageBackdrop(ctx, cssW, cssH, stage, camera, timeSec, this.stars, backdropImg);
    drawCalls += 1 + this.drawSprites(ctx, sorted, getSpriteTexture, toScreenX, toScreenY, camZoom, true);
    drawCalls += this.drawParticles(ctx, particles, toScreenX, toScreenY, camZoom);

    if ((stage.ambientDarkness > 0.01 || lights.length > 0) && this.lightCtx) {
      render2DLightingPass(
        ctx,
        this.lightCanvas,
        this.lightCtx,
        cssW,
        cssH,
        stage,
        lights,
        occluders,
        toScreenX,
        toScreenY,
        camZoom
      );
      drawCalls += lights.length + 1;
    }

    drawCalls += this.drawOverlays(ctx, sorted, toScreenX, toScreenY, camZoom, selectedSpriteId);
    ctx.restore();

    const fx = stage.stageEffects;
    if ((fx.pixelate > 1 || fx.chromatic > 0.2 || fx.vignette > 0.01 || fx.tintAmount > 0.01) && this.postCtx) {
      apply2DPostEffects(canvas, ctx, this.postCanvas, this.postCtx, cssW, cssH, dpr, fx);
      drawCalls += 1;
    }

    return {
      drawCalls,
      requestedBackend: glConfig.backend,
      activeBackend: 'canvas2d',
      webgl2Supported: this.webgl2Initialized ? Boolean(this.webgl2Pipeline?.isAvailable()) : true,
      fallbackReason:
        glConfig.backend === 'webgl2'
          ? this.webgl2Pipeline?.getFallbackReason() ?? 'WebGL2 unavailable — using 2D Canvas fallback'
          : null,
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
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, s.opacity));
      ctx.globalCompositeOperation = mapBlendMode(s.blendMode);
      ctx.translate(toScreenX(s.x), toScreenY(s.y));
      ctx.scale(camZoom, camZoom);
      ctx.rotate((-s.rotation * Math.PI) / 180);

      if (s.skewX !== 0 || s.skewY !== 0) {
        ctx.transform(
          1,
          Math.tan((s.skewY * Math.PI) / 180),
          Math.tan((s.skewX * Math.PI) / 180),
          1,
          0,
          0
        );
      }

      ctx.scale(s.scaleX, s.scaleY);
      const drawW = s.width;
      const drawH = s.height;
      const ox = -drawW * s.pivotX;
      const oy = -drawH * s.pivotY;

      if (tex) {
        ctx.imageSmoothingEnabled = !(s.effects.pixelate > 1);
        ctx.drawImage(tex, ox, oy, drawW, drawH);
        if (s.effects.tintAmount > 0.01 && s.effects.tint) {
          ctx.globalCompositeOperation = 'source-atop';
          ctx.fillStyle = hexToRgba(s.effects.tint, s.effects.tintAmount);
          ctx.fillRect(ox, oy, drawW, drawH);
        }
      } else {
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(ox, oy, drawW, drawH);
      }

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
    for (const p of particles) {
      const lifeRatio = Math.max(0, Math.min(1, p.life / p.maxLife));
      const radius = Math.max(0.8, (p.endSize + (p.size - p.endSize) * lifeRatio) * camZoom);
      ctx.save();
      ctx.globalCompositeOperation = mapBlendMode(p.blend);
      ctx.globalAlpha = Math.max(0, Math.min(1, lifeRatio * p.alpha));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(toScreenX(p.x), toScreenY(p.y), radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    return particles.length;
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
        drawSpeechBubble(ctx, sx, sy - (s.height * Math.abs(s.scaleY) * camZoom) / 2 - 14, s.sayText);
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
}
