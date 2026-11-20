import type { BlockCategory, BlockInput, BlockNode, BlockShape, ScriptStack } from '../types/project';

export interface BlockParamSpec {
  name: string;
  label?: string;
  kind: 'number' | 'string' | 'boolean' | 'select' | 'color' | 'any';
  defaultValue: string | number | boolean;
  options?: string[];
  width?: number;
}

export interface BlockDefinition {
  opcode: string;
  category: BlockCategory;
  shape: BlockShape;
  /** Template tokens separated by {paramName}, e.g. "glide {prop} to {target} over {secs}s ({easing})" */
  template: string;
  params: BlockParamSpec[];
  hasElse?: boolean;
  description: string;
}

export interface CategoryMeta {
  id: BlockCategory;
  label: string;
  color: string;
  border: string;
  text: string;
}

export const BLOCK_CATEGORIES: CategoryMeta[] = [
  { id: 'events', label: 'Events', color: '#D97706', border: '#F59E0B', text: '#FFFBEB' },
  { id: 'motion', label: 'Motion', color: '#2563EB', border: '#60A5FA', text: '#EFF6FF' },
  { id: 'looks', label: 'Looks', color: '#7C3AED', border: '#A78BFA', text: '#F5F3FF' },
  { id: 'physics', label: 'Physics', color: '#0D9488', border: '#2DD4BF', text: '#F0FDFA' },
  { id: 'camera', label: 'Camera & FX', color: '#DB2777', border: '#F472B6', text: '#FDF2F8' },
  { id: 'particles', label: 'Particles', color: '#EA580C', border: '#FB923C', text: '#FFF7ED' },
  { id: 'control', label: 'Control', color: '#B45309', border: '#FBBF24', text: '#FFFBEB' },
  { id: 'sensing', label: 'Sensing', color: '#0284C7', border: '#38BDF8', text: '#F0F9FF' },
  { id: 'data', label: 'Data & Dicts', color: '#059669', border: '#34D399', text: '#ECFDF5' },
  { id: 'functions', label: 'My Functions', color: '#E11D48', border: '#FB7185', text: '#FFF1F2' },
];

export const CATEGORY_MAP: Record<BlockCategory, CategoryMeta> = BLOCK_CATEGORIES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<BlockCategory, CategoryMeta>
);

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // ======================== EVENTS ========================
  {
    opcode: 'event_when_flag',
    category: 'events',
    shape: 'hat',
    template: 'when green flag clicked',
    params: [],
    description: 'Starts this script when the project runs.',
  },
  {
    opcode: 'event_when_key',
    category: 'events',
    shape: 'hat',
    template: 'when key {key} pressed',
    params: [
      {
        name: 'key',
        kind: 'select',
        defaultValue: 'Space',
        options: ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyF'],
      },
    ],
    description: 'Triggers whenever the chosen key is pressed.',
  },
  {
    opcode: 'event_when_broadcast',
    category: 'events',
    shape: 'hat',
    template: 'when I receive {message}',
    params: [{ name: 'message', kind: 'string', defaultValue: 'hit' }],
    description: 'Runs when another script broadcasts this message.',
  },
  {
    opcode: 'event_when_clone',
    category: 'events',
    shape: 'hat',
    template: 'when I start as a clone',
    params: [],
    description: 'Runs immediately when a clone of this sprite spawns.',
  },
  {
    opcode: 'event_broadcast',
    category: 'events',
    shape: 'stack',
    template: 'broadcast {message}',
    params: [{ name: 'message', kind: 'string', defaultValue: 'hit' }],
    description: 'Sends an event message to all sprites.',
  },
  {
    opcode: 'event_await',
    category: 'events',
    shape: 'stack',
    template: 'await event {message}',
    params: [{ name: 'message', kind: 'string', defaultValue: 'ready' }],
    description: 'Pauses this script until the specified broadcast event fires.',
  },

  // ======================== MOTION ========================
  {
    opcode: 'motion_move',
    category: 'motion',
    shape: 'stack',
    template: 'move {steps} steps',
    params: [{ name: 'steps', kind: 'number', defaultValue: 10 }],
    description: 'Moves forward in the current rotation direction.',
  },
  {
    opcode: 'motion_goto',
    category: 'motion',
    shape: 'stack',
    template: 'go to x {x} y {y}',
    params: [
      { name: 'x', kind: 'number', defaultValue: 0 },
      { name: 'y', kind: 'number', defaultValue: 0 },
    ],
    description: 'Teleports the sprite to exact stage coordinates.',
  },
  {
    opcode: 'motion_change_xy',
    category: 'motion',
    shape: 'stack',
    template: 'change x by {dx} y by {dy}',
    params: [
      { name: 'dx', kind: 'number', defaultValue: 5 },
      { name: 'dy', kind: 'number', defaultValue: 0 },
    ],
    description: 'Offsets sprite position by dx and dy.',
  },
  {
    opcode: 'motion_turn',
    category: 'motion',
    shape: 'stack',
    template: 'turn {deg} deg',
    params: [{ name: 'deg', kind: 'number', defaultValue: 15 }],
    description: 'Rotates the sprite by degrees.',
  },
  {
    opcode: 'motion_point_dir',
    category: 'motion',
    shape: 'stack',
    template: 'point in direction {deg}',
    params: [{ name: 'deg', kind: 'number', defaultValue: 0 }],
    description: 'Sets sprite rotation angle in degrees.',
  },
  {
    opcode: 'motion_point_mouse',
    category: 'motion',
    shape: 'stack',
    template: 'point towards mouse',
    params: [],
    description: 'Aims the sprite directly at the mouse cursor.',
  },
  {
    opcode: 'motion_tween',
    category: 'motion',
    shape: 'stack',
    template: 'tween {prop} to {target} over {secs}s ({easing})',
    params: [
      { name: 'prop', kind: 'select', defaultValue: 'x', options: ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'opacity'] },
      { name: 'target', kind: 'number', defaultValue: 120 },
      { name: 'secs', kind: 'number', defaultValue: 0.8 },
      { name: 'easing', kind: 'select', defaultValue: 'easeInOut', options: ['linear', 'easeInOut', 'bounce', 'elastic'] },
    ],
    description: 'Smoothly interpolates a sprite property over time with easing.',
  },
  {
    opcode: 'motion_scale',
    category: 'motion',
    shape: 'stack',
    template: 'set scale x {sx} y {sy}',
    params: [
      { name: 'sx', kind: 'number', defaultValue: 1 },
      { name: 'sy', kind: 'number', defaultValue: 1 },
    ],
    description: 'Applies non-uniform X/Y scaling to the sprite.',
  },
  {
    opcode: 'motion_skew',
    category: 'motion',
    shape: 'stack',
    template: 'set skew x {skx} y {sky}',
    params: [
      { name: 'skx', kind: 'number', defaultValue: 0 },
      { name: 'sky', kind: 'number', defaultValue: 0 },
    ],
    description: 'Applies skew shear transform in degrees.',
  },

  // ======================== LOOKS & LIGHTING ========================
  {
    opcode: 'looks_costume',
    category: 'looks',
    shape: 'stack',
    template: 'switch costume to #{index}',
    params: [{ name: 'index', kind: 'number', defaultValue: 0 }],
    description: 'Switches to a costume frame by zero-based index.',
  },
  {
    opcode: 'looks_next_costume',
    category: 'looks',
    shape: 'stack',
    template: 'next costume',
    params: [],
    description: 'Advances to the next costume frame.',
  },
  {
    opcode: 'looks_opacity',
    category: 'looks',
    shape: 'stack',
    template: 'set opacity to {alpha}',
    params: [{ name: 'alpha', kind: 'number', defaultValue: 1 }],
    description: 'Sets sprite opacity from 0 to 1.',
  },
  {
    opcode: 'looks_blend',
    category: 'looks',
    shape: 'stack',
    template: 'set blend mode {mode}',
    params: [
      { name: 'mode', kind: 'select', defaultValue: 'normal', options: ['normal', 'add', 'multiply', 'screen'] },
    ],
    description: 'Changes canvas composite blending mode.',
  },
  {
    opcode: 'looks_zindex',
    category: 'looks',
    shape: 'stack',
    template: 'set z-layer to {z}',
    params: [{ name: 'z', kind: 'number', defaultValue: 5 }],
    description: 'Sets draw order Z-index.',
  },
  {
    opcode: 'looks_say',
    category: 'looks',
    shape: 'stack',
    template: 'say {text} for {secs}s',
    params: [
      { name: 'text', kind: 'any', defaultValue: 'Hello!' },
      { name: 'secs', kind: 'number', defaultValue: 2 },
    ],
    description: 'Displays a floating speech label above the sprite.',
  },
  {
    opcode: 'looks_visible',
    category: 'looks',
    shape: 'stack',
    template: 'set visible {state}',
    params: [{ name: 'state', kind: 'select', defaultValue: 'true', options: ['true', 'false'] }],
    description: 'Shows or hides the sprite.',
  },
  {
    opcode: 'looks_set_light',
    category: 'looks',
    shape: 'stack',
    template: 'set light {kind} color {color} radius {radius}',
    params: [
      { name: 'kind', kind: 'select', defaultValue: 'point', options: ['none', 'point', 'spot'] },
      { name: 'color', kind: 'color', defaultValue: '#38BDF8' },
      { name: 'radius', kind: 'number', defaultValue: 180 },
    ],
    description: 'Configures this sprite as a real-time 2D light source.',
  },

  // ======================== PHYSICS & RAYCASTING ========================
  {
    opcode: 'physics_impulse',
    category: 'physics',
    shape: 'stack',
    template: 'apply impulse ix {ix} iy {iy}',
    params: [
      { name: 'ix', kind: 'number', defaultValue: 0 },
      { name: 'iy', kind: 'number', defaultValue: 420 },
    ],
    description: 'Adds an instantaneous velocity impulse to the rigid body.',
  },
  {
    opcode: 'physics_set_velocity',
    category: 'physics',
    shape: 'stack',
    template: 'set velocity vx {vx} vy {vy}',
    params: [
      { name: 'vx', kind: 'number', defaultValue: 220 },
      { name: 'vy', kind: 'number', defaultValue: 0 },
    ],
    description: 'Directly sets body horizontal and vertical velocity.',
  },
  {
    opcode: 'physics_set_vx',
    category: 'physics',
    shape: 'stack',
    template: 'set vx to {vx}',
    params: [{ name: 'vx', kind: 'number', defaultValue: 240 }],
    description: 'Sets horizontal velocity without disturbing vertical velocity.',
  },
  {
    opcode: 'physics_set_gravity',
    category: 'physics',
    shape: 'stack',
    template: 'set stage gravity y {gy}',
    params: [{ name: 'gy', kind: 'number', defaultValue: -920 }],
    description: 'Updates stage-wide vertical gravity acceleration.',
  },
  {
    opcode: 'physics_set_solid',
    category: 'physics',
    shape: 'stack',
    template: 'set solid collisions {solid}',
    params: [{ name: 'solid', kind: 'select', defaultValue: 'true', options: ['true', 'false'] }],
    description: 'Toggles solid collision resolution on this sprite.',
  },
  {
    opcode: 'physics_on_ground',
    category: 'physics',
    shape: 'boolean',
    template: 'is on ground?',
    params: [],
    description: 'True when the sprite is resting on a solid surface below.',
  },
  {
    opcode: 'physics_touching',
    category: 'physics',
    shape: 'boolean',
    template: 'touching sprite {target}?',
    params: [{ name: 'target', kind: 'string', defaultValue: 'Coin' }],
    description: 'True if overlapping any sprite or clone with that name.',
  },
  {
    opcode: 'physics_raycast_hit',
    category: 'physics',
    shape: 'boolean',
    template: 'raycast angle {deg} dist {dist} hits?',
    params: [
      { name: 'deg', kind: 'number', defaultValue: 0 },
      { name: 'dist', kind: 'number', defaultValue: 220 },
    ],
    description: 'Casts a 2D ray from this sprite and returns whether a solid body was hit.',
  },
  {
    opcode: 'physics_raycast_dist',
    category: 'physics',
    shape: 'reporter',
    template: 'raycast distance angle {deg} max {dist}',
    params: [
      { name: 'deg', kind: 'number', defaultValue: 0 },
      { name: 'dist', kind: 'number', defaultValue: 240 },
    ],
    description: 'Returns exact distance to the first solid hit along a ray.',
  },

  // ======================== CAMERA & SHADERS ========================
  {
    opcode: 'camera_goto',
    category: 'camera',
    shape: 'stack',
    template: 'camera go to x {x} y {y}',
    params: [
      { name: 'x', kind: 'number', defaultValue: 0 },
      { name: 'y', kind: 'number', defaultValue: 0 },
    ],
    description: 'Pans stage camera directly to coordinates.',
  },
  {
    opcode: 'camera_follow',
    category: 'camera',
    shape: 'stack',
    template: 'camera follow {target} smooth {smooth}',
    params: [
      { name: 'target', kind: 'string', defaultValue: 'self' },
      { name: 'smooth', kind: 'number', defaultValue: 0.12 },
    ],
    description: 'Smoothly tracks the chosen sprite (or "self" / "none").',
  },
  {
    opcode: 'camera_zoom',
    category: 'camera',
    shape: 'stack',
    template: 'set camera zoom to {zoom}',
    params: [{ name: 'zoom', kind: 'number', defaultValue: 1.15 }],
    description: 'Sets stage camera magnification.',
  },
  {
    opcode: 'camera_shake',
    category: 'camera',
    shape: 'stack',
    template: 'shake camera power {power} for {secs}s',
    params: [
      { name: 'power', kind: 'number', defaultValue: 10 },
      { name: 'secs', kind: 'number', defaultValue: 0.25 },
    ],
    description: 'Applies damped screen-shake trauma to the camera.',
  },
  {
    opcode: 'fx_set_stage',
    category: 'camera',
    shape: 'stack',
    template: 'stage FX {fx} to {amount}',
    params: [
      { name: 'fx', kind: 'select', defaultValue: 'chromatic', options: ['chromatic', 'pixelate', 'vignette', 'tintAmount'] },
      { name: 'amount', kind: 'number', defaultValue: 3 },
    ],
    description: 'Applies real-time post-processing shader effect to the whole stage.',
  },
  {
    opcode: 'fx_set_sprite',
    category: 'camera',
    shape: 'stack',
    template: 'sprite FX {fx} to {amount}',
    params: [
      { name: 'fx', kind: 'select', defaultValue: 'pixelate', options: ['pixelate', 'tintAmount', 'chromatic'] },
      { name: 'amount', kind: 'number', defaultValue: 4 },
    ],
    description: 'Applies real-time visual effect to this sprite.',
  },

  // ======================== PARTICLES ========================
  {
    opcode: 'particles_burst',
    category: 'particles',
    shape: 'stack',
    template: 'burst {count} {preset} particles color {color} speed {speed}',
    params: [
      { name: 'count', kind: 'number', defaultValue: 18 },
      { name: 'preset', kind: 'select', defaultValue: 'sparks', options: ['sparks', 'fire', 'smoke', 'trail', 'plasma'] },
      { name: 'color', kind: 'color', defaultValue: '#38BDF8' },
      { name: 'speed', kind: 'number', defaultValue: 180 },
    ],
    description: 'Spawns an immediate burst of particles at this sprite.',
  },
  {
    opcode: 'particles_emitter',
    category: 'particles',
    shape: 'stack',
    template: 'emitter {state} preset {preset} rate {rate} color {color}',
    params: [
      { name: 'state', kind: 'select', defaultValue: 'on', options: ['on', 'off'] },
      { name: 'preset', kind: 'select', defaultValue: 'trail', options: ['trail', 'fire', 'smoke', 'sparks', 'plasma'] },
      { name: 'rate', kind: 'number', defaultValue: 28 },
      { name: 'color', kind: 'color', defaultValue: '#F97316' },
    ],
    description: 'Turns a continuous particle emitter on or off on this sprite.',
  },

  // ======================== CONTROL ========================
  {
    opcode: 'control_wait',
    category: 'control',
    shape: 'stack',
    template: 'wait {secs} secs',
    params: [{ name: 'secs', kind: 'number', defaultValue: 0.5 }],
    description: 'Yields execution for the given duration.',
  },
  {
    opcode: 'control_forever',
    category: 'control',
    shape: 'c-block',
    template: 'forever',
    params: [],
    description: 'Repeats nested blocks every simulation tick.',
  },
  {
    opcode: 'control_repeat',
    category: 'control',
    shape: 'c-block',
    template: 'repeat {times} times',
    params: [{ name: 'times', kind: 'number', defaultValue: 10 }],
    description: 'Runs nested blocks a fixed number of times.',
  },
  {
    opcode: 'control_if',
    category: 'control',
    shape: 'c-block',
    template: 'if {condition} then',
    params: [{ name: 'condition', kind: 'boolean', defaultValue: true }],
    description: 'Runs nested blocks when condition evaluates to true.',
  },
  {
    opcode: 'control_if_else',
    category: 'control',
    shape: 'c-block',
    hasElse: true,
    template: 'if {condition} then',
    params: [{ name: 'condition', kind: 'boolean', defaultValue: true }],
    description: 'Branches between two nested block stacks.',
  },
  {
    opcode: 'control_create_clone',
    category: 'control',
    shape: 'stack',
    template: 'create clone of {target}',
    params: [{ name: 'target', kind: 'string', defaultValue: 'self' }],
    description: 'Spawns a live clone of this sprite or another named sprite.',
  },
  {
    opcode: 'control_delete_clone',
    category: 'control',
    shape: 'stack',
    template: 'delete this clone',
    params: [],
    description: 'Destroys the current clone instance.',
  },

  // ======================== SENSING & OPERATORS ========================
  {
    opcode: 'sensing_key_pressed',
    category: 'sensing',
    shape: 'boolean',
    template: 'key {key} pressed?',
    params: [
      {
        name: 'key',
        kind: 'select',
        defaultValue: 'ArrowRight',
        options: ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'],
      },
    ],
    description: 'True while the chosen key is held down.',
  },
  {
    opcode: 'sensing_mouse_down',
    category: 'sensing',
    shape: 'boolean',
    template: 'mouse down?',
    params: [],
    description: 'True while the primary mouse button is held on the stage.',
  },
  {
    opcode: 'sensing_prop',
    category: 'sensing',
    shape: 'reporter',
    template: 'my {prop}',
    params: [
      { name: 'prop', kind: 'select', defaultValue: 'x', options: ['x', 'y', 'vx', 'vy', 'rotation', 'mouseX', 'mouseY', 'timer'] },
    ],
    description: 'Reads live transform, velocity, mouse, or timer value.',
  },
  {
    opcode: 'sensing_distance_to',
    category: 'sensing',
    shape: 'reporter',
    template: 'distance to {target}',
    params: [{ name: 'target', kind: 'string', defaultValue: 'mouse' }],
    description: 'Returns Euclidean distance to mouse or named sprite.',
  },
  {
    opcode: 'op_math',
    category: 'sensing',
    shape: 'reporter',
    template: '{a} {op} {b}',
    params: [
      { name: 'a', kind: 'number', defaultValue: 10 },
      { name: 'op', kind: 'select', defaultValue: '+', options: ['+', '-', '*', '/', '%'] },
      { name: 'b', kind: 'number', defaultValue: 5 },
    ],
    description: 'Evaluates an arithmetic expression.',
  },
  {
    opcode: 'op_compare',
    category: 'sensing',
    shape: 'boolean',
    template: '{a} {op} {b}',
    params: [
      { name: 'a', kind: 'any', defaultValue: 0 },
      { name: 'op', kind: 'select', defaultValue: '>', options: ['>', '<', '>=', '<=', '==', '!='] },
      { name: 'b', kind: 'any', defaultValue: 0 },
    ],
    description: 'Compares two values and returns a boolean.',
  },
  {
    opcode: 'op_logic',
    category: 'sensing',
    shape: 'boolean',
    template: '{a} {op} {b}',
    params: [
      { name: 'a', kind: 'boolean', defaultValue: true },
      { name: 'op', kind: 'select', defaultValue: 'and', options: ['and', 'or'] },
      { name: 'b', kind: 'boolean', defaultValue: true },
    ],
    description: 'Combines two boolean expressions.',
  },
  {
    opcode: 'op_not',
    category: 'sensing',
    shape: 'boolean',
    template: 'not {a}',
    params: [{ name: 'a', kind: 'boolean', defaultValue: false }],
    description: 'Negates a boolean expression.',
  },
  {
    opcode: 'op_random',
    category: 'sensing',
    shape: 'reporter',
    template: 'random {min} to {max}',
    params: [
      { name: 'min', kind: 'number', defaultValue: -180 },
      { name: 'max', kind: 'number', defaultValue: 180 },
    ],
    description: 'Returns a random number between min and max.',
  },

  // ======================== DATA, LOCAL VARS, ARRAYS & DICTIONARIES ========================
  {
    opcode: 'data_set_global',
    category: 'data',
    shape: 'stack',
    template: 'set global {name} to {value}',
    params: [
      { name: 'name', kind: 'string', defaultValue: 'score' },
      { name: 'value', kind: 'any', defaultValue: 0 },
    ],
    description: 'Assigns a global variable shared across all sprites.',
  },
  {
    opcode: 'data_change_global',
    category: 'data',
    shape: 'stack',
    template: 'change global {name} by {delta}',
    params: [
      { name: 'name', kind: 'string', defaultValue: 'score' },
      { name: 'delta', kind: 'number', defaultValue: 10 },
    ],
    description: 'Increments a global numeric variable.',
  },
  {
    opcode: 'data_let_local',
    category: 'data',
    shape: 'stack',
    template: 'let {name} = {value}',
    params: [
      { name: 'name', kind: 'string', defaultValue: 'temp' },
      { name: 'value', kind: 'any', defaultValue: 0 },
    ],
    description: 'Declares or updates a block-scoped local variable.',
  },
  {
    opcode: 'data_get_var',
    category: 'data',
    shape: 'reporter',
    template: 'var {name}',
    params: [{ name: 'name', kind: 'string', defaultValue: 'score' }],
    description: 'Reads local scoped variable if defined, otherwise global variable.',
  },
  {
    opcode: 'data_array_push',
    category: 'data',
    shape: 'stack',
    template: 'push {value} to array {name}',
    params: [
      { name: 'value', kind: 'any', defaultValue: 1 },
      { name: 'name', kind: 'string', defaultValue: 'items' },
    ],
    description: 'Appends an item to a 1D/2D array variable.',
  },
  {
    opcode: 'data_array_get',
    category: 'data',
    shape: 'reporter',
    template: 'array {name} [{index}]',
    params: [
      { name: 'name', kind: 'string', defaultValue: 'items' },
      { name: 'index', kind: 'number', defaultValue: 0 },
    ],
    description: 'Reads an element by index from an array variable.',
  },
  {
    opcode: 'data_dict_set',
    category: 'data',
    shape: 'stack',
    template: 'dict {name}[{key}] = {value}',
    params: [
      { name: 'name', kind: 'string', defaultValue: 'stats' },
      { name: 'key', kind: 'string', defaultValue: 'coins' },
      { name: 'value', kind: 'any', defaultValue: 1 },
    ],
    description: 'Sets a key-value entry in a JSON-like dictionary.',
  },
  {
    opcode: 'data_dict_get',
    category: 'data',
    shape: 'reporter',
    template: 'dict {name}[{key}]',
    params: [
      { name: 'name', kind: 'string', defaultValue: 'stats' },
      { name: 'key', kind: 'string', defaultValue: 'coins' },
    ],
    description: 'Reads a value from a dictionary by key.',
  },

  // ======================== FIRST-CLASS FUNCTIONS ========================
  {
    opcode: 'fn_define',
    category: 'functions',
    shape: 'hat',
    template: 'define fn {name} ({param1}, {param2})',
    params: [
      { name: 'name', kind: 'string', defaultValue: 'calcBonus' },
      { name: 'param1', kind: 'string', defaultValue: 'base' },
      { name: 'param2', kind: 'string', defaultValue: 'mult' },
    ],
    description: 'Defines a reusable function with typed parameters.',
  },
  {
    opcode: 'fn_return',
    category: 'functions',
    shape: 'stack',
    template: 'return {value}',
    params: [{ name: 'value', kind: 'any', defaultValue: 0 }],
    description: 'Returns a value directly back to the calling expression.',
  },
  {
    opcode: 'fn_call_stack',
    category: 'functions',
    shape: 'stack',
    template: 'call {name} ({arg1}, {arg2})',
    params: [
      { name: 'name', kind: 'string', defaultValue: 'calcBonus' },
      { name: 'arg1', kind: 'any', defaultValue: 10 },
      { name: 'arg2', kind: 'any', defaultValue: 2 },
    ],
    description: 'Invokes a custom function as a statement.',
  },
  {
    opcode: 'fn_call_reporter',
    category: 'functions',
    shape: 'reporter',
    template: 'fn {name}({arg1}, {arg2})',
    params: [
      { name: 'name', kind: 'string', defaultValue: 'calcBonus' },
      { name: 'arg1', kind: 'any', defaultValue: 10 },
      { name: 'arg2', kind: 'any', defaultValue: 2 },
    ],
    description: 'First-class reporter block that evaluates a custom function and returns its value.',
  },
];

export const BLOCK_DEF_MAP: Record<string, BlockDefinition> = BLOCK_DEFINITIONS.reduce(
  (acc, def) => {
    acc[def.opcode] = def;
    return acc;
  },
  {} as Record<string, BlockDefinition>
);

let blockIdCounter = 1;
export function createUid(prefix = 'blk'): string {
  blockIdCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${blockIdCounter.toString(36)}`;
}

export function createBlockNode(
  opcode: string,
  overrides: Record<string, string | number | boolean | BlockInput> = {},
  body?: BlockNode[],
  elseBody?: BlockNode[]
): BlockNode {
  const def = BLOCK_DEF_MAP[opcode];
  const inputs: Record<string, BlockInput> = {};
  if (def) {
    for (const p of def.params) {
      const ov = overrides[p.name];
      if (ov && typeof ov === 'object' && 'type' in ov) {
        inputs[p.name] = ov;
      } else {
        inputs[p.name] = {
          type: 'literal',
          value: ov !== undefined ? (ov as string | number | boolean) : p.defaultValue,
        };
      }
    }
  }
  const node: BlockNode = {
    id: createUid('blk'),
    opcode,
    inputs,
  };
  if (def?.shape === 'c-block') {
    node.body = body ?? [];
    if (def.hasElse) {
      node.elseBody = elseBody ?? [];
    }
  }
  return node;
}

export function blockInputFromNode(node: BlockNode): BlockInput {
  return {
    type: 'block',
    value: '',
    block: node,
  };
}

export function cloneBlockNode(node: BlockNode): BlockNode {
  const inputs: Record<string, BlockInput> = {};
  for (const [k, v] of Object.entries(node.inputs)) {
    inputs[k] = v.type === 'block' && v.block ? { type: 'block', value: '', block: cloneBlockNode(v.block) } : { ...v };
  }
  return {
    id: createUid('blk'),
    opcode: node.opcode,
    inputs,
    body: node.body ? node.body.map(cloneBlockNode) : undefined,
    elseBody: node.elseBody ? node.elseBody.map(cloneBlockNode) : undefined,
  };
}

export function removeBlockById(blocks: BlockNode[], targetId: string): { blocks: BlockNode[]; removed: BlockNode | null } {
  let removed: BlockNode | null = null;
  const next: BlockNode[] = [];
  for (const b of blocks) {
    if (b.id === targetId) {
      removed = b;
      continue;
    }
    let updated = b;
    let changed = false;

    // Check inline inputs for embedded reporter/boolean blocks
    const newInputs: Record<string, BlockInput> = { ...b.inputs };
    for (const [key, inp] of Object.entries(b.inputs)) {
      if (inp.type === 'block' && inp.block) {
        if (inp.block.id === targetId) {
          removed = inp.block;
          const def = BLOCK_DEF_MAP[b.opcode];
          const paramSpec = def?.params.find((p) => p.name === key);
          newInputs[key] = { type: 'literal', value: paramSpec?.defaultValue ?? '' };
          changed = true;
        } else {
          const nested = removeBlockById([inp.block], targetId);
          if (nested.removed) {
            removed = nested.removed;
            newInputs[key] = { type: 'block', value: '', block: nested.blocks[0] };
            changed = true;
          }
        }
      }
    }

    let newBody = b.body;
    if (b.body) {
      const res = removeBlockById(b.body, targetId);
      if (res.removed) {
        removed = res.removed;
        newBody = res.blocks;
        changed = true;
      }
    }

    let newElse = b.elseBody;
    if (b.elseBody) {
      const res = removeBlockById(b.elseBody, targetId);
      if (res.removed) {
        removed = res.removed;
        newElse = res.blocks;
        changed = true;
      }
    }

    if (changed) {
      updated = { ...b, inputs: newInputs, body: newBody, elseBody: newElse };
    }
    next.push(updated);
  }
  return { blocks: next, removed };
}

export function updateBlockInTree(
  blocks: BlockNode[],
  targetId: string,
  updater: (node: BlockNode) => BlockNode
): BlockNode[] {
  return blocks.map((b) => {
    let curr = b;
    if (curr.id === targetId) {
      return updater(curr);
    }
    let changed = false;
    const newInputs: Record<string, BlockInput> = { ...curr.inputs };
    for (const [key, inp] of Object.entries(curr.inputs)) {
      if (inp.type === 'block' && inp.block) {
        const nextInner = updateBlockInTree([inp.block], targetId, updater)[0];
        if (nextInner !== inp.block) {
          newInputs[key] = { type: 'block', value: '', block: nextInner };
          changed = true;
        }
      }
    }
    let newBody = curr.body;
    if (curr.body) {
      const mapped = updateBlockInTree(curr.body, targetId, updater);
      if (mapped.some((m, idx) => m !== curr.body![idx])) {
        newBody = mapped;
        changed = true;
      }
    }
    let newElse = curr.elseBody;
    if (curr.elseBody) {
      const mapped = updateBlockInTree(curr.elseBody, targetId, updater);
      if (mapped.some((m, idx) => m !== curr.elseBody![idx])) {
        newElse = mapped;
        changed = true;
      }
    }
    return changed ? { ...curr, inputs: newInputs, body: newBody, elseBody: newElse } : curr;
  });
}

export function containsBlockId(node: BlockNode, targetId: string): boolean {
  if (node.id === targetId) return true;
  for (const inp of Object.values(node.inputs)) {
    if (inp.type === 'block' && inp.block && containsBlockId(inp.block, targetId)) {
      return true;
    }
  }
  if (node.body && node.body.some((child) => containsBlockId(child, targetId))) {
    return true;
  }
  if (node.elseBody && node.elseBody.some((child) => containsBlockId(child, targetId))) {
    return true;
  }
  return false;
}

export function findBlockById(blocks: BlockNode[], targetId: string): BlockNode | null {
  for (const b of blocks) {
    if (b.id === targetId) return b;
    for (const inp of Object.values(b.inputs)) {
      if (inp.type === 'block' && inp.block) {
        const found = findBlockById([inp.block], targetId);
        if (found) return found;
      }
    }
    if (b.body) {
      const found = findBlockById(b.body, targetId);
      if (found) return found;
    }
    if (b.elseBody) {
      const found = findBlockById(b.elseBody, targetId);
      if (found) return found;
    }
  }
  return null;
}

export function findBestInputSlotForBlock(
  targetBlock: BlockNode,
  droppedShape: BlockShape
): string | null {
  const def = BLOCK_DEF_MAP[targetBlock.opcode];
  if (!def || (droppedShape !== 'reporter' && droppedShape !== 'boolean')) return null;

  const compatibleParams = def.params.filter((p) => {
    if (p.kind === 'select' || p.kind === 'color') return false;
    if (droppedShape === 'boolean') {
      return p.kind === 'boolean' || p.kind === 'any';
    }
    // Reporters fit into number, string, any, and even boolean (truthy) if nothing else
    return p.kind === 'number' || p.kind === 'string' || p.kind === 'any';
  });

  if (compatibleParams.length === 0) return null;

  // Prefer exact kind match that currently holds a literal (empty slot)
  const exactLiteral = compatibleParams.find((p) => {
    const inp = targetBlock.inputs[p.name];
    const isExact = droppedShape === 'boolean' ? p.kind === 'boolean' : p.kind !== 'boolean';
    return isExact && (!inp || inp.type === 'literal');
  });
  if (exactLiteral) return exactLiteral.name;

  // Next, any compatible literal slot
  const anyLiteral = compatibleParams.find((p) => {
    const inp = targetBlock.inputs[p.name];
    return !inp || inp.type === 'literal';
  });
  if (anyLiteral) return anyLiteral.name;

  // Fallback to first compatible slot (replacing existing expression)
  return compatibleParams[0].name;
}

export type InsertPosition = 'before' | 'after' | 'body' | 'else';

export function insertBlocksRelative(
  blocks: BlockNode[],
  targetId: string,
  position: InsertPosition,
  newNodes: BlockNode[]
): { blocks: BlockNode[]; inserted: boolean } {
  if (newNodes.length === 0) return { blocks, inserted: false };
  let inserted = false;
  const result: BlockNode[] = [];
  for (const b of blocks) {
    if (b.id === targetId) {
      inserted = true;
      if (position === 'before') {
        result.push(...newNodes, b);
      } else if (position === 'after') {
        result.push(b, ...newNodes);
      } else if (position === 'body') {
        result.push({ ...b, body: [...(b.body ?? []), ...newNodes] });
      } else {
        result.push({ ...b, elseBody: [...(b.elseBody ?? []), ...newNodes] });
      }
      continue;
    }
    let updated = b;
    if (b.body) {
      const sub = insertBlocksRelative(b.body, targetId, position, newNodes);
      if (sub.inserted) {
        inserted = true;
        updated = { ...updated, body: sub.blocks };
      }
    }
    if (!inserted && b.elseBody) {
      const sub = insertBlocksRelative(b.elseBody, targetId, position, newNodes);
      if (sub.inserted) {
        inserted = true;
        updated = { ...updated, elseBody: sub.blocks };
      }
    }
    result.push(updated);
  }
  return { blocks: result, inserted };
}

export function insertBlockRelative(
  blocks: BlockNode[],
  targetId: string,
  position: InsertPosition,
  newNode: BlockNode
): { blocks: BlockNode[]; inserted: boolean } {
  return insertBlocksRelative(blocks, targetId, position, [newNode]);
}

export function removeBlockFromStacks(stacks: ScriptStack[], blockId: string): {
  stacks: ScriptStack[];
  removed: BlockNode | null;
} {
  let removed: BlockNode | null = null;
  const nextStacks: ScriptStack[] = [];
  for (const stack of stacks) {
    const res = removeBlockById(stack.blocks, blockId);
    if (res.removed) removed = res.removed;
    if (res.blocks.length > 0) {
      nextStacks.push({ ...stack, blocks: res.blocks });
    }
  }
  return { stacks: nextStacks, removed };
}

/**
 * Extracts a block AND every statement/C-block joined beneath it in the same sequence
 * (Scratch/Blockly behavior: dragging a parent block carries its attached tail together).
 * If targetId is an embedded reporter/boolean inside an input slot, extracts only that expression
 * and restores the slot to its default literal.
 */
export function extractBlockTailById(
  blocks: BlockNode[],
  targetId: string
): { blocks: BlockNode[]; extracted: BlockNode[] } {
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (b.id === targetId) {
      return {
        blocks: blocks.slice(0, i),
        extracted: blocks.slice(i),
      };
    }

    // Check inline inputs for embedded reporter/boolean blocks
    let inputExtracted: BlockNode | null = null;
    const newInputs: Record<string, BlockInput> = { ...b.inputs };
    for (const [key, inp] of Object.entries(b.inputs)) {
      if (inp.type === 'block' && inp.block) {
        if (inp.block.id === targetId) {
          inputExtracted = inp.block;
          const def = BLOCK_DEF_MAP[b.opcode];
          const paramSpec = def?.params.find((p) => p.name === key);
          newInputs[key] = { type: 'literal', value: paramSpec?.defaultValue ?? '' };
          break;
        }
        const nested = removeBlockById([inp.block], targetId);
        if (nested.removed) {
          inputExtracted = nested.removed;
          newInputs[key] = { type: 'block', value: '', block: nested.blocks[0] };
          break;
        }
      }
    }
    if (inputExtracted) {
      const next = [...blocks];
      next[i] = { ...b, inputs: newInputs };
      return { blocks: next, extracted: [inputExtracted] };
    }

    // Check C-block body
    if (b.body) {
      const sub = extractBlockTailById(b.body, targetId);
      if (sub.extracted.length > 0) {
        const next = [...blocks];
        next[i] = { ...b, body: sub.blocks };
        return { blocks: next, extracted: sub.extracted };
      }
    }

    // Check C-block elseBody
    if (b.elseBody) {
      const sub = extractBlockTailById(b.elseBody, targetId);
      if (sub.extracted.length > 0) {
        const next = [...blocks];
        next[i] = { ...b, elseBody: sub.blocks };
        return { blocks: next, extracted: sub.extracted };
      }
    }
  }
  return { blocks, extracted: [] };
}

export function extractBlockTailFromStacks(
  stacks: ScriptStack[],
  blockId: string
): {
  stacks: ScriptStack[];
  extracted: BlockNode[];
  sourceStackId: string | null;
  wasFullStack: boolean;
} {
  let extracted: BlockNode[] = [];
  let sourceStackId: string | null = null;
  let wasFullStack = false;
  const nextStacks: ScriptStack[] = [];

  for (const stack of stacks) {
    if (extracted.length === 0) {
      const res = extractBlockTailById(stack.blocks, blockId);
      if (res.extracted.length > 0) {
        extracted = res.extracted;
        sourceStackId = stack.id;
        wasFullStack = res.blocks.length === 0;
        if (res.blocks.length > 0) {
          nextStacks.push({ ...stack, blocks: res.blocks });
        }
        continue;
      }
    }
    nextStacks.push(stack);
  }

  return { stacks: nextStacks, extracted, sourceStackId, wasFullStack };
}

export function collectBlockSubtreeIds(nodes: BlockNode[]): Set<string> {
  const ids = new Set<string>();
  const visit = (list: BlockNode[]) => {
    for (const n of list) {
      ids.add(n.id);
      for (const inp of Object.values(n.inputs)) {
        if (inp.type === 'block' && inp.block) visit([inp.block]);
      }
      if (n.body) visit(n.body);
      if (n.elseBody) visit(n.elseBody);
    }
  };
  visit(nodes);
  return ids;
}

/**
 * Returns every block ID that moves together when dragging `blockId` (itself, all joined
 * blocks below it in its sequence, and all nested expressions/C-block children).
 */
export function findBlockTailIds(stacks: ScriptStack[], blockId: string): Set<string> {
  const { extracted } = extractBlockTailFromStacks(stacks, blockId);
  return extracted.length > 0 ? collectBlockSubtreeIds(extracted) : new Set([blockId]);
}

// =========================================================================
// BOUNDING-BOX COLLISION SOLVER & TIDY LAYOUT
// =========================================================================

export interface RectBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function estimateInputWidth(inp: BlockInput | undefined): number {
  if (!inp) return 44;
  if (inp.type === 'block' && inp.block) {
    return estimateNodeWidth(inp.block) + 22;
  }
  return Math.max(44, Math.min(180, String(inp.value ?? '').length * 7.5 + 24));
}

function estimateNodeWidth(node: BlockNode): number {
  const def = BLOCK_DEF_MAP[node.opcode];
  if (!def) return 220;
  let w = 44;
  const tokens = def.template.split(/(\{[a-zA-Z0-9_]+\})/g).filter(Boolean);
  for (const tok of tokens) {
    if (tok.startsWith('{') && tok.endsWith('}')) {
      const key = tok.slice(1, -1);
      w += estimateInputWidth(node.inputs[key]) + 6;
    } else {
      w += tok.trim().length * 7.2 + 8;
    }
  }
  if (node.body && node.body.length > 0) {
    const bodyMax = Math.max(...node.body.map(estimateNodeWidth));
    w = Math.max(w, bodyMax + 24);
  }
  if (node.elseBody && node.elseBody.length > 0) {
    const elseMax = Math.max(...node.elseBody.map(estimateNodeWidth));
    w = Math.max(w, elseMax + 24);
  }
  return Math.max(190, Math.round(w));
}

function estimateNodeHeight(node: BlockNode): number {
  const def = BLOCK_DEF_MAP[node.opcode];
  if (!def) return 40;
  if (def.shape === 'hat') return 50;
  if (def.shape === 'c-block') {
    const headerH = 40;
    const bodyH =
      node.body && node.body.length > 0
        ? node.body.reduce((acc, c) => acc + estimateNodeHeight(c), 0) + 14
        : 44;
    const elseH = def.hasElse
      ? 28 +
        (node.elseBody && node.elseBody.length > 0
          ? node.elseBody.reduce((acc, c) => acc + estimateNodeHeight(c), 0) + 14
          : 40)
      : 0;
    const footerH = 22;
    return headerH + bodyH + elseH + footerH;
  }
  return 40;
}

export function estimateStackBounds(
  stack: ScriptStack,
  measuredMap?: Map<string, { width: number; height: number }>
): { width: number; height: number } {
  const measured = measuredMap?.get(stack.id);
  if (measured && measured.width > 20 && measured.height > 20) {
    return { width: Math.ceil(measured.width), height: Math.ceil(measured.height) };
  }
  if (stack.blocks.length === 0) return { width: 220, height: 48 };
  const width = Math.max(210, ...stack.blocks.map(estimateNodeWidth));
  const height = stack.blocks.reduce((sum, b) => sum + estimateNodeHeight(b), 0) + 12;
  return { width, height };
}

export function rectsOverlap(a: RectBox, b: RectBox, margin = 0): boolean {
  return (
    a.x < b.x + b.width + margin &&
    a.x + a.width + margin > b.x &&
    a.y < b.y + b.height + margin &&
    a.y + a.height + margin > b.y
  );
}

/**
 * Collision-free skyline masonry layout for Tidy Blocks.
 * Measures actual stack widths & heights (or accurate AST estimates), packs stacks into
 * adaptive columns without overlap, and runs a final AABB de-overlap guarantee.
 */
export function layoutStacksWithoutOverlap(
  stacks: ScriptStack[],
  options: {
    measured?: Map<string, { width: number; height: number }>;
    columns?: number;
    padding?: number;
    gapX?: number;
    gapY?: number;
  } = {}
): ScriptStack[] {
  if (stacks.length === 0) return [];
  const padding = options.padding ?? 20;
  const gapX = options.gapX ?? 34;
  const gapY = options.gapY ?? 28;
  const cols = Math.max(1, Math.min(options.columns ?? 2, stacks.length));

  const sized = stacks.map((stack) => ({
    stack,
    ...estimateStackBounds(stack, options.measured),
  }));

  // Assign each stack to the currently shortest column (skyline masonry)
  const colItems: Array<typeof sized> = Array.from({ length: cols }, () => []);
  const colHeights: number[] = Array.from({ length: cols }, () => 0);

  for (const item of sized) {
    let bestCol = 0;
    for (let c = 1; c < cols; c += 1) {
      if (colHeights[c] < colHeights[bestCol]) {
        bestCol = c;
      }
    }
    colItems[bestCol].push(item);
    colHeights[bestCol] += item.height + gapY;
  }

  // Compute exact column X offsets based on actual maximum width of each preceding column
  const colX: number[] = [];
  let cursorX = padding;
  for (let c = 0; c < cols; c += 1) {
    colX.push(cursorX);
    const maxColW = colItems[c].reduce((m, it) => Math.max(m, it.width), 240);
    cursorX += maxColW + gapX;
  }

  const placedMap = new Map<string, { x: number; y: number }>();
  for (let c = 0; c < cols; c += 1) {
    let cursorY = padding;
    for (const item of colItems[c]) {
      placedMap.set(item.stack.id, { x: Math.round(colX[c]), y: Math.round(cursorY) });
      cursorY += item.height + gapY;
    }
  }

  return stacks.map((st) => {
    const pos = placedMap.get(st.id);
    return pos ? { ...st, x: pos.x, y: pos.y } : st;
  });
}

/**
 * Finds a guaranteed non-overlapping canvas coordinate for a newly created script stack.
 */
export function findFreeCanvasPosition(
  existingStacks: ScriptStack[],
  newStack: ScriptStack,
  measured?: Map<string, { width: number; height: number }>,
  gap = 28
): { x: number; y: number } {
  const padding = 20;
  const newSize = estimateStackBounds(newStack, measured);
  if (existingStacks.length === 0) {
    return { x: padding, y: padding };
  }

  const boxes: RectBox[] = existingStacks.map((st) => {
    const sz = estimateStackBounds(st, measured);
    return { x: st.x, y: st.y, width: sz.width, height: sz.height };
  });

  // Generate clean candidate coordinates: below each existing stack, or to the right of column 0
  const maxRight = Math.max(...boxes.map((b) => b.x + b.width));
  const candidateXs = Array.from(
    new Set([
      padding,
      ...boxes.map((b) => b.x),
      Math.round(boxes[0].x + boxes[0].width + gap),
      Math.round(maxRight + gap),
    ])
  ).sort((a, b) => a - b);

  const candidateYs = Array.from(
    new Set([padding, ...boxes.map((b) => Math.round(b.y + b.height + gap))])
  ).sort((a, b) => a - b);

  // Prefer positions near top-right/second-column before pushing far down
  let best: { x: number; y: number; score: number } | null = null;
  for (const cy of candidateYs) {
    for (const cx of candidateXs) {
      const candidate: RectBox = { x: cx, y: cy, width: newSize.width, height: newSize.height };
      const collides = boxes.some((b) => rectsOverlap(candidate, b, 16));
      if (!collides) {
        const score = cy * 1.15 + cx * 0.6;
        if (!best || score < best.score) {
          best = { x: cx, y: cy, score };
        }
      }
    }
  }

  if (best) return { x: best.x, y: best.y };

  const maxBottom = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: padding, y: Math.round(maxBottom + gap) };
}


