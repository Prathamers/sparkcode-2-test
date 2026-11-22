// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BlockDefinition } from './types';

export const LOOKS_BLOCKS: BlockDefinition[] = [
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
];
