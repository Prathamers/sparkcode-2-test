// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BlockInput, BlockNode, BlockShape, ScriptStack } from '../../types/project';
import { BLOCK_DEF_MAP } from './registry';
import type { InsertPosition } from './types';

let blockIdCounter = 1;

export function createUid(prefix = 'blk'): string {
  blockIdCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${blockIdCounter.toString(36)}`;
}

function defaultLiteralForParam(opcode: string, paramKey: string): BlockInput {
  const def = BLOCK_DEF_MAP[opcode];
  const spec = def?.params.find((p) => p.name === paramKey);
  return { type: 'literal', value: spec?.defaultValue ?? '' };
}

export function createBlockNode(
  opcode: string,
  overrides: Record<string, string | number | boolean | BlockInput> = {},
  body?: BlockNode[],
  elseBody?: BlockNode[]
): BlockNode {
  const def = BLOCK_DEF_MAP[opcode];
  const inputs: Record<string, BlockInput> = {};
  if (def) {
    for (const p of def.params) {
      const ov = overrides[p.name];
      inputs[p.name] =
        ov && typeof ov === 'object' && 'type' in ov
          ? ov
          : { type: 'literal', value: ov !== undefined ? ov : p.defaultValue };
    }
  }
  const node: BlockNode = { id: createUid('blk'), opcode, inputs };
  if (def?.shape === 'c-block') {
    node.body = body ?? [];
    if (def.hasElse) node.elseBody = elseBody ?? [];
  }
  return node;
}

export function blockInputFromNode(node: BlockNode): BlockInput {
  return { type: 'block', value: '', block: node };
}

export function cloneBlockNode(node: BlockNode): BlockNode {
  const inputs: Record<string, BlockInput> = {};
  for (const [key, inp] of Object.entries(node.inputs)) {
    inputs[key] =
      inp.type === 'block' && inp.block
        ? blockInputFromNode(cloneBlockNode(inp.block))
        : { ...inp };
  }
  return {
    id: createUid('blk'),
    opcode: node.opcode,
    inputs,
    body: node.body ? node.body.map(cloneBlockNode) : undefined,
    elseBody: node.elseBody ? node.elseBody.map(cloneBlockNode) : undefined,
  };
}

export function removeBlockById(
  blocks: BlockNode[],
  targetId: string
): { blocks: BlockNode[]; removed: BlockNode | null } {
  let removed: BlockNode | null = null;
  const next: BlockNode[] = [];

  for (const b of blocks) {
    if (b.id === targetId) {
      removed = b;
      continue;
    }
    let changed = false;
    const newInputs: Record<string, BlockInput> = { ...b.inputs };

    for (const [key, inp] of Object.entries(b.inputs)) {
      if (inp.type !== 'block' || !inp.block) continue;
      if (inp.block.id === targetId) {
        removed = inp.block;
        newInputs[key] = defaultLiteralForParam(b.opcode, key);
        changed = true;
      } else {
        const nested = removeBlockById([inp.block], targetId);
        if (nested.removed) {
          removed = nested.removed;
          newInputs[key] = blockInputFromNode(nested.blocks[0]);
          changed = true;
        }
      }
    }

    let newBody = b.body;
    if (b.body) {
      const res = removeBlockById(b.body, targetId);
      if (res.removed) {
        removed = res.removed;
        newBody = res.blocks;
        changed = true;
      }
    }

    let newElse = b.elseBody;
    if (b.elseBody) {
      const res = removeBlockById(b.elseBody, targetId);
      if (res.removed) {
        removed = res.removed;
        newElse = res.blocks;
        changed = true;
      }
    }

    next.push(changed ? { ...b, inputs: newInputs, body: newBody, elseBody: newElse } : b);
  }

  return { blocks: next, removed };
}

export function updateBlockInTree(
  blocks: BlockNode[],
  targetId: string,
  updater: (node: BlockNode) => BlockNode
): BlockNode[] {
  return blocks.map((curr) => {
    if (curr.id === targetId) return updater(curr);

    let changed = false;
    const newInputs: Record<string, BlockInput> = { ...curr.inputs };
    for (const [key, inp] of Object.entries(curr.inputs)) {
      if (inp.type === 'block' && inp.block) {
        const nextInner = updateBlockInTree([inp.block], targetId, updater)[0];
        if (nextInner !== inp.block) {
          newInputs[key] = blockInputFromNode(nextInner);
          changed = true;
        }
      }
    }

    const updateBranch = (branch?: BlockNode[]) => {
      if (!branch) return branch;
      const mapped = updateBlockInTree(branch, targetId, updater);
      if (mapped.some((m, idx) => m !== branch[idx])) {
        changed = true;
        return mapped;
      }
      return branch;
    };

    const newBody = updateBranch(curr.body);
    const newElse = updateBranch(curr.elseBody);
    return changed ? { ...curr, inputs: newInputs, body: newBody, elseBody: newElse } : curr;
  });
}

export function containsBlockId(node: BlockNode, targetId: string): boolean {
  if (node.id === targetId) return true;
  for (const inp of Object.values(node.inputs)) {
    if (inp.type === 'block' && inp.block && containsBlockId(inp.block, targetId)) return true;
  }
  return Boolean(
    node.body?.some((child) => containsBlockId(child, targetId)) ||
      node.elseBody?.some((child) => containsBlockId(child, targetId))
  );
}

export function findBlockById(blocks: BlockNode[], targetId: string): BlockNode | null {
  for (const b of blocks) {
    if (b.id === targetId) return b;
    for (const inp of Object.values(b.inputs)) {
      if (inp.type === 'block' && inp.block) {
        const found = findBlockById([inp.block], targetId);
        if (found) return found;
      }
    }
    const inBody = b.body ? findBlockById(b.body, targetId) : null;
    if (inBody) return inBody;
    const inElse = b.elseBody ? findBlockById(b.elseBody, targetId) : null;
    if (inElse) return inElse;
  }
  return null;
}

export function findBestInputSlotForBlock(
  targetBlock: BlockNode,
  droppedShape: BlockShape
): string | null {
  const def = BLOCK_DEF_MAP[targetBlock.opcode];
  if (!def || (droppedShape !== 'reporter' && droppedShape !== 'boolean')) return null;

  const compatible = def.params.filter((p) => {
    if (p.kind === 'select' || p.kind === 'color') return false;
    return droppedShape === 'boolean'
      ? p.kind === 'boolean' || p.kind === 'any'
      : p.kind === 'number' || p.kind === 'string' || p.kind === 'any';
  });
  if (compatible.length === 0) return null;

  const exactLiteral = compatible.find((p) => {
    const inp = targetBlock.inputs[p.name];
    const isExact = droppedShape === 'boolean' ? p.kind === 'boolean' : p.kind !== 'boolean';
    return isExact && (!inp || inp.type === 'literal');
  });
  if (exactLiteral) return exactLiteral.name;

  const anyLiteral = compatible.find((p) => {
    const inp = targetBlock.inputs[p.name];
    return !inp || inp.type === 'literal';
  });
  return (anyLiteral ?? compatible[0]).name;
}

export function insertBlocksRelative(
  blocks: BlockNode[],
  targetId: string,
  position: InsertPosition,
  newNodes: BlockNode[]
): { blocks: BlockNode[]; inserted: boolean } {
  if (newNodes.length === 0) return { blocks, inserted: false };
  let inserted = false;
  const result: BlockNode[] = [];

  for (const b of blocks) {
    if (b.id === targetId) {
      inserted = true;
      if (position === 'before') result.push(...newNodes, b);
      else if (position === 'after') result.push(b, ...newNodes);
      else if (position === 'body') result.push({ ...b, body: [...(b.body ?? []), ...newNodes] });
      else result.push({ ...b, elseBody: [...(b.elseBody ?? []), ...newNodes] });
      continue;
    }

    let updated = b;
    if (b.body) {
      const sub = insertBlocksRelative(b.body, targetId, position, newNodes);
      if (sub.inserted) {
        inserted = true;
        updated = { ...updated, body: sub.blocks };
      }
    }
    if (!inserted && b.elseBody) {
      const sub = insertBlocksRelative(b.elseBody, targetId, position, newNodes);
      if (sub.inserted) {
        inserted = true;
        updated = { ...updated, elseBody: sub.blocks };
      }
    }
    result.push(updated);
  }

  return { blocks: result, inserted };
}

export function insertBlockRelative(
  blocks: BlockNode[],
  targetId: string,
  position: InsertPosition,
  newNode: BlockNode
): { blocks: BlockNode[]; inserted: boolean } {
  return insertBlocksRelative(blocks, targetId, position, [newNode]);
}

export function removeBlockFromStacks(
  stacks: ScriptStack[],
  blockId: string
): { stacks: ScriptStack[]; removed: BlockNode | null } {
  let removed: BlockNode | null = null;
  const nextStacks: ScriptStack[] = [];
  for (const stack of stacks) {
    const res = removeBlockById(stack.blocks, blockId);
    if (res.removed) removed = res.removed;
    if (res.blocks.length > 0) nextStacks.push({ ...stack, blocks: res.blocks });
  }
  return { stacks: nextStacks, removed };
}

export function extractBlockTailById(
  blocks: BlockNode[],
  targetId: string
): { blocks: BlockNode[]; extracted: BlockNode[] } {
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (b.id === targetId) {
      return { blocks: blocks.slice(0, i), extracted: blocks.slice(i) };
    }

    let inputExtracted: BlockNode | null = null;
    const newInputs: Record<string, BlockInput> = { ...b.inputs };
    for (const [key, inp] of Object.entries(b.inputs)) {
      if (inp.type !== 'block' || !inp.block) continue;
      if (inp.block.id === targetId) {
        inputExtracted = inp.block;
        newInputs[key] = defaultLiteralForParam(b.opcode, key);
        break;
      }
      const nested = removeBlockById([inp.block], targetId);
      if (nested.removed) {
        inputExtracted = nested.removed;
        newInputs[key] = blockInputFromNode(nested.blocks[0]);
        break;
      }
    }

    if (inputExtracted) {
      const next = [...blocks];
      next[i] = { ...b, inputs: newInputs };
      return { blocks: next, extracted: [inputExtracted] };
    }

    if (b.body) {
      const sub = extractBlockTailById(b.body, targetId);
      if (sub.extracted.length > 0) {
        const next = [...blocks];
        next[i] = { ...b, body: sub.blocks };
        return { blocks: next, extracted: sub.extracted };
      }
    }

    if (b.elseBody) {
      const sub = extractBlockTailById(b.elseBody, targetId);
      if (sub.extracted.length > 0) {
        const next = [...blocks];
        next[i] = { ...b, elseBody: sub.blocks };
        return { blocks: next, extracted: sub.extracted };
      }
    }
  }
  return { blocks, extracted: [] };
}

export function extractBlockTailFromStacks(
  stacks: ScriptStack[],
  blockId: string
): {
  stacks: ScriptStack[];
  extracted: BlockNode[];
  sourceStackId: string | null;
  wasFullStack: boolean;
} {
  let extracted: BlockNode[] = [];
  let sourceStackId: string | null = null;
  let wasFullStack = false;
  const nextStacks: ScriptStack[] = [];

  for (const stack of stacks) {
    if (extracted.length === 0) {
      const res = extractBlockTailById(stack.blocks, blockId);
      if (res.extracted.length > 0) {
        extracted = res.extracted;
        sourceStackId = stack.id;
        wasFullStack = res.blocks.length === 0;
        if (res.blocks.length > 0) nextStacks.push({ ...stack, blocks: res.blocks });
        continue;
      }
    }
    nextStacks.push(stack);
  }

  return { stacks: nextStacks, extracted, sourceStackId, wasFullStack };
}

export function collectBlockSubtreeIds(nodes: BlockNode[]): Set<string> {
  const ids = new Set<string>();
  const visit = (list: BlockNode[]) => {
    for (const n of list) {
      ids.add(n.id);
      for (const inp of Object.values(n.inputs)) {
        if (inp.type === 'block' && inp.block) visit([inp.block]);
      }
      if (n.body) visit(n.body);
      if (n.elseBody) visit(n.elseBody);
    }
  };
  visit(nodes);
  return ids;
}

export function findBlockTailIds(stacks: ScriptStack[], blockId: string): Set<string> {
  const { extracted } = extractBlockTailFromStacks(stacks, blockId);
  return extracted.length > 0 ? collectBlockSubtreeIds(extracted) : new Set([blockId]);
}
