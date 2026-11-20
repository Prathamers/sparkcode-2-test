import type { BlockDefinition } from './types';

export const DATA_BLOCKS: BlockDefinition[] = [
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
];
