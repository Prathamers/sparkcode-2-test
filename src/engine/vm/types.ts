import type {
  BlockNode,
  EasingType,
  ParticlePreset,
  RuntimeSpriteState,
  RuntimeValue,
  ScriptStack,
} from '../../types/project';

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

export interface ExpressionContext {
  host: VMHost;
  sprite: RuntimeSpriteState;
  frames: ExecutionFrame[];
  depth: number;
  val: (key: string) => RuntimeValue;
  lookupLocal: (frames: ExecutionFrame[], name: string) => { found: boolean; value: RuntimeValue };
  callCustomFunctionSync: (
    sprite: RuntimeSpriteState,
    fnName: string,
    args: RuntimeValue[],
    depth: number
  ) => RuntimeValue;
}

export interface StatementContext {
  host: VMHost;
  thread: ScriptThread;
  sprite: RuntimeSpriteState;
  block: BlockNode;
  depth: number;
  val: (key: string) => RuntimeValue;
  lookupLocal: (frames: ExecutionFrame[], name: string) => { found: boolean; value: RuntimeValue };
  setLocal: (frames: ExecutionFrame[], name: string, value: RuntimeValue) => void;
  findFunctionDef: (sprite: RuntimeSpriteState, fnName: string) => { params: string[]; body: BlockNode[] } | null;
  triggerBroadcast: (message: string) => void;
  triggerCloneStart: (cloneSprite: RuntimeSpriteState) => void;
}

export type ExpressionHandler = (ctx: ExpressionContext) => RuntimeValue;
/** Returns true when the thread should yield until the next simulation frame. */
export type StatementHandler = (ctx: StatementContext) => boolean;

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
