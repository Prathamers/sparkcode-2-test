import type {
  CameraState,
  CostumeData,
  EngineRunState,
  EngineTelemetry,
  Particle,
  ParticlePreset,
  RuntimeSpriteState,
  RuntimeValue,
  ScriptStack,
  SparkProject,
  SpriteData,
  StageSettings,
} from '../types/project';
import { checkOverlap, raycastBodies, stepPhysicsWorld, type PhysicsBody } from './physics';
import { SparkRenderer } from './renderer';
import { SparkVM, type VMHost } from './vm';

export type TelemetryListener = (telemetry: EngineTelemetry) => void;

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

  private runtimeStage: StageSettings;
  private runtimeSprites: RuntimeSpriteState[] = [];
  private runtimeGlobals: Record<string, RuntimeValue> = {};
  private particles: Particle[] = [];
  private camera: CameraState;
  private selectedSpriteId: string | null = null;
  private cloneSeq = 1;

  // Input state
  private keysDown = new Set<string>();
  private mouseState = { x: 0, y: 0, down: false };

  // Composited costume canvas cache: key = `${spriteId}:${costumeIdx}`
  private textureCache = new Map<string, HTMLCanvasElement>();
  private listeners = new Set<TelemetryListener>();

  // Bound DOM listeners for cleanup
  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;

  constructor(initialProject: SparkProject) {
    this.project = initialProject;
    this.runtimeStage = structuredClone(initialProject.stage);
    this.camera = this.createInitialCamera(this.runtimeStage);
    this.vm = new SparkVM(this.createVMHost());

    if (typeof document !== 'undefined') {
      this.renderer = new SparkRenderer();
    }

    this.onKeyDownBound = this.handleKeyDown.bind(this);
    this.onKeyUpBound = this.handleKeyUp.bind(this);

    this.resetRuntimeState();
    this.rebuildAllCostumeTextures();
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
    if (typeof window !== 'undefined') {
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
  }

  public dispose(): void {
    this.stopLoop();
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.onKeyDownBound);
      window.removeEventListener('keyup', this.onKeyUpBound);
    }
    this.listeners.clear();
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener(this.buildTelemetry());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setSelectedSpriteId(id: string | null): void {
    this.selectedSpriteId = id;
  }

  public setMousePositionFromClient(clientX: number, clientY: number): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const scaleFit = Math.min(cssW / this.runtimeStage.width, cssH / this.runtimeStage.height);
    const camZoom = Math.max(0.2, this.camera.zoom) * scaleFit;
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    this.mouseState.x = this.camera.x + (sx - cssW / 2) / camZoom;
    this.mouseState.y = this.camera.y - (sy - cssH / 2) / camZoom;
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

  /**
   * Syncs live edits from React (costume edits, stage settings, sprite property edits, scripts)
   * without restarting the entire loop.
   */
  public syncProject(project: SparkProject, rebuildTextures = false): void {
    this.project = project;
    this.runtimeStage = structuredClone(project.stage);

    if (this.runState === 'stopped') {
      this.resetRuntimeState();
    } else {
      // Update non-clone sprite static config (light, physics config, scripts already read live from project)
      for (const src of project.sprites) {
        const rt = this.runtimeSprites.find((s) => s.id === src.id);
        if (rt) {
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
    }

    if (rebuildTextures) {
      this.rebuildAllCostumeTextures();
    }
    this.emitTelemetry(true);
  }

  public rebuildCostumeTexture(spriteId: string, costumeIndex: number, costume: CostumeData): void {
    if (typeof document === 'undefined') return;
    const key = `${spriteId}:${costumeIndex}`;
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.max(1, costume.width);
    offscreen.height = Math.max(1, costume.height);
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    this.textureCache.set(key, offscreen);

    const visibleLayers = costume.layers.filter((l) => l.visible && l.dataUrl);
    if (visibleLayers.length === 0) return;

    // Load layers sequentially in order to preserve exact z-order compositing
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
      sprite.costumes.forEach((c, idx) => {
        this.rebuildCostumeTexture(sprite.id, idx, c);
      });
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

  /**
   * Single-step debugger: advances the VM by 1 instruction per thread and physics by 1/60s.
   */
  public stepOnce(): void {
    this.lastError = null;
    if (this.runState === 'stopped') {
      this.resetRuntimeState();
      this.vm.triggerFlag();
      this.runState = 'paused';
    } else if (this.runState === 'running') {
      this.runState = 'paused';
    }
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
    // Ignore typing inside inputs/textareas/selects
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const code = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code) && this.runState === 'running') {
      e.preventDefault();
    }
    const wasDown = this.keysDown.has(code);
    this.keysDown.add(code);
    if (!wasDown && this.runState === 'running') {
      this.vm.triggerKeyPressed(code);
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

      // FPS counter
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

      // Render frame at 60 FPS
      if (this.canvas && this.renderer) {
        const stats = this.renderer.render(
          this.canvas,
          this.runtimeStage,
          this.camera,
          this.runtimeSprites,
          this.particles,
          (sourceId, costumeIdx) => this.textureCache.get(`${sourceId}:${costumeIdx}`) ?? null,
          this.simTime + (this.runState === 'stopped' ? now * 0.001 : 0),
          this.selectedSpriteId
        );
        this.lastDrawCalls = stats.drawCalls;
      }

      // Throttle telemetry notifications to React (~15 FPS = 66ms)
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

    // 1. Step VM threads
    this.vm.stepTick(dt, singleStepMode);

    // 2. Step Rigid-Body Physics
    const bodies: PhysicsBody[] = this.runtimeSprites.map((s) => ({
      id: s.id,
      x: s.x,
      y: s.y,
      vx: s.vx,
      vy: s.vy,
      width: s.width,
      height: s.height,
      scaleX: s.scaleX,
      scaleY: s.scaleY,
      enabled: s.physics.enabled,
      isStatic: s.physics.isStatic,
      solid: s.physics.solid,
      shape: s.physics.shape,
      mass: s.physics.mass,
      friction: s.physics.friction,
      restitution: s.physics.restitution,
      gravityScale: s.physics.gravityScale,
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

    // 3. Speech timers & Continuous Particle Emitters
    for (const sp of this.runtimeSprites) {
      if (sp.sayTimer > 0) {
        sp.sayTimer = Math.max(0, sp.sayTimer - dt);
        if (sp.sayTimer === 0) sp.sayText = '';
      }
      if (sp.emitter && sp.emitter.active && sp.visible) {
        sp.emitter.accumulator += sp.emitter.rate * dt;
        const toSpawn = Math.min(8, Math.floor(sp.emitter.accumulator));
        if (toSpawn > 0) {
          sp.emitter.accumulator -= toSpawn;
          this.spawnParticlesAt(sp.x, sp.y, sp.emitter.preset, toSpawn, sp.emitter.color, sp.emitter.speed);
        }
      }
    }

    // 4. Step Particles
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

    // 5. Update Camera Follow, Bounds & Shake
    if (this.camera.followTargetId) {
      const target = this.runtimeSprites.find((s) => s.id === this.camera.followTargetId);
      if (target) {
        const alpha = 1 - Math.pow(1 - Math.max(0.02, Math.min(0.95, this.camera.followSmoothing)), dt * 60);
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
    const maxParticles = 420;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= maxParticles) {
        this.particles.shift();
      }
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.35 + Math.random() * 0.75) * speed;
      let vx = Math.cos(angle) * spd;
      let vy = Math.sin(angle) * spd;
      let size = 4 + Math.random() * 3;
      let endSize = 0.5;
      let maxLife = 0.35 + Math.random() * 0.4;
      let gravity = 0;
      let drag = 1.6;
      let blend: Particle['blend'] = 'add';
      let alpha = 0.95;

      if (preset === 'fire') {
        vx = (Math.random() - 0.5) * speed * 0.55;
        vy = Math.abs(Math.random() * speed * 0.9) + 30;
        size = 6 + Math.random() * 5;
        endSize = 1;
        maxLife = 0.3 + Math.random() * 0.35;
        gravity = 90;
        drag = 1.2;
      } else if (preset === 'smoke') {
        vx = (Math.random() - 0.5) * speed * 0.45;
        vy = 25 + Math.random() * speed * 0.5;
        size = 5 + Math.random() * 4;
        endSize = 14;
        maxLife = 0.55 + Math.random() * 0.45;
        gravity = 40;
        drag = 1.8;
        blend = 'normal';
        alpha = 0.5;
      } else if (preset === 'sparks') {
        size = 2.5 + Math.random() * 2.2;
        endSize = 0.4;
        maxLife = 0.25 + Math.random() * 0.32;
        gravity = -360;
        drag = 1.1;
      } else if (preset === 'trail') {
        vx = (Math.random() - 0.5) * speed * 0.25;
        vy = (Math.random() - 0.5) * speed * 0.25;
        size = 4.5 + Math.random() * 2.5;
        endSize = 0.5;
        maxLife = 0.22 + Math.random() * 0.2;
        drag = 2.5;
      } else if (preset === 'plasma') {
        size = 5 + Math.random() * 4;
        endSize = 0.8;
        maxLife = 0.45 + Math.random() * 0.4;
        drag = 0.9;
      }

      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx,
        vy,
        size,
        endSize,
        life: maxLife,
        maxLife,
        color,
        alpha,
        drag,
        gravity,
        blend,
      });
    }
  }

  private createVMHost(): VMHost {
    return {
      getSprite: (id) => this.runtimeSprites.find((s) => s.id === id),
      getAllSprites: () => this.runtimeSprites,
      findSpritesByName: (name) =>
        this.runtimeSprites.filter((s) => s.name.toLowerCase() === name.toLowerCase()),
      getSpriteScripts: (sourceId): ScriptStack[] =>
        this.project.sprites.find((s) => s.id === sourceId)?.scripts ?? [],
      getGlobal: (name) => this.runtimeGlobals[name] ?? 0,
      setGlobal: (name, value) => {
        this.runtimeGlobals[name] = value;
      },
      isKeyDown: (key) => this.keysDown.has(key),
      getMouse: () => this.mouseState,
      getTimer: () => this.simTime,
      isTouching: (spriteId, targetName) => {
        const self = this.runtimeSprites.find((s) => s.id === spriteId);
        if (!self || !self.visible) return false;
        const targets = this.runtimeSprites.filter(
          (s) => s.id !== spriteId && s.visible && s.name.toLowerCase() === targetName.toLowerCase()
        );
        const bodyA: PhysicsBody = {
          ...self,
          ...self.physics,
          id: self.id,
          onGround: self.onGround,
        };
        for (const t of targets) {
          const bodyB: PhysicsBody = { ...t, ...t.physics, id: t.id, onGround: t.onGround };
          if (checkOverlap(bodyA, bodyB)) return true;
        }
        return false;
      },
      raycast: (spriteId, deg, maxDist) => {
        const self = this.runtimeSprites.find((s) => s.id === spriteId);
        if (!self) return { hit: false, distance: maxDist };
        const rad = ((self.rotation + deg) * Math.PI) / 180;
        const x2 = self.x + Math.cos(rad) * maxDist;
        const y2 = self.y + Math.sin(rad) * maxDist;
        const bodies: PhysicsBody[] = this.runtimeSprites
          .filter((s) => s.visible)
          .map((s) => ({ ...s, ...s.physics, id: s.id, onGround: s.onGround }));
        const hit = raycastBodies(self.x, self.y, x2, y2, bodies, spriteId);
        return { hit: hit.hit, distance: hit.distance };
      },
      setGravityY: (gy) => {
        this.runtimeStage.gravityY = gy;
      },
      cameraGoTo: (x, y) => {
        this.camera.followTargetId = null;
        this.camera.x = x;
        this.camera.y = y;
      },
      cameraFollow: (targetNameOrId, spriteId, smoothing) => {
        if (targetNameOrId === 'none' || targetNameOrId === '') {
          this.camera.followTargetId = null;
          return;
        }
        if (targetNameOrId === 'self') {
          this.camera.followTargetId = spriteId;
        } else {
          const found = this.runtimeSprites.find(
            (s) => s.name.toLowerCase() === targetNameOrId.toLowerCase() || s.id === targetNameOrId
          );
          this.camera.followTargetId = found ? found.id : null;
        }
        this.camera.followSmoothing = Math.max(0.02, Math.min(0.95, smoothing || 0.12));
      },
      cameraSetZoom: (zoom) => {
        this.camera.zoom = Math.max(0.25, Math.min(4, zoom));
      },
      cameraShake: (power, secs) => {
        this.camera.shakeIntensity = Math.max(0, power);
        this.camera.shakeDuration = Math.max(0.05, secs);
        this.camera.shakeTimer = Math.max(0.05, secs);
      },
      setStageFx: (fx, amount) => {
        if (fx === 'chromatic') this.runtimeStage.stageEffects.chromatic = Math.max(0, amount);
        else if (fx === 'pixelate') this.runtimeStage.stageEffects.pixelate = Math.max(0, amount);
        else if (fx === 'vignette') this.runtimeStage.stageEffects.vignette = Math.max(0, Math.min(1, amount));
        else if (fx === 'tintAmount') this.runtimeStage.stageEffects.tintAmount = Math.max(0, Math.min(1, amount));
      },
      burstParticles: (spriteId, preset, count, color, speed) => {
        const sp = this.runtimeSprites.find((s) => s.id === spriteId);
        if (!sp) return;
        this.spawnParticlesAt(sp.x, sp.y, preset, count, color, speed);
      },
      setEmitter: (spriteId, active, preset, rate, color) => {
        const sp = this.runtimeSprites.find((s) => s.id === spriteId);
        if (!sp) return;
        sp.emitter = active
          ? { active: true, preset, rate, speed: 90, size: 4, color, accumulator: 0 }
          : null;
      },
      spawnClone: (targetNameOrSelf, callerSpriteId) => {
        if (this.runtimeSprites.length >= 90) return null;
        const caller = this.runtimeSprites.find((s) => s.id === callerSpriteId);
        let sourceData: SpriteData | undefined;
        if (targetNameOrSelf === 'self' && caller) {
          sourceData = this.project.sprites.find((s) => s.id === caller.sourceId);
        } else {
          sourceData = this.project.sprites.find(
            (s) => s.name.toLowerCase() === targetNameOrSelf.toLowerCase()
          );
        }
        if (!sourceData) return null;
        const cloneId = `${sourceData.id}_clone_${this.cloneSeq++}`;
        const clone = this.spriteDataToRuntime(sourceData, cloneId, true);
        if (caller) {
          clone.x = caller.x;
          clone.y = caller.y;
          clone.rotation = caller.rotation;
        }
        this.runtimeSprites.push(clone);
        return clone;
      },
      deleteClone: (spriteId) => {
        const idx = this.runtimeSprites.findIndex((s) => s.id === spriteId && s.isClone);
        if (idx >= 0) {
          this.runtimeSprites.splice(idx, 1);
        }
      },
      getCostumeCount: (sourceId) =>
        this.project.sprites.find((s) => s.id === sourceId)?.costumes.length ?? 1,
    };
  }

  private buildTelemetry(): EngineTelemetry {
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
