// SPDX-License-Identifier: AGPL-3.0-or-later
export type BlendModeType = 'normal' | 'add' | 'multiply' | 'screen';

export type BackgroundShaderType = 'grid' | 'starfield' | 'nebula' | 'synthwave' | 'solid';

export type LightType = 'none' | 'point' | 'spot';

export type ColliderShape = 'aabb' | 'circle';

export type EasingType = 'linear' | 'easeInOut' | 'bounce' | 'elastic';

export type ParticlePreset = 'fire' | 'smoke' | 'sparks' | 'trail' | 'plasma';

export type RenderBackendMode = 'canvas2d' | 'webgl2';

export interface WebGL2RenderConfig {
  /** 'webgl2' uses GPU shadow + normal-mapped lighting + bloom pass; automatically falls back to 'canvas2d' if unavailable */
  backend: RenderBackendMode;
  /** Enable GPU Sobel normal-mapped diffuse + specular lighting on sprites */
  normalMapping: boolean;
  /** Surface normal relief intensity (0..3) */
  normalStrength: number;
  /** Enable GPU analytic soft shadow casting from solid occluders */
  hardwareShadows: boolean;
  /** Soft shadow penumbra spread (0..1) */
  shadowSoftness: number;
  /** Enable GPU bright-pass + separable Gaussian HDR bloom */
  bloomEnabled: boolean;
  /** Bloom luminance threshold (0.2..0.95) */
  bloomThreshold: number;
  /** Additive bloom strength (0..2.5) */
  bloomIntensity: number;
  /** Separable Gaussian blur spread radius in texels (1..6) */
  bloomRadius: number;
}

export interface ImprovedVMConfig {
  /** Enable Experimental Improved SparkVM (Elite Members Only) */
  enabled: boolean;
  /** Turbo instruction budget per thread per tick (standard 48; improved 128..1024) */
  stepBudget: number;
  /** Enable O(1) sprite/function lookup caching per tick */
  fastSymbolCache: boolean;
  /** Expand runtime caps (250 clones & 1,200 particles vs standard 90 / 420) */
  expandedLimits: boolean;
}

export type BlockCategory =
  | 'events'
  | 'motion'
  | 'looks'
  | 'physics'
  | 'camera'
  | 'particles'
  | 'control'
  | 'sensing'
  | 'data'
  | 'functions';

export type BlockShape = 'hat' | 'stack' | 'c-block' | 'reporter' | 'boolean';

export type ParamType = 'number' | 'string' | 'boolean' | 'any';

export type RuntimeValue =
  | number
  | string
  | boolean
  | RuntimeValue[]
  | { [key: string]: RuntimeValue };

export interface BlockInput {
  type: 'literal' | 'block';
  value: string | number | boolean;
  block?: BlockNode;
}

export interface BlockNode {
  id: string;
  opcode: string;
  inputs: Record<string, BlockInput>;
  /** Nested statements inside C-blocks (e.g., forever, repeat, if) */
  body?: BlockNode[];
  /** Secondary branch for if-else blocks */
  elseBody?: BlockNode[];
}

export interface ScriptStack {
  id: string;
  x: number;
  y: number;
  blocks: BlockNode[];
}

export interface CustomFunctionParam {
  name: string;
  type: ParamType;
}

export interface CustomFunctionDef {
  id: string;
  name: string;
  params: CustomFunctionParam[];
  returnsValue: boolean;
}

export interface CostumeLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  /** PNG data URL or empty string if blank */
  dataUrl: string;
}

export interface CostumeData {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Pivot / origin point in normalized 0..1 coordinates (0.5, 0.5 = center) */
  pivotX: number;
  pivotY: number;
  layers: CostumeLayer[];
  /** Flattened cached preview dataUrl (automatically refreshed on edit) */
  previewUrl?: string;
}

export interface LightConfig {
  type: LightType;
  color: string;
  radius: number;
  intensity: number;
  /** Spotlight cone angle in degrees (10..180) */
  angle: number;
  /** Whether this sprite casts shadows when hit by lights */
  castsShadow: boolean;
}

export interface PhysicsConfig {
  enabled: boolean;
  isStatic: boolean;
  shape: ColliderShape;
  mass: number;
  friction: number;
  restitution: number;
  gravityScale: number;
  solid: boolean;
}

export interface VisualEffects {
  chromatic: number; // 0..10
  pixelate: number; // 0..20
  vignette: number; // 0..1
  tint: string; // hex or ''
  tintAmount: number; // 0..1
}

export interface SpriteData {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number; // degrees
  scaleX: number;
  scaleY: number;
  skewX: number; // degrees
  skewY: number; // degrees
  zIndex: number;
  opacity: number; // 0..1
  visible: boolean;
  blendMode: BlendModeType;
  activeCostumeIndex: number;
  costumes: CostumeData[];
  physics: PhysicsConfig;
  light: LightConfig;
  effects: VisualEffects;
  scripts: ScriptStack[];
  functions: CustomFunctionDef[];
}

export interface StageSettings {
  width: number;
  height: number;
  gravityX: number;
  gravityY: number;
  airDrag: number;
  ambientDarkness: number; // 0..0.95
  ambientColor: string;
  backgroundShader: BackgroundShaderType;
  bgColorA: string;
  bgColorB: string;
  cameraBounds: {
    enabled: boolean;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  defaultZoom: number;
  stageEffects: VisualEffects;
  /** Optional GPU WebGL2 hardware shadow, normal-mapping & bloom settings (Elite Experimental) */
  webgl2?: WebGL2RenderConfig;
  /** Optional Improved SparkVM turbo execution settings (Elite Experimental) */
  improvedVM?: ImprovedVMConfig;
}

export interface SparkProject {
  version: string;
  id: string;
  name: string;
  description: string;
  stage: StageSettings;
  globals: Record<string, RuntimeValue>;
  watchedGlobals: string[];
  sprites: SpriteData[];
}

export interface RuntimeSpriteState {
  id: string;
  sourceId: string;
  name: string;
  isClone: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
  zIndex: number;
  opacity: number;
  visible: boolean;
  blendMode: BlendModeType;
  activeCostumeIndex: number;
  width: number;
  height: number;
  pivotX: number;
  pivotY: number;
  physics: PhysicsConfig;
  light: LightConfig;
  effects: VisualEffects;
  sayText: string;
  sayTimer: number;
  onGround: boolean;
  emitter: {
    active: boolean;
    preset: ParticlePreset;
    rate: number;
    speed: number;
    size: number;
    color: string;
    accumulator: number;
  } | null;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  followTargetId: string | null;
  followSmoothing: number;
  shakeIntensity: number;
  shakeDuration: number;
  shakeTimer: number;
  offsetX: number;
  offsetY: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  endSize: number;
  life: number;
  maxLife: number;
  color: string;
  alpha: number;
  drag: number;
  gravity: number;
  blend: BlendModeType;
}

export type EngineRunState = 'stopped' | 'running' | 'paused';

export interface EngineTelemetry {
  runState: EngineRunState;
  fps: number;
  drawCalls: number;
  particleCount: number;
  cloneCount: number;
  activeThreadCount: number;
  activeBlockIds: string[];
  globals: Record<string, RuntimeValue>;
  sprites: Array<{
    id: string;
    sourceId: string;
    name: string;
    isClone: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    zIndex: number;
    visible: boolean;
    activeCostumeIndex: number;
    onGround: boolean;
    physicsEnabled: boolean;
    isStatic: boolean;
  }>;
  camera: {
    x: number;
    y: number;
    zoom: number;
  };
  renderBackend: {
    requested: RenderBackendMode;
    active: RenderBackendMode;
    webgl2Supported: boolean;
    fallbackReason: string | null;
  };
  vmStats: {
    improvedActive: boolean;
    stepBudget: number;
    stepsLastTick: number;
    maxClones: number;
    maxParticles: number;
    fastSymbolCache: boolean;
  };
  lastError: string | null;
}
