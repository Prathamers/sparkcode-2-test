import type { BlockDefinition } from './types';

export const EVENTS_BLOCKS: BlockDefinition[] = [
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
];
