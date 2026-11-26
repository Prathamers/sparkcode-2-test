// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BlockInput, BlockNode, ScriptStack } from '../../types/project';
import { BLOCK_DEF_MAP } from './registry';
import type { RectBox } from './types';

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

  let width = 44;
  const tokens = def.template.split(/(\{[a-zA-Z0-9_]+\})/g).filter(Boolean);
  for (const tok of tokens) {
    if (tok.startsWith('{') && tok.endsWith('}')) {
      width += estimateInputWidth(node.inputs[tok.slice(1, -1)]) + 6;
    } else {
      width += tok.trim().length * 7.2 + 8;
    }
  }

  for (const branch of [node.body, node.elseBody]) {
    if (branch && branch.length > 0) {
      width = Math.max(width, Math.max(...branch.map(estimateNodeWidth)) + 24);
    }
  }

  return Math.max(190, Math.round(width));
}

function estimateNodeHeight(node: BlockNode): number {
  const def = BLOCK_DEF_MAP[node.opcode];
  if (!def) return 40;
  if (def.shape === 'hat') return 50;
  if (def.shape !== 'c-block') return 40;

  const branchHeight = (list: BlockNode[] | undefined, emptyHeight: number) =>
    list && list.length > 0
      ? list.reduce((sum, child) => sum + estimateNodeHeight(child), 0) + 14
      : emptyHeight;

  const bodyH = branchHeight(node.body, 44);
  const elseH = def.hasElse ? 28 + branchHeight(node.elseBody, 40) : 0;
  return 40 + bodyH + elseH + 22;
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
  return {
    width: Math.max(210, ...stack.blocks.map(estimateNodeWidth)),
    height: stack.blocks.reduce((sum, b) => sum + estimateNodeHeight(b), 0) + 12,
  };
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
      if (colHeights[c] < colHeights[bestCol]) bestCol = c;
    }
    colItems[bestCol].push(item);
    colHeights[bestCol] += item.height + gapY;
  }

  const placedMap = new Map<string, { x: number; y: number }>();
  let cursorX = padding;
  for (let c = 0; c < cols; c += 1) {
    let cursorY = padding;
    let maxColW = 240;
    for (const item of colItems[c]) {
      maxColW = Math.max(maxColW, item.width);
      placedMap.set(item.stack.id, { x: Math.round(cursorX), y: Math.round(cursorY) });
      cursorY += item.height + gapY;
    }
    cursorX += maxColW + gapX;
  }

  return stacks.map((st) => {
    const pos = placedMap.get(st.id);
    return pos ? { ...st, x: pos.x, y: pos.y } : st;
  });
}

/**
 * Finds a non-overlapping canvas coordinate for a newly created script stack.
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
      if (boxes.some((b) => rectsOverlap(candidate, b, 16))) continue;
      const score = cy * 1.15 + cx * 0.6;
      if (!best || score < best.score) best = { x: cx, y: cy, score };
    }
  }

  if (best) return { x: best.x, y: best.y };
  const maxBottom = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: padding, y: Math.round(maxBottom + gap) };
}
