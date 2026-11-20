import type { BlockDefinition } from './types';

export const SENSING_BLOCKS: BlockDefinition[] = [
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
];
