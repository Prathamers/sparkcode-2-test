import type { BlockCategory } from '../../types/project';
import type { BlockDefinition } from './types';
import { EVENTS_BLOCKS } from './events';
import { MOTION_BLOCKS } from './motion';
import { LOOKS_BLOCKS } from './looks';
import { PHYSICS_BLOCKS } from './physics';
import { CAMERA_BLOCKS } from './camera';
import { PARTICLES_BLOCKS } from './particles';
import { CONTROL_BLOCKS } from './control';
import { SENSING_BLOCKS } from './sensing';
import { DATA_BLOCKS } from './data';
import { FUNCTIONS_BLOCKS } from './functions';

export const BLOCKS_BY_CATEGORY: Record<BlockCategory, BlockDefinition[]> = {
  events: EVENTS_BLOCKS,
  motion: MOTION_BLOCKS,
  looks: LOOKS_BLOCKS,
  physics: PHYSICS_BLOCKS,
  camera: CAMERA_BLOCKS,
  particles: PARTICLES_BLOCKS,
  control: CONTROL_BLOCKS,
  sensing: SENSING_BLOCKS,
  data: DATA_BLOCKS,
  functions: FUNCTIONS_BLOCKS,
};

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  ...EVENTS_BLOCKS,
  ...MOTION_BLOCKS,
  ...LOOKS_BLOCKS,
  ...PHYSICS_BLOCKS,
  ...CAMERA_BLOCKS,
  ...PARTICLES_BLOCKS,
  ...CONTROL_BLOCKS,
  ...SENSING_BLOCKS,
  ...DATA_BLOCKS,
  ...FUNCTIONS_BLOCKS,
];

export const BLOCK_DEF_MAP: Record<string, BlockDefinition> = BLOCK_DEFINITIONS.reduce(
  (acc, def) => {
    acc[def.opcode] = def;
    return acc;
  },
  {} as Record<string, BlockDefinition>
);
