import type {
  BlockInput,
  BlockNode,
  BlendModeType,
  EasingType,
  LightType,
  ParticlePreset,
  RuntimeSpriteState,
  RuntimeValue,
  ScriptStack,
} from '../types/project';

export interface ActiveTween {
  prop: 'x' | 'y' | 'rotation' | 'scaleX' | 'scaleY' | 'opacity';
  startVal: number;
  targetVal: number;
  elapsed: number;
  duration: number;
  easing: EasingType;
}

export interface ExecutionFrame {
  blocks: BlockNode[];
  index: number;
  kind: 'seq' | 'forever' | 'repeat' | 'function';
  remainingRepeats?: number;
  locals: Record<string, RuntimeValue>;
}

export interface ScriptThread {
  id: string;
  spriteId: string;
  stackId: string;
  frames: ExecutionFrame[];
  waitTimer: number;
  awaitingEvent: string | null;
  activeTween: ActiveTween | null;
  activeBlockId: string | null;
  finished: boolean;
  returnValue?: RuntimeValue;
}

export interface VMHost {
  getSprite(id: string): RuntimeSpriteState | undefined;
  getAllSprites(): RuntimeSpriteState[];
  findSpritesByName(name: string): RuntimeSpriteState[];
  getSpriteScripts(sourceId: string): ScriptStack[];
  getGlobal(name: string): RuntimeValue;
  setGlobal(name: string, value: RuntimeValue): void;
  isKeyDown(key: string): boolean;
  getMouse(): { x: number; y: number; down: boolean };
  getTimer(): number;
  isTouching(spriteId: string, targetName: string): boolean;
  raycast(spriteId: string, deg: number, maxDist: number): { hit: boolean; distance: number };
  setGravityY(gy: number): void;
  cameraGoTo(x: number, y: number): void;
  cameraFollow(targetNameOrId: string, spriteId: string, smoothing: number): void;
  cameraSetZoom(zoom: number): void;
  cameraShake(power: number, secs: number): void;
  setStageFx(fx: string, amount: number): void;
  burstParticles(spriteId: string, preset: ParticlePreset, count: number, color: string, speed: number): void;
  setEmitter(spriteId: string, active: boolean, preset: ParticlePreset, rate: number, color: string): void;
  spawnClone(sourceNameOrSelf: string, callerSpriteId: string): RuntimeSpriteState | null;
  deleteClone(spriteId: string): void;
  getCostumeCount(sourceId: string): number;
}

export function evaluateEasing(t: number, easing: EasingType): number {
  const x = Math.max(0, Math.min(1, t));
  if (easing === 'linear') return x;
  if (easing === 'easeInOut') {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }
  if (easing === 'bounce') {
    const n1 = 7.5625;
    const d1 = 2.75;
    let u = x;
    if (u < 1 / d1) return n1 * u * u;
    if (u < 2 / d1) return n1 * (u -= 1.5 / d1) * u + 0.75;
    if (u < 2.5 / d1) return n1 * (u -= 2.25 / d1) * u + 0.9375;
    return n1 * (u -= 2.625 / d1) * u + 0.984375;
  }
  // elastic
  if (x === 0 || x === 1) return x;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

export function toNumber(v: RuntimeValue | undefined): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') {
    const parsed = parseFloat(v);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function toBoolean(v: RuntimeValue | undefined): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v !== '' && v !== 'false' && v !== '0';
  if (Array.isArray(v)) return v.length > 0;
  if (v && typeof v === 'object') return Object.keys(v).length > 0;
  return false;
}

export function toDisplayString(v: RuntimeValue | undefined): string {
  if (v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return JSON.stringify(v);
}

let threadSeq = 1;

export class SparkVM {
  public threads: ScriptThread[] = [];
  private host: VMHost;
  private maxStepsPerThreadPerTick = 48;

  constructor(host: VMHost) {
    this.host = host;
  }

  public clear(): void {
    this.threads = [];
  }

  public getActiveBlockIds(): string[] {
    const ids = new Set<string>();
    for (const t of this.threads) {
      if (t.finished) continue;
      if (t.activeBlockId) ids.add(t.activeBlockId);
      for (const f of t.frames) {
        const prevIdx = Math.max(0, Math.min(f.blocks.length - 1, f.index - 1));
        const b = f.blocks[prevIdx];
        if (b) ids.add(b.id);
      }
    }
    return Array.from(ids);
  }

  public triggerFlag(): void {
    this.clear();
    for (const sprite of this.host.getAllSprites()) {
      const scripts = this.host.getSpriteScripts(sprite.sourceId);
      for (const stack of scripts) {
        const hat = stack.blocks[0];
        if (hat && hat.opcode === 'event_when_flag' && stack.blocks.length > 1) {
          this.spawnThread(sprite.id, stack.id, stack.blocks.slice(1));
        }
      }
    }
  }

  public triggerKeyPressed(key: string): void {
    for (const sprite of this.host.getAllSprites()) {
      const scripts = this.host.getSpriteScripts(sprite.sourceId);
      for (const stack of scripts) {
        const hat = stack.blocks[0];
        if (hat && hat.opcode === 'event_when_key' && String(hat.inputs.key?.value ?? '') === key) {
          if (stack.blocks.length > 1) {
            this.spawnThread(sprite.id, stack.id, stack.blocks.slice(1));
          }
        }
      }
    }
  }

  public triggerBroadcast(message: string): void {
    // Wake up any awaiting threads first
    for (const thread of this.threads) {
      if (!thread.finished && thread.awaitingEvent === message) {
        thread.awaitingEvent = null;
      }
    }
    // Spawn broadcast handlers
    for (const sprite of this.host.getAllSprites()) {
      const scripts = this.host.getSpriteScripts(sprite.sourceId);
      for (const stack of scripts) {
        const hat = stack.blocks[0];
        if (hat && hat.opcode === 'event_when_broadcast' && String(hat.inputs.message?.value ?? '') === message) {
          if (stack.blocks.length > 1) {
            this.spawnThread(sprite.id, stack.id, stack.blocks.slice(1));
          }
        }
      }
    }
  }

  public triggerCloneStart(cloneSprite: RuntimeSpriteState): void {
    const scripts = this.host.getSpriteScripts(cloneSprite.sourceId);
    for (const stack of scripts) {
      const hat = stack.blocks[0];
      if (hat && hat.opcode === 'event_when_clone' && stack.blocks.length > 1) {
        this.spawnThread(cloneSprite.id, stack.id, stack.blocks.slice(1));
      }
    }
  }

  public spawnThread(
    spriteId: string,
    stackId: string,
    blocks: BlockNode[],
    initialLocals: Record<string, RuntimeValue> = {}
  ): ScriptThread {
    const thread: ScriptThread = {
      id: `thr_${threadSeq++}`,
      spriteId,
      stackId,
      frames: [{ blocks, index: 0, kind: 'seq', locals: { ...initialLocals } }],
      waitTimer: 0,
      awaitingEvent: null,
      activeTween: null,
      activeBlockId: blocks[0]?.id ?? null,
      finished: false,
    };
    this.threads.push(thread);
    return thread;
  }

  public stepTick(dt: number, singleStepMode = false): void {
    // Snapshot current threads so newly spawned threads during this tick wait until next tick
    const currentThreads = [...this.threads];
    for (const thread of currentThreads) {
      if (thread.finished) continue;
      const sprite = this.host.getSprite(thread.spriteId);
      if (!sprite) {
        thread.finished = true;
        continue;
      }

      if (thread.awaitingEvent !== null) {
        continue;
      }

      if (thread.activeTween) {
        const tw = thread.activeTween;
        tw.elapsed += dt;
        const progress = tw.duration <= 0 ? 1 : Math.min(1, tw.elapsed / tw.duration);
        const eased = evaluateEasing(progress, tw.easing);
        const val = tw.startVal + (tw.targetVal - tw.startVal) * eased;
        sprite[tw.prop] = val;
        if (progress >= 1) {
          thread.activeTween = null;
        } else {
          continue;
        }
      }

      if (thread.waitTimer > 0) {
        thread.waitTimer -= dt;
        if (thread.waitTimer > 0) continue;
        thread.waitTimer = 0;
      }

      const limit = singleStepMode ? 1 : this.maxStepsPerThreadPerTick;
      let steps = 0;
      while (!thread.finished && steps < limit) {
        const yielded = this.stepThreadOneBlock(thread, sprite);
        steps += 1;
        if (yielded) break;
      }
    }

    // Prune finished threads
    this.threads = this.threads.filter((t) => !t.finished);
  }

  private lookupLocal(frames: ExecutionFrame[], name: string): { found: boolean; value: RuntimeValue } {
    for (let i = frames.length - 1; i >= 0; i--) {
      if (Object.prototype.hasOwnProperty.call(frames[i].locals, name)) {
        return { found: true, value: frames[i].locals[name] };
      }
    }
    return { found: false, value: 0 };
  }

  private setLocal(frames: ExecutionFrame[], name: string, value: RuntimeValue): void {
    for (let i = frames.length - 1; i >= 0; i--) {
      if (Object.prototype.hasOwnProperty.call(frames[i].locals, name)) {
        frames[i].locals[name] = value;
        return;
      }
    }
    const top = frames[frames.length - 1];
    if (top) {
      top.locals[name] = value;
    }
  }

  private findFunctionDef(sprite: RuntimeSpriteState, fnName: string): {
    params: string[];
    body: BlockNode[];
  } | null {
    const scripts = this.host.getSpriteScripts(sprite.sourceId);
    for (const stack of scripts) {
      const hat = stack.blocks[0];
      if (hat && hat.opcode === 'fn_define' && String(hat.inputs.name?.value ?? '') === fnName) {
        const p1 = String(hat.inputs.param1?.value ?? '').trim();
        const p2 = String(hat.inputs.param2?.value ?? '').trim();
        const params = [p1, p2].filter(Boolean);
        return { params, body: stack.blocks.slice(1) };
      }
    }
    return null;
  }

  /**
   * Synchronously evaluates a custom function reporter call with isolated local scope and return statement.
   */
  public callCustomFunctionSync(
    sprite: RuntimeSpriteState,
    fnName: string,
    args: RuntimeValue[],
    depth = 0
  ): RuntimeValue {
    if (depth > 16) return 0; // Guard against infinite recursion
    const fn = this.findFunctionDef(sprite, fnName);
    if (!fn) return 0;

    const locals: Record<string, RuntimeValue> = {};
    fn.params.forEach((p, idx) => {
      locals[p] = args[idx] ?? 0;
    });

    const tempThread: ScriptThread = {
      id: `fn_sync_${threadSeq++}`,
      spriteId: sprite.id,
      stackId: 'fn_sync',
      frames: [{ blocks: fn.body, index: 0, kind: 'function', locals }],
      waitTimer: 0,
      awaitingEvent: null,
      activeTween: null,
      activeBlockId: null,
      finished: false,
      returnValue: 0,
    };

    let guard = 0;
    while (!tempThread.finished && guard < 256) {
      this.stepThreadOneBlock(tempThread, sprite, depth + 1);
      guard += 1;
    }
    return tempThread.returnValue ?? 0;
  }

  public evalInput(
    input: BlockInput | undefined,
    sprite: RuntimeSpriteState,
    frames: ExecutionFrame[],
    depth = 0
  ): RuntimeValue {
    if (!input) return 0;
    if (input.type === 'literal') {
      return input.value;
    }
    if (!input.block) return 0;
    return this.evalExpression(input.block, sprite, frames, depth);
  }

  public evalExpression(
    block: BlockNode,
    sprite: RuntimeSpriteState,
    frames: ExecutionFrame[],
    depth = 0
  ): RuntimeValue {
    const val = (key: string) => this.evalInput(block.inputs[key], sprite, frames, depth);

    switch (block.opcode) {
      case 'sensing_key_pressed':
        return this.host.isKeyDown(String(val('key')));
      case 'sensing_mouse_down':
        return this.host.getMouse().down;
      case 'sensing_prop': {
        const prop = String(val('prop'));
        const mouse = this.host.getMouse();
        if (prop === 'x') return sprite.x;
        if (prop === 'y') return sprite.y;
        if (prop === 'vx') return sprite.vx;
        if (prop === 'vy') return sprite.vy;
        if (prop === 'rotation') return sprite.rotation;
        if (prop === 'mouseX') return mouse.x;
        if (prop === 'mouseY') return mouse.y;
        if (prop === 'timer') return this.host.getTimer();
        return 0;
      }
      case 'sensing_distance_to': {
        const target = String(val('target'));
        if (target === 'mouse') {
          const m = this.host.getMouse();
          return Math.hypot(m.x - sprite.x, m.y - sprite.y);
        }
        const found = this.host.findSpritesByName(target)[0];
        if (!found) return 9999;
        return Math.hypot(found.x - sprite.x, found.y - sprite.y);
      }
      case 'physics_on_ground':
        return sprite.onGround;
      case 'physics_touching':
        return this.host.isTouching(sprite.id, String(val('target')));
      case 'physics_raycast_hit':
        return this.host.raycast(sprite.id, toNumber(val('deg')), toNumber(val('dist'))).hit;
      case 'physics_raycast_dist':
        return Math.round(this.host.raycast(sprite.id, toNumber(val('deg')), toNumber(val('dist'))).distance);
      case 'op_math': {
        const a = toNumber(val('a'));
        const b = toNumber(val('b'));
        const op = String(val('op'));
        if (op === '+') return a + b;
        if (op === '-') return a - b;
        if (op === '*') return a * b;
        if (op === '/') return b === 0 ? 0 : a / b;
        if (op === '%') return b === 0 ? 0 : a % b;
        return 0;
      }
      case 'op_compare': {
        const rawA = val('a');
        const rawB = val('b');
        const op = String(val('op'));
        const numA = Number(rawA);
        const numB = Number(rawB);
        const bothNumeric = !Number.isNaN(numA) && !Number.isNaN(numB) && rawA !== '' && rawB !== '';
        const a = bothNumeric ? numA : String(rawA);
        const b = bothNumeric ? numB : String(rawB);
        if (op === '>') return a > b;
        if (op === '<') return a < b;
        if (op === '>=') return a >= b;
        if (op === '<=') return a <= b;
        if (op === '==') return a === b;
        if (op === '!=') return a !== b;
        return false;
      }
      case 'op_logic': {
        const a = toBoolean(val('a'));
        const b = toBoolean(val('b'));
        return String(val('op')) === 'or' ? a || b : a && b;
      }
      case 'op_not':
        return !toBoolean(val('a'));
      case 'op_random': {
        const min = toNumber(val('min'));
        const max = toNumber(val('max'));
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      case 'data_get_var': {
        const name = String(val('name'));
        const loc = this.lookupLocal(frames, name);
        if (loc.found) return loc.value;
        return this.host.getGlobal(name);
      }
      case 'data_array_get': {
        const name = String(val('name'));
        const idx = Math.floor(toNumber(val('index')));
        const loc = this.lookupLocal(frames, name);
        const arr = loc.found ? loc.value : this.host.getGlobal(name);
        if (Array.isArray(arr) && idx >= 0 && idx < arr.length) {
          return arr[idx];
        }
        return 0;
      }
      case 'data_dict_get': {
        const name = String(val('name'));
        const key = String(val('key'));
        const loc = this.lookupLocal(frames, name);
        const dict = loc.found ? loc.value : this.host.getGlobal(name);
        if (dict && typeof dict === 'object' && !Array.isArray(dict)) {
          return dict[key] ?? 0;
        }
        return 0;
      }
      case 'fn_call_reporter': {
        const fnName = String(val('name'));
        const arg1 = val('arg1');
        const arg2 = val('arg2');
        return this.callCustomFunctionSync(sprite, fnName, [arg1, arg2], depth);
      }
      default:
        return 0;
    }
  }

  /**
   * Executes one statement block in the thread. Returns true if the thread should yield until the next frame.
   */
  private stepThreadOneBlock(thread: ScriptThread, sprite: RuntimeSpriteState, depth = 0): boolean {
    while (thread.frames.length > 0) {
      const frame = thread.frames[thread.frames.length - 1];
      if (frame.index < frame.blocks.length) {
        break;
      }
      // Frame reached end
      if (frame.kind === 'forever') {
        frame.index = 0;
        return true; // Yield at end of forever loop iteration (60Hz game loop)
      }
      if (frame.kind === 'repeat' && (frame.remainingRepeats ?? 0) > 1) {
        frame.remainingRepeats = (frame.remainingRepeats ?? 1) - 1;
        frame.index = 0;
        return true;
      }
      thread.frames.pop();
    }

    if (thread.frames.length === 0) {
      thread.finished = true;
      thread.activeBlockId = null;
      return true;
    }

    const frame = thread.frames[thread.frames.length - 1];
    const block = frame.blocks[frame.index];
    frame.index += 1;
    thread.activeBlockId = block.id;

    const val = (key: string) => this.evalInput(block.inputs[key], sprite, thread.frames, depth);

    switch (block.opcode) {
      // -------- EVENTS --------
      case 'event_broadcast':
        this.triggerBroadcast(String(val('message')));
        return false;
      case 'event_await':
        thread.awaitingEvent = String(val('message'));
        return true;

      // -------- MOTION --------
      case 'motion_move': {
        const steps = toNumber(val('steps'));
        const rad = (sprite.rotation * Math.PI) / 180;
        sprite.x += Math.cos(rad) * steps;
        sprite.y += Math.sin(rad) * steps;
        return false;
      }
      case 'motion_goto':
        sprite.x = toNumber(val('x'));
        sprite.y = toNumber(val('y'));
        return false;
      case 'motion_change_xy':
        sprite.x += toNumber(val('dx'));
        sprite.y += toNumber(val('dy'));
        return false;
      case 'motion_turn':
        sprite.rotation = (sprite.rotation + toNumber(val('deg'))) % 360;
        return false;
      case 'motion_point_dir':
        sprite.rotation = toNumber(val('deg'));
        return false;
      case 'motion_point_mouse': {
        const m = this.host.getMouse();
        sprite.rotation = (Math.atan2(m.y - sprite.y, m.x - sprite.x) * 180) / Math.PI;
        return false;
      }
      case 'motion_tween': {
        const prop = String(val('prop')) as ActiveTween['prop'];
        const validProps: ActiveTween['prop'][] = ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'opacity'];
        const safeProp = validProps.includes(prop) ? prop : 'x';
        const targetVal = toNumber(val('target'));
        const duration = Math.max(0.01, toNumber(val('secs')));
        const easing = String(val('easing')) as EasingType;
        thread.activeTween = {
          prop: safeProp,
          startVal: sprite[safeProp],
          targetVal,
          elapsed: 0,
          duration,
          easing: ['linear', 'easeInOut', 'bounce', 'elastic'].includes(easing) ? easing : 'easeInOut',
        };
        return true;
      }
      case 'motion_scale':
        sprite.scaleX = toNumber(val('sx'));
        sprite.scaleY = toNumber(val('sy'));
        return false;
      case 'motion_skew':
        sprite.skewX = toNumber(val('skx'));
        sprite.skewY = toNumber(val('sky'));
        return false;

      // -------- LOOKS --------
      case 'looks_costume': {
        const count = Math.max(1, this.host.getCostumeCount(sprite.sourceId));
        const idx = Math.floor(toNumber(val('index')));
        sprite.activeCostumeIndex = ((idx % count) + count) % count;
        return false;
      }
      case 'looks_next_costume': {
        const count = Math.max(1, this.host.getCostumeCount(sprite.sourceId));
        sprite.activeCostumeIndex = (sprite.activeCostumeIndex + 1) % count;
        return false;
      }
      case 'looks_opacity':
        sprite.opacity = Math.max(0, Math.min(1, toNumber(val('alpha'))));
        return false;
      case 'looks_blend':
        sprite.blendMode = String(val('mode')) as BlendModeType;
        return false;
      case 'looks_zindex':
        sprite.zIndex = toNumber(val('z'));
        return false;
      case 'looks_say':
        sprite.sayText = toDisplayString(val('text'));
        sprite.sayTimer = Math.max(0.1, toNumber(val('secs')));
        return false;
      case 'looks_visible':
        sprite.visible = toBoolean(val('state'));
        return false;
      case 'looks_set_light':
        sprite.light = {
          ...sprite.light,
          type: String(val('kind')) as LightType,
          color: String(val('color')),
          radius: Math.max(10, toNumber(val('radius'))),
        };
        return false;

      // -------- PHYSICS --------
      case 'physics_impulse':
        sprite.vx += toNumber(val('ix'));
        sprite.vy += toNumber(val('iy'));
        return false;
      case 'physics_set_velocity':
        sprite.vx = toNumber(val('vx'));
        sprite.vy = toNumber(val('vy'));
        return false;
      case 'physics_set_vx':
        sprite.vx = toNumber(val('vx'));
        return false;
      case 'physics_set_gravity':
        this.host.setGravityY(toNumber(val('gy')));
        return false;
      case 'physics_set_solid':
        sprite.physics.solid = toBoolean(val('solid'));
        return false;

      // -------- CAMERA & FX --------
      case 'camera_goto':
        this.host.cameraGoTo(toNumber(val('x')), toNumber(val('y')));
        return false;
      case 'camera_follow':
        this.host.cameraFollow(String(val('target')), sprite.id, toNumber(val('smooth')));
        return false;
      case 'camera_zoom':
        this.host.cameraSetZoom(toNumber(val('zoom')));
        return false;
      case 'camera_shake':
        this.host.cameraShake(toNumber(val('power')), toNumber(val('secs')));
        return false;
      case 'fx_set_stage':
        this.host.setStageFx(String(val('fx')), toNumber(val('amount')));
        return false;
      case 'fx_set_sprite': {
        const fx = String(val('fx'));
        const amt = toNumber(val('amount'));
        if (fx === 'pixelate') sprite.effects.pixelate = Math.max(0, amt);
        else if (fx === 'chromatic') sprite.effects.chromatic = Math.max(0, amt);
        else if (fx === 'tintAmount') sprite.effects.tintAmount = Math.max(0, Math.min(1, amt));
        return false;
      }

      // -------- PARTICLES --------
      case 'particles_burst':
        this.host.burstParticles(
          sprite.id,
          String(val('preset')) as ParticlePreset,
          Math.max(1, Math.min(80, Math.floor(toNumber(val('count'))))),
          String(val('color')),
          toNumber(val('speed'))
        );
        return false;
      case 'particles_emitter':
        this.host.setEmitter(
          sprite.id,
          String(val('state')) === 'on',
          String(val('preset')) as ParticlePreset,
          Math.max(1, toNumber(val('rate'))),
          String(val('color'))
        );
        return false;

      // -------- CONTROL --------
      case 'control_wait':
        thread.waitTimer = Math.max(0.016, toNumber(val('secs')));
        return true;
      case 'control_forever':
        if (block.body && block.body.length > 0) {
          thread.frames.push({ blocks: block.body, index: 0, kind: 'forever', locals: {} });
        } else {
          return true;
        }
        return false;
      case 'control_repeat': {
        const count = Math.max(0, Math.floor(toNumber(val('times'))));
        if (count > 0 && block.body && block.body.length > 0) {
          thread.frames.push({
            blocks: block.body,
            index: 0,
            kind: 'repeat',
            remainingRepeats: count,
            locals: {},
          });
        }
        return false;
      }
      case 'control_if':
        if (toBoolean(val('condition')) && block.body && block.body.length > 0) {
          thread.frames.push({ blocks: block.body, index: 0, kind: 'seq', locals: {} });
        }
        return false;
      case 'control_if_else': {
        const branch = toBoolean(val('condition')) ? block.body : block.elseBody;
        if (branch && branch.length > 0) {
          thread.frames.push({ blocks: branch, index: 0, kind: 'seq', locals: {} });
        }
        return false;
      }
      case 'control_create_clone': {
        const clone = this.host.spawnClone(String(val('target')), sprite.id);
        if (clone) {
          this.triggerCloneStart(clone);
        }
        return false;
      }
      case 'control_delete_clone':
        if (sprite.isClone) {
          this.host.deleteClone(sprite.id);
          thread.finished = true;
          return true;
        }
        return false;

      // -------- DATA & DICTIONARIES --------
      case 'data_set_global':
        this.host.setGlobal(String(val('name')), val('value'));
        return false;
      case 'data_change_global': {
        const name = String(val('name'));
        const curr = toNumber(this.host.getGlobal(name));
        this.host.setGlobal(name, curr + toNumber(val('delta')));
        return false;
      }
      case 'data_let_local':
        this.setLocal(thread.frames, String(val('name')), val('value'));
        return false;
      case 'data_array_push': {
        const name = String(val('name'));
        const item = val('value');
        const loc = this.lookupLocal(thread.frames, name);
        const existing = loc.found ? loc.value : this.host.getGlobal(name);
        const arr = Array.isArray(existing) ? [...existing, item] : [item];
        if (loc.found) this.setLocal(thread.frames, name, arr);
        else this.host.setGlobal(name, arr);
        return false;
      }
      case 'data_dict_set': {
        const name = String(val('name'));
        const key = String(val('key'));
        const value = val('value');
        const loc = this.lookupLocal(thread.frames, name);
        const existing = loc.found ? loc.value : this.host.getGlobal(name);
        const dict =
          existing && typeof existing === 'object' && !Array.isArray(existing)
            ? { ...existing, [key]: value }
            : { [key]: value };
        if (loc.found) this.setLocal(thread.frames, name, dict);
        else this.host.setGlobal(name, dict);
        return false;
      }

      // -------- FUNCTIONS --------
      case 'fn_call_stack': {
        const fnName = String(val('name'));
        const fn = this.findFunctionDef(sprite, fnName);
        if (fn && fn.body.length > 0) {
          const locals: Record<string, RuntimeValue> = {};
          const args = [val('arg1'), val('arg2')];
          fn.params.forEach((p, idx) => {
            locals[p] = args[idx] ?? 0;
          });
          thread.frames.push({ blocks: fn.body, index: 0, kind: 'function', locals });
        }
        return false;
      }
      case 'fn_return': {
        const retVal = val('value');
        thread.returnValue = retVal;
        // Pop back to enclosing function frame
        while (thread.frames.length > 0) {
          const popped = thread.frames.pop();
          if (popped?.kind === 'function') break;
        }
        if (thread.frames.length === 0) {
          thread.finished = true;
        }
        return false;
      }
      default:
        return false;
    }
  }
}
