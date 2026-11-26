// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BlockNode, RuntimeSpriteState, RuntimeValue } from '../../types/project';
import type { ExecutionFrame, VMHost } from './types';

export interface FunctionDefinition {
  params: string[];
  body: BlockNode[];
}

export function lookupLocal(
  frames: ExecutionFrame[],
  name: string
): { found: boolean; value: RuntimeValue } {
  for (let i = frames.length - 1; i >= 0; i -= 1) {
    if (Object.prototype.hasOwnProperty.call(frames[i].locals, name)) {
      return { found: true, value: frames[i].locals[name] };
    }
  }
  return { found: false, value: 0 };
}

export function setLocal(
  frames: ExecutionFrame[],
  name: string,
  value: RuntimeValue
): void {
  for (let i = frames.length - 1; i >= 0; i -= 1) {
    if (Object.prototype.hasOwnProperty.call(frames[i].locals, name)) {
      frames[i].locals[name] = value;
      return;
    }
  }
  const top = frames[frames.length - 1];
  if (top) {
    top.locals[name] = value;
  }
}

export function resolveFunctionDef(
  host: VMHost,
  sprite: RuntimeSpriteState,
  fnName: string,
  cache: Map<string, FunctionDefinition | null> | null
): FunctionDefinition | null {
  const cacheKey = `${sprite.sourceId}:${fnName}`;
  if (cache && cache.has(cacheKey)) {
    return cache.get(cacheKey) ?? null;
  }

  for (const stack of host.getSpriteScripts(sprite.sourceId)) {
    const hat = stack.blocks[0];
    if (hat?.opcode === 'fn_define' && String(hat.inputs.name?.value ?? '') === fnName) {
      const p1 = String(hat.inputs.param1?.value ?? '').trim();
      const p2 = String(hat.inputs.param2?.value ?? '').trim();
      const def = { params: [p1, p2].filter(Boolean), body: stack.blocks.slice(1) };
      cache?.set(cacheKey, def);
      return def;
    }
  }

  cache?.set(cacheKey, null);
  return null;
}
