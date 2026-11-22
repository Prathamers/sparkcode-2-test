// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BlockDefinition } from './types';

export const PARTICLES_BLOCKS: BlockDefinition[] = [
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
];
