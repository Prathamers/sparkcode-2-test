// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BlockDefinition } from './types';

export const PHYSICS_BLOCKS: BlockDefinition[] = [
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
];
