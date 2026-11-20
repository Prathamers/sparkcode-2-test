import type { BlockInput, BlockNode, BlockShape, ScriptStack } from '../../types/project';
import { BLOCK_DEF_MAP } from './registry';
import type { InsertPosition, RectBox } from './types';

let blockIdCounter = 1;
export function createUid(prefix = 'blk'): string {
  blockIdCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${blockIdCounter.toString(36)}`;
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
      if (ov && typeof ov === 'object' && 'type' in ov) {
        inputs[p.name] = ov;
      } else {
        inputs[p.name] = {
          type: 'literal',
          value: ov !== undefined ? (ov as string | number | boolean) : p.defaultValue,
        };
      }
    }
  }
  const node: BlockNode = {
    id: createUid('blk'),
    opcode,
    inputs,
  };
  if (def?.shape === 'c-block') {
    node.body = body ?? [];
    if (def.hasElse) {
      node.elseBody = elseBody ?? [];
    }
  }
  return node;
}

export function blockInputFromNode(node: BlockNode): BlockInput {
  return {
    type: 'block',
    value: '',
    block: node,
  };
}

export function cloneBlockNode(node: BlockNode): BlockNode {
  const inputs: Record<string, BlockInput> = {};
  for (const [k, v] of Object.entries(node.inputs)) {
    inputs[k] = v.type === 'block' && v.block ? { type: 'block', value: '', block: cloneBlockNode(v.block) } : { ...v };
  }
  return {
    id: createUid('blk'),
    opcode: node.opcode,
    inputs,
    body: node.body ? node.body.map(cloneBlockNode) : undefined,
    elseBody: node.elseBody ? node.elseBody.map(cloneBlockNode) : undefined,
  };
}

export function removeBlockById(blocks: BlockNode[], targetId: string): { blocks: BlockNode[]; removed: BlockNode | null } {
  let removed: BlockNode | null = null;
  const next: BlockNode[] = [];
  for (const b of blocks) {
    if (b.id === targetId) {
      removed = b;
      continue;
    }
    let updated = b;
    let changed = false;

    const newInputs: Record<string, BlockInput> = { ...b.inputs };
    for (const [key, inp] of Object.entries(b.inputs)) {
      if (inp.type === 'block' && inp.block) {
        if (inp.block.id === targetId) {
          removed = inp.block;
          const def = BLOCK_DEF_MAP[b.opcode];
          const paramSpec = def?.params.find((p) => p.name === key);
          newInputs[key] = { type: 'literal', value: paramSpec?.defaultValue ?? '' };
          changed = true;
        } else {
          const nested = removeBlockById([inp.block], targetId);
          if (nested.removed) {
            removed = nested.removed;
            newInputs[key] = { type: 'block', value: '', block: nested.blocks[0] };
            changed = true;
          }
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

    if (changed) {
      updated = { ...b, inputs: newInputs, body: newBody, elseBody: newElse };
    }
    next.push(updated);
  }
  return { blocks: next, removed };
}

export function updateBlockInTree(
  blocks: BlockNode[],
  targetId: string,
  updater: (node: BlockNode) => BlockNode
): BlockNode[] {
  return blocks.map((b) => {
    const curr = b;
    if (curr.id === targetId) {
      return updater(curr);
    }
    let changed = false;
    const newInputs: Record<string, BlockInput> = { ...curr.inputs };
    for (const [key, inp] of Object.entries(curr.inputs)) {
      if (inp.type === 'block' && inp.block) {
        const nextInner = updateBlockInTree([inp.block], targetId, updater)[0];
        if (nextInner !== inp.block) {
          newInputs[key] = { type: 'block', value: '', block: nextInner };
          changed = true;
        }
      }
    }
    let newBody = curr.body;
    if (curr.body) {
      const mapped = updateBlockInTree(curr.body, targetId, updater);
      if (mapped.some((m, idx) => m !== curr.body![idx])) {
        newBody = mapped;
        changed = true;
      }
    }
    let newElse = curr.elseBody;
    if (curr.elseBody) {
      const mapped = updateBlockInTree(curr.elseBody, targetId, updater);
      if (mapped.some((m, idx) => m !== curr.elseBody![idx])) {
        newElse = mapped;
        changed = true;
      }
    }
    return changed ? { ...curr, inputs: newInputs, body: newBody, elseBody: newElse } : curr;
  });
}

export function containsBlockId(node: BlockNode, targetId: string): boolean {
  if (node.id === targetId) return true;
  for (const inp of Object.values(node.inputs)) {
    if (inp.type === 'block' && inp.block && containsBlockId(inp.block, targetId)) {
      return true;
    }
  }
  if (node.body && node.body.some((child) => containsBlockId(child, targetId))) {
    return true;
  }
  if (node.elseBody && node.elseBody.some((child) => containsBlockId(child, targetId))) {
    return true;
  }
  return false;
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
    if (b.body) {
      const found = findBlockById(b.body, targetId);
      if (found) return found;
    }
    if (b.elseBody) {
      const found = findBlockById(b.elseBody, targetId);
      if (found) return found;
    }
  }
  return null;
}

export function findBestInputSlotForBlock(
  targetBlock: BlockNode,
  droppedShape: BlockShape
): string | null {
  const def = BLOCK_DEF_MAP[targetBlock.opcode];
  if (!def || (droppedShape !== 'reporter' && droppedShape !== 'boolean')) return null;

  const compatibleParams = def.params.filter((p) => {
    if (p.kind === 'select' || p.kind === 'color') return false;
    if (droppedShape === 'boolean') {
      return p.kind === 'boolean' || p.kind === 'any';
    }
    return p.kind === 'number' || p.kind === 'string' || p.kind === 'any';
  });

  if (compatibleParams.length === 0) return null;

  const exactLiteral = compatibleParams.find((p) => {
    const inp = targetBlock.inputs[p.name];
    const isExact = droppedShape === 'boolean' ? p.kind === 'boolean' : p.kind !== 'boolean';
    return isExact && (!inp || inp.type === 'literal');
  });
  if (exactLiteral) return exactLiteral.name;

  const anyLiteral = compatibleParams.find((p) => {
    const inp = targetBlock.inputs[p.name];
    return !inp || inp.type === 'literal';
  });
  if (anyLiteral) return anyLiteral.name;

  return compatibleParams[0].name;
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
      if (position === 'before') {
        result.push(...newNodes, b);
      } else if (position === 'after') {
        result.push(b, ...newNodes);
      } else if (position === 'body') {
        result.push({ ...b, body: [...(b.body ?? []), ...newNodes] });
      } else {
        result.push({ ...b, elseBody: [...(b.elseBody ?? []), ...newNodes] });
      }
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

export function removeBlockFromStacks(stacks: ScriptStack[], blockId: string): {
  stacks: ScriptStack[];
  removed: BlockNode | null;
} {
  let removed: BlockNode | null = null;
  const nextStacks: ScriptStack[] = [];
  for (const stack of stacks) {
    const res = removeBlockById(stack.blocks, blockId);
    if (res.removed) removed = res.removed;
    if (res.blocks.length > 0) {
      nextStacks.push({ ...stack, blocks: res.blocks });
    }
  }
  return { stacks: nextStacks, removed };
}

/**
 * Extracts a block AND every statement/C-block joined beneath it in the same sequence
 * (Scratch/Blockly behavior: dragging a parent block carries its attached tail together).
 * If targetId is an embedded reporter/boolean inside an input slot, extracts only that expression
 * and restores the slot to its default literal.
 */
export function extractBlockTailById(
  blocks: BlockNode[],
  targetId: string
): { blocks: BlockNode[]; extracted: BlockNode[] } {
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (b.id === targetId) {
      return {
        blocks: blocks.slice(0, i),
        extracted: blocks.slice(i),
      };
    }

    let inputExtracted: BlockNode | null = null;
    const newInputs: Record<string, BlockInput> = { ...b.inputs };
    for (const [key, inp] of Object.entries(b.inputs)) {
      if (inp.type === 'block' && inp.block) {
        if (inp.block.id === targetId) {
          inputExtracted = inp.block;
          const def = BLOCK_DEF_MAP[b.opcode];
          const paramSpec = def?.params.find((p) => p.name === key);
          newInputs[key] = { type: 'literal', value: paramSpec?.defaultValue ?? '' };
          break;
        }
        const nested = removeBlockById([inp.block], targetId);
        if (nested.removed) {
          inputExtracted = nested.removed;
          newInputs[key] = { type: 'block', value: '', block: nested.blocks[0] };
          break;
        }
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
        if (res.blocks.length > 0) {
          nextStacks.push({ ...stack, blocks: res.blocks });
        }
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

/**
 * Returns every block ID that moves together when dragging `blockId` (itself, all joined
 * blocks below it in its sequence, and all nested expressions/C-block children).
 */
export function findBlockTailIds(stacks: ScriptStack[], blockId: string): Set<string> {
  const { extracted } = extractBlockTailFromStacks(stacks, blockId);
  return extracted.length > 0 ? collectBlockSubtreeIds(extracted) : new Set([blockId]);
}

// =========================================================================
// BOUNDING-BOX COLLISION SOLVER & TIDY LAYOUT
// =========================================================================

function estimateInputWidth(inp: BlockInput | undefined): number {
  if (!inp) return 44;
  if (inp.type === 'block' && inp.block) {
    return estimateNodeWidth(inp.block) + 22;
  }
  return Math.max(44, Math.min(180, String(inp.value ?? '').length * 7.5 + 24));
}

function estimateNodeWidth(node: BlockNode): number {
  const def = BLOCK_DEF_MAP[node.opcode];
  if (!def) return 220;
  let w = 44;
  const tokens = def.template.split(/(\{[a-zA-Z0-9_]+\})/g).filter(Boolean);
  for (const tok of tokens) {
    if (tok.startsWith('{') && tok.endsWith('}')) {
      const key = tok.slice(1, -1);
      w += estimateInputWidth(node.inputs[key]) + 6;
    } else {
      w += tok.trim().length * 7.2 + 8;
    }
  }
  if (node.body && node.body.length > 0) {
    const bodyMax = Math.max(...node.body.map(estimateNodeWidth));
    w = Math.max(w, bodyMax + 24);
  }
  if (node.elseBody && node.elseBody.length > 0) {
    const elseMax = Math.max(...node.elseBody.map(estimateNodeWidth));
    w = Math.max(w, elseMax + 24);
  }
  return Math.max(190, Math.round(w));
}

function estimateNodeHeight(node: BlockNode): number {
  const def = BLOCK_DEF_MAP[node.opcode];
  if (!def) return 40;
  if (def.shape === 'hat') return 50;
  if (def.shape === 'c-block') {
    const headerH = 40;
    const bodyH =
      node.body && node.body.length > 0
        ? node.body.reduce((acc, c) => acc + estimateNodeHeight(c), 0) + 14
        : 44;
    const elseH = def.hasElse
      ? 28 +
        (node.elseBody && node.elseBody.length > 0
          ? node.elseBody.reduce((acc, c) => acc + estimateNodeHeight(c), 0) + 14
          : 40)
      : 0;
    const footerH = 22;
    return headerH + bodyH + elseH + footerH;
  }
  return 40;
}

export function estimateStackBounds(
  stack: ScriptStack,
  measuredMap?: Map<string, { width: number; height: number }>
): { width: number; height: number } {
  const measured = measuredMap?.get(stack.id);
  if (measured && measured.width > 20 && measured.height > 20) {
    return { width: Math.ceil(measured.width), height: Math.ceil(measured.height) };
  }
  if (stack.blocks.length === 0) return { width: 220, height: 48 };
  const width = Math.max(210, ...stack.blocks.map(estimateNodeWidth));
  const height = stack.blocks.reduce((sum, b) => sum + estimateNodeHeight(b), 0) + 12;
  return { width, height };
}

export function rectsOverlap(a: RectBox, b: RectBox, margin = 0): boolean {
  return (
    a.x < b.x + b.width + margin &&
    a.x + a.width + margin > b.x &&
    a.y < b.y + b.height + margin &&
    a.y + a.height + margin > b.y
  );
}

/**
 * Collision-free skyline masonry layout for Tidy Blocks.
 * Measures actual stack widths & heights (or accurate AST estimates), packs stacks into
 * adaptive columns without overlap, and runs a final AABB de-overlap guarantee.
 */
export function layoutStacksWithoutOverlap(
  stacks: ScriptStack[],
  options: {
    measured?: Map<string, { width: number; height: number }>;
    columns?: number;
    padding?: number;
    gapX?: number;
    gapY?: number;
  } = {}
): ScriptStack[] {
  if (stacks.length === 0) return [];
  const padding = options.padding ?? 20;
  const gapX = options.gapX ?? 34;
  const gapY = options.gapY ?? 28;
  const cols = Math.max(1, Math.min(options.columns ?? 2, stacks.length));

  const sized = stacks.map((stack) => ({
    stack,
    ...estimateStackBounds(stack, options.measured),
  }));

  const colItems: Array<typeof sized> = Array.from({ length: cols }, () => []);
  const colHeights: number[] = Array.from({ length: cols }, () => 0);

  for (const item of sized) {
    let bestCol = 0;
    for (let c = 1; c < cols; c += 1) {
      if (colHeights[c] < colHeights[bestCol]) {
        bestCol = c;
      }
    }
    colItems[bestCol].push(item);
    colHeights[bestCol] += item.height + gapY;
  }

  const colX: number[] = [];
  let cursorX = padding;
  for (let c = 0; c < cols; c += 1) {
    colX.push(cursorX);
    const maxColW = colItems[c].reduce((m, it) => Math.max(m, it.width), 240);
    cursorX += maxColW + gapX;
  }

  const placedMap = new Map<string, { x: number; y: number }>();
  for (let c = 0; c < cols; c += 1) {
    let cursorY = padding;
    for (const item of colItems[c]) {
      placedMap.set(item.stack.id, { x: Math.round(colX[c]), y: Math.round(cursorY) });
      cursorY += item.height + gapY;
    }
  }

  return stacks.map((st) => {
    const pos = placedMap.get(st.id);
    return pos ? { ...st, x: pos.x, y: pos.y } : st;
  });
}

/**
 * Finds a guaranteed non-overlapping canvas coordinate for a newly created script stack.
 */
export function findFreeCanvasPosition(
  existingStacks: ScriptStack[],
  newStack: ScriptStack,
  measured?: Map<string, { width: number; height: number }>,
  gap = 28
): { x: number; y: number } {
  const padding = 20;
  const newSize = estimateStackBounds(newStack, measured);
  if (existingStacks.length === 0) {
    return { x: padding, y: padding };
  }

  const boxes: RectBox[] = existingStacks.map((st) => {
    const sz = estimateStackBounds(st, measured);
    return { x: st.x, y: st.y, width: sz.width, height: sz.height };
  });

  const maxRight = Math.max(...boxes.map((b) => b.x + b.width));
  const candidateXs = Array.from(
    new Set([
      padding,
      ...boxes.map((b) => b.x),
      Math.round(boxes[0].x + boxes[0].width + gap),
      Math.round(maxRight + gap),
    ])
  ).sort((a, b) => a - b);

  const candidateYs = Array.from(
    new Set([padding, ...boxes.map((b) => Math.round(b.y + b.height + gap))])
  ).sort((a, b) => a - b);

  let best: { x: number; y: number; score: number } | null = null;
  for (const cy of candidateYs) {
    for (const cx of candidateXs) {
      const candidate: RectBox = { x: cx, y: cy, width: newSize.width, height: newSize.height };
      const collides = boxes.some((b) => rectsOverlap(candidate, b, 16));
      if (!collides) {
        const score = cy * 1.15 + cx * 0.6;
        if (!best || score < best.score) {
          best = { x: cx, y: cy, score };
        }
      }
    }
  }

  if (best) return { x: best.x, y: best.y };

  const maxBottom = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: padding, y: Math.round(maxBottom + gap) };
}
