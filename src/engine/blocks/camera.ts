import type { BlockDefinition } from './types';

export const CAMERA_BLOCKS: BlockDefinition[] = [
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
      { name: 'fx', kind: 'select', defaultValue: 'chromatic', options: ['chromatic', 'pixelate', 'vignette', 'tintAmount', 'bloom'] },
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
];
