// SPDX-License-Identifier: AGPL-3.0-or-later
import type {
  CameraState,
  CostumeData,
  EngineRunState,
  EngineTelemetry,
  ImprovedVMConfig,
  Particle,
  ParticlePreset,
  RuntimeSpriteState,
  RuntimeValue,
  SparkProject,
  SpriteData,
  StageSettings,
} from '../types/project';
import { spawnParticleBurst } from './particles';
import { stepPhysicsWorld, type PhysicsBody } from './physics';
import { SparkRenderer } from './renderer';
import { normalizeImprovedVMConfig, SparkVM } from './vm';
import { createEngineVMHost } from './vmHost';
import { normalizeWebGL2Config } from './webgl2Pipeline';

export type TelemetryListener = (telemetry: EngineTelemetry) => void;
export type EntitlementTier = 'plus' | 'pro' | 'elite' | null;

export class SparkEngine {
  private project: SparkProject;
  private canvas: HTMLCanvasElement | null = null;
  private renderer: SparkRenderer | null = null;
  private vm: SparkVM;
  private runState: EngineRunState = 'stopped';
  private rafId: number | null = null;
  private lastFrameTs = 0;
  private simTime = 0;
  private fps = 60;
  private fpsFrames = 0;
  private fpsTimer = 0;
  private lastDrawCalls = 0;
  private lastTelemetryPush = 0;
  private lastError: string | null = null;
  private lastRenderBackend: EngineTelemetry['renderBackend'] = {
    requested: 'canvas2d',
    active: 'canvas2d',
    webgl2Supported: true,
    fallbackReason: null,
  };

  private runtimeStage: StageSettings;
  private runtimeSprites: RuntimeSpriteState[] = [];
  private runtimeGlobals: Record<string, RuntimeValue> = {};
  private particles: Particle[] = [];
  private camera: CameraState;
  private selectedSpriteId: string | null = null;
  private entitlementTier: EntitlementTier = null;
  private cloneSeq = 1;

  private keysDown = new Set<string>();
  private mouseState = { x: 0, y: 0, down: false };
  private textureCache = new Map<string, HTMLCanvasElement>();
  private listeners = new Set<TelemetryListener>();

  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;

  constructor(initialProject: SparkProject) {
    this.project = initialProject;
    this.runtimeStage = structuredClone(initialProject.stage);
    this.camera = this.createInitialCamera(this.runtimeStage);
    this.vm = new SparkVM(this.buildHost());

    if (typeof document !== 'undefined') {
      this.renderer = new SparkRenderer();
    }

    this.onKeyDownBound = this.handleKeyDown.bind(this);
    this.onKeyUpBound = this.handleKeyUp.bind(this);
    this.resetRuntimeState();
    this.rebuildAllCostumeTextures();
  }

  private buildHost() {
    return createEngineVMHost({
      getProject: () => this.project,
      getRuntimeStage: () => this.runtimeStage,
      getRuntimeSprites: () => this.runtimeSprites,
      getRuntimeGlobals: () => this.runtimeGlobals,
      getCamera: () => this.camera,
      isKeyDown: (key) => this.keysDown.has(key),
      getMouse: () => this.mouseState,
      getSimTime: () => this.simTime,
      getMaxClones: () => {
        const vm = this.getEffectiveImprovedVMConfig();
        return vm.enabled && vm.expandedLimits ? 250 : 90;
      },
      nextCloneId: (sourceId) => `${sourceId}_clone_${this.cloneSeq++}`,
      createCloneRuntime: (source, id) => this.spriteDataToRuntime(source, id, true),
      spawnParticlesAt: (x, y, preset, count, color, speed) =>
        this.spawnParticlesAt(x, y, preset, count, color, speed),
    });
  }

  private createInitialCamera(stage: StageSettings): CameraState {
    return {
      x: 0,
      y: 0,
      zoom: stage.defaultZoom || 1,
      followTargetId: null,
      followSmoothing: 0.12,
      shakeIntensity: 0,
      shakeDuration: 0,
      shakeTimer: 0,
      offsetX: 0,
      offsetY: 0,
    };
  }

  public attachCanvas(canvas: HTMLCanvasElement | null): void {
    this.canvas = canvas;
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    if (canvas) {
      window.addEventListener('keydown', this.onKeyDownBound);
      window.addEventListener('keyup', this.onKeyUpBound);
      this.startLoop();
    } else {
      this.stopLoop();
    }
  }

  public dispose(): void {
    this.stopLoop();
    this.renderer?.dispose();
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.onKeyDownBound);
      window.removeEventListener('keyup', this.onKeyUpBound);
    }
    this.listeners.clear();
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener(this.buildTelemetry());
    return () => this.listeners.delete(listener);
  }

  public setSelectedSpriteId(id: string | null): void {
    this.selectedSpriteId = id;
  }

  public setEntitlementTier(tier: EntitlementTier): void {
    if (this.entitlementTier === tier) return;
    this.entitlementTier = tier;
    this.syncImprovedVMConfig();
    this.emitTelemetry(true);
  }

  public getEntitlementTier(): EntitlementTier {
    return this.entitlementTier;
  }

  private isElite(): boolean {
    return this.entitlementTier === 'elite';
  }

  private getEffectiveImprovedVMConfig(): ImprovedVMConfig {
    const norm = normalizeImprovedVMConfig(this.runtimeStage.improvedVM);
    return { ...norm, enabled: this.isElite() && norm.enabled };
  }

  private syncImprovedVMConfig(): void {
    this.vm.configureImprovedMode(this.getEffectiveImprovedVMConfig());
  }

  public setMousePositionFromClient(clientX: number, clientY: number): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const scaleFit = Math.min(cssW / this.runtimeStage.width, cssH / this.runtimeStage.height);
    const camZoom = Math.max(0.2, this.camera.zoom) * scaleFit;
    this.mouseState.x = this.camera.x + (clientX - rect.left - cssW / 2) / camZoom;
    this.mouseState.y = this.camera.y - (clientY - rect.top - cssH / 2) / camZoom;
  }

  public setMouseDown(down: boolean): void {
    this.mouseState.down = down;
  }

  public loadProject(project: SparkProject): void {
    this.project = project;
    this.runState = 'stopped';
    this.vm.clear();
    this.resetRuntimeState();
    this.rebuildAllCostumeTextures();
    this.emitTelemetry(true);
  }

  public syncProject(project: SparkProject, rebuildTextures = false): void {
    this.project = project;
    this.runtimeStage = structuredClone(project.stage);
    this.vm.invalidateSymbolCache();
    this.syncImprovedVMConfig();

    if (this.runState === 'stopped') {
      this.resetRuntimeState();
    } else {
      for (const src of project.sprites) {
        const rt = this.runtimeSprites.find((s) => s.id === src.id);
        if (!rt) continue;
        rt.name = src.name;
        rt.light = { ...src.light };
        rt.effects = { ...src.effects };
        rt.blendMode = src.blendMode;
        rt.zIndex = src.zIndex;
        rt.physics = { ...src.physics };
        const costume = src.costumes[rt.activeCostumeIndex] ?? src.costumes[0];
        if (costume) {
          rt.width = costume.width;
          rt.height = costume.height;
          rt.pivotX = costume.pivotX;
          rt.pivotY = costume.pivotY;
        }
      }
    }

    if (rebuildTextures) this.rebuildAllCostumeTextures();
    this.emitTelemetry(true);
  }

  public rebuildCostumeTexture(spriteId: string, costumeIndex: number, costume: CostumeData): void {
    if (typeof document === 'undefined') return;
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.max(1, costume.width);
    offscreen.height = Math.max(1, costume.height);
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    this.textureCache.set(`${spriteId}:${costumeIndex}`, offscreen);
    const visibleLayers = costume.layers.filter((l) => l.visible && l.dataUrl);
    if (visibleLayers.length === 0) return;

    const images: Array<{ img: HTMLImageElement; opacity: number }> = [];
    let loaded = 0;
    visibleLayers.forEach((layer, idx) => {
      const img = new Image();
      img.onload = () => {
        images[idx] = { img, opacity: layer.opacity };
        loaded += 1;
        if (loaded === visibleLayers.length) {
          ctx.clearRect(0, 0, offscreen.width, offscreen.height);
          for (const item of images) {
            if (!item) continue;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, item.opacity));
            ctx.drawImage(item.img, 0, 0, offscreen.width, offscreen.height);
            ctx.restore();
          }
        }
      };
      img.src = layer.dataUrl;
    });
  }

  public rebuildAllCostumeTextures(): void {
    if (typeof document === 'undefined') return;
    this.textureCache.clear();
    for (const sprite of this.project.sprites) {
      sprite.costumes.forEach((c, idx) => this.rebuildCostumeTexture(sprite.id, idx, c));
    }
  }

  public run(): void {
    this.lastError = null;
    if (this.runState === 'paused') {
      this.runState = 'running';
      this.emitTelemetry(true);
      return;
    }
    this.resetRuntimeState();
    this.runState = 'running';
    this.vm.triggerFlag();
    this.emitTelemetry(true);
  }

  public pause(): void {
    if (this.runState === 'running') {
      this.runState = 'paused';
      this.emitTelemetry(true);
    }
  }

  public stop(): void {
    this.runState = 'stopped';
    this.vm.clear();
    this.resetRuntimeState();
    this.emitTelemetry(true);
  }

  public stepOnce(): void {
    this.lastError = null;
    if (this.runState === 'stopped') {
      this.resetRuntimeState();
      this.vm.triggerFlag();
    }
    this.runState = 'paused';
    this.stepSimulation(1 / 60, true);
    this.emitTelemetry(true);
  }

  public getRunState(): EngineRunState {
    return this.runState;
  }

  public getTelemetry(): EngineTelemetry {
    return this.buildTelemetry();
  }

  private resetRuntimeState(): void {
    this.simTime = 0;
    this.particles = [];
    this.runtimeStage = structuredClone(this.project.stage);
    this.runtimeGlobals = structuredClone(this.project.globals);
    this.camera = this.createInitialCamera(this.runtimeStage);
    this.runtimeSprites = this.project.sprites.map((sp) => this.spriteDataToRuntime(sp, sp.id, false));
    this.syncImprovedVMConfig();
  }

  private spriteDataToRuntime(sp: SpriteData, runtimeId: string, isClone: boolean): RuntimeSpriteState {
    const costume = sp.costumes[sp.activeCostumeIndex] ?? sp.costumes[0];
    return {
      id: runtimeId,
      sourceId: sp.id,
      name: sp.name,
      isClone,
      x: sp.x,
      y: sp.y,
      vx: 0,
      vy: 0,
      rotation: sp.rotation,
      scaleX: sp.scaleX,
      scaleY: sp.scaleY,
      skewX: sp.skewX,
      skewY: sp.skewY,
      zIndex: sp.zIndex,
      opacity: sp.opacity,
      visible: sp.visible,
      blendMode: sp.blendMode,
      activeCostumeIndex: sp.activeCostumeIndex,
      width: costume?.width ?? 48,
      height: costume?.height ?? 48,
      pivotX: costume?.pivotX ?? 0.5,
      pivotY: costume?.pivotY ?? 0.5,
      physics: { ...sp.physics },
      light: { ...sp.light },
      effects: { ...sp.effects },
      sayText: '',
      sayTimer: 0,
      onGround: false,
      emitter: null,
    };
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && this.runState === 'running') {
      e.preventDefault();
    }
    const wasDown = this.keysDown.has(e.code);
    this.keysDown.add(e.code);
    if (!wasDown && this.runState === 'running') {
      this.vm.triggerKeyPressed(e.code);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code);
  }

  private startLoop(): void {
    if (this.rafId !== null) return;
    this.lastFrameTs = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastFrameTs) / 1000;
      this.lastFrameTs = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      this.fpsFrames += 1;
      this.fpsTimer += rawDt;
      if (this.fpsTimer >= 0.5) {
        this.fps = Math.round(this.fpsFrames / this.fpsTimer);
        this.fpsFrames = 0;
        this.fpsTimer = 0;
      }

      if (this.runState === 'running') {
        try {
          this.stepSimulation(dt, false);
        } catch (err) {
          this.lastError = err instanceof Error ? err.message : String(err);
          this.runState = 'paused';
        }
      }

      if (this.canvas && this.renderer) {
        const glCfg = normalizeWebGL2Config(this.runtimeStage.webgl2);
        const renderStage: StageSettings =
          !this.isElite() && glCfg.backend === 'webgl2'
            ? { ...this.runtimeStage, webgl2: { ...glCfg, backend: 'canvas2d' } }
            : this.runtimeStage;
        const stats = this.renderer.render(
          this.canvas,
          renderStage,
          this.camera,
          this.runtimeSprites,
          this.particles,
          (sourceId, costumeIdx) => this.textureCache.get(`${sourceId}:${costumeIdx}`) ?? null,
          this.simTime + (this.runState === 'stopped' ? now * 0.001 : 0),
          this.selectedSpriteId
        );
        this.lastDrawCalls = stats.drawCalls;
        this.lastRenderBackend = {
          requested: stats.requestedBackend,
          active: stats.activeBackend,
          webgl2Supported: stats.webgl2Supported,
          fallbackReason: stats.fallbackReason,
        };
      }

      if (now - this.lastTelemetryPush >= 66) {
        this.lastTelemetryPush = now;
        this.emitTelemetry(false);
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private stepSimulation(dt: number, singleStepMode: boolean): void {
    this.simTime += dt;
    this.vm.stepTick(dt, singleStepMode);

    const bodies: PhysicsBody[] = this.runtimeSprites.map((s) => ({
      ...s,
      ...s.physics,
      id: s.id,
      onGround: s.onGround,
    }));
    stepPhysicsWorld(
      bodies,
      {
        gravityX: this.runtimeStage.gravityX,
        gravityY: this.runtimeStage.gravityY,
        airDrag: this.runtimeStage.airDrag,
      },
      dt
    );
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const sp = this.runtimeSprites[i];
      sp.x = b.x;
      sp.y = b.y;
      sp.vx = b.vx;
      sp.vy = b.vy;
      sp.onGround = b.onGround;
    }

    for (const sp of this.runtimeSprites) {
      if (sp.sayTimer > 0) {
        sp.sayTimer = Math.max(0, sp.sayTimer - dt);
        if (sp.sayTimer === 0) sp.sayText = '';
      }
      if (sp.emitter?.active && sp.visible) {
        sp.emitter.accumulator += sp.emitter.rate * dt;
        const toSpawn = Math.min(8, Math.floor(sp.emitter.accumulator));
        if (toSpawn > 0) {
          sp.emitter.accumulator -= toSpawn;
          this.spawnParticlesAt(sp.x, sp.y, sp.emitter.preset, toSpawn, sp.emitter.color, sp.emitter.speed);
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      const damp = Math.max(0, 1 - p.drag * dt);
      p.vx *= damp;
      p.vy *= damp;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    this.updateCamera(dt);
  }

  private updateCamera(dt: number): void {
    if (this.camera.followTargetId) {
      const target = this.runtimeSprites.find((s) => s.id === this.camera.followTargetId);
      if (target) {
        const smooth = Math.max(0.02, Math.min(0.95, this.camera.followSmoothing));
        const alpha = 1 - Math.pow(1 - smooth, dt * 60);
        this.camera.x += (target.x - this.camera.x) * alpha;
        this.camera.y += (target.y - this.camera.y) * alpha;
      }
    }
    if (this.runtimeStage.cameraBounds.enabled) {
      const b = this.runtimeStage.cameraBounds;
      this.camera.x = Math.max(b.minX, Math.min(b.maxX, this.camera.x));
      this.camera.y = Math.max(b.minY, Math.min(b.maxY, this.camera.y));
    }
    if (this.camera.shakeTimer > 0) {
      this.camera.shakeTimer = Math.max(0, this.camera.shakeTimer - dt);
      const decay = this.camera.shakeDuration > 0 ? this.camera.shakeTimer / this.camera.shakeDuration : 0;
      const mag = this.camera.shakeIntensity * decay;
      this.camera.offsetX = (Math.random() * 2 - 1) * mag;
      this.camera.offsetY = (Math.random() * 2 - 1) * mag;
    } else {
      this.camera.offsetX = 0;
      this.camera.offsetY = 0;
    }
  }

  private spawnParticlesAt(
    x: number,
    y: number,
    preset: ParticlePreset,
    count: number,
    color: string,
    speed: number
  ): void {
    const improved = this.getEffectiveImprovedVMConfig();
    const maxParticles = improved.enabled && improved.expandedLimits ? 1200 : 420;
    spawnParticleBurst(this.particles, maxParticles, x, y, preset, count, color, speed);
  }

  private buildTelemetry(): EngineTelemetry {
    const vmRuntime = this.vm.getRuntimeStats();
    const effectiveVm = this.getEffectiveImprovedVMConfig();
    const expanded = effectiveVm.enabled && effectiveVm.expandedLimits;
    const requestedBackend = this.isElite()
      ? normalizeWebGL2Config(this.runtimeStage.webgl2).backend
      : 'canvas2d';

    return {
      runState: this.runState,
      fps: this.fps,
      drawCalls: this.lastDrawCalls,
      particleCount: this.particles.length,
      cloneCount: this.runtimeSprites.filter((s) => s.isClone).length,
      activeThreadCount: this.vm.threads.length,
      activeBlockIds: this.vm.getActiveBlockIds(),
      globals: structuredClone(this.runtimeGlobals),
      sprites: this.runtimeSprites.map((s) => ({
        id: s.id,
        sourceId: s.sourceId,
        name: s.name,
        isClone: s.isClone,
        x: Math.round(s.x * 10) / 10,
        y: Math.round(s.y * 10) / 10,
        vx: Math.round(s.vx),
        vy: Math.round(s.vy),
        rotation: Math.round(s.rotation),
        scaleX: Math.round(s.scaleX * 100) / 100,
        scaleY: Math.round(s.scaleY * 100) / 100,
        zIndex: s.zIndex,
        visible: s.visible,
        activeCostumeIndex: s.activeCostumeIndex,
        onGround: s.onGround,
        physicsEnabled: s.physics.enabled,
        isStatic: s.physics.isStatic,
      })),
      camera: {
        x: Math.round(this.camera.x),
        y: Math.round(this.camera.y),
        zoom: Math.round(this.camera.zoom * 100) / 100,
      },
      renderBackend: {
        ...this.lastRenderBackend,
        requested: requestedBackend,
        active: this.isElite() ? this.lastRenderBackend.active : 'canvas2d',
      },
      vmStats: {
        improvedActive: vmRuntime.improvedActive,
        stepBudget: vmRuntime.stepBudget,
        stepsLastTick: vmRuntime.stepsLastTick,
        fastSymbolCache: vmRuntime.fastSymbolCache,
        maxClones: expanded ? 250 : 90,
        maxParticles: expanded ? 1200 : 420,
      },
      lastError: this.lastError,
    };
  }

  private emitTelemetry(force: boolean): void {
    if (!force && this.listeners.size === 0) return;
    const snap = this.buildTelemetry();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }
}
