import type { BlockDefinition } from './types';

export const MOTION_BLOCKS: BlockDefinition[] = [
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
];
