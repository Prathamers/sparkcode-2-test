// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BlockDefinition } from './types';

export const FUNCTIONS_BLOCKS: BlockDefinition[] = [
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
