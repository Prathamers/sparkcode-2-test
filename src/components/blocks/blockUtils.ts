// SPDX-License-Identifier: AGPL-3.0-or-later
import type React from 'react';
import type { BlockParamSpec, InsertPosition } from '../../engine/blocks';
import type { BlockShape } from '../../types/project';

export interface DragPayload {
  source: 'palette' | 'workspace';
  opcode: string;
  blockId?: string;
  shape?: BlockShape;
  grabOffsetX?: number;
  grabOffsetY?: number;
}

export interface MagneticSnap {
  targetBlockId: string;
  position: InsertPosition;
}

export function isExpressionShape(
  shape: BlockShape | null | undefined
): shape is 'reporter' | 'boolean' {
  return shape === 'reporter' || shape === 'boolean';
}

export function slotAcceptsShape(
  spec: BlockParamSpec | undefined,
  draggedShape: BlockShape | null
): boolean {
  if (!spec || !isExpressionShape(draggedShape)) return false;
  if (spec.kind === 'select' || spec.kind === 'color') return false;
  return draggedShape === 'boolean'
    ? spec.kind === 'boolean' || spec.kind === 'any'
    : spec.kind === 'number' || spec.kind === 'string' || spec.kind === 'any';
}

export function computeHeaderSnapPosition(
  el: HTMLElement,
  clientY: number,
  isHat: boolean,
  isCBlock: boolean
): InsertPosition {
  if (isHat) return 'after';
  const rect = el.getBoundingClientRect();
  const relY = rect.height > 0 ? (clientY - rect.top) / rect.height : 0.6;
  if (isCBlock) return relY < 0.36 ? 'before' : 'body';
  return relY < 0.38 ? 'before' : 'after';
}

export function writeDragPayload(e: React.DragEvent, payload: DragPayload): void {
  const serialized = JSON.stringify(payload);
  try {
    e.dataTransfer.setData('application/x-spark-block', serialized);
    e.dataTransfer.setData('text/plain', serialized);
  } catch {
    // Some synthetic drag events restrict dataTransfer mutations
  }
}

export function parseDragPayload(
  e: React.DragEvent,
  fallback?: DragPayload | null
): DragPayload | null {
  try {
    const raw =
      e.dataTransfer.getData('application/x-spark-block') ||
      e.dataTransfer.getData('text/plain');
    if (raw && raw.startsWith('{')) {
      const parsed = JSON.parse(raw) as DragPayload;
      if (parsed && parsed.opcode) return parsed;
    }
  } catch {
    // Fall back to activeDrag state
  }
  return fallback ?? null;
}

export function measureDomStacks(
  container: HTMLElement | null,
  zoom: number
): Map<string, { width: number; height: number }> {
  const map = new Map<string, { width: number; height: number }>();
  if (!container) return map;
  container.querySelectorAll<HTMLElement>('[data-stack-id]').forEach((el) => {
    const id = el.dataset.stackId;
    if (!id) return;
    const rect = el.getBoundingClientRect();
    if (rect.width > 10 && rect.height > 10) {
      map.set(id, {
        width: Math.ceil(rect.width / zoom),
        height: Math.ceil(rect.height / zoom),
      });
    }
  });
  return map;
}

/**
 * Finds the nearest compatible block notch or C-block interior within magnetic snap range.
 */
export function findNearestMagneticSnap(
  container: HTMLElement | null,
  clientX: number,
  clientY: number,
  draggedShape: BlockShape,
  excludeIds: Set<string>
): MagneticSnap | null {
  if (!container || isExpressionShape(draggedShape)) return null;

  if (draggedShape !== 'hat') {
    const cBodies = container.querySelectorAll<HTMLElement>(
      '[data-cblock-body-id], [data-cblock-else-id]'
    );
    for (const bodyEl of cBodies) {
      const bodyId = bodyEl.dataset.cblockBodyId;
      const elseId = bodyEl.dataset.cblockElseId;
      const targetId = bodyId ?? elseId;
      if (!targetId || excludeIds.has(targetId)) continue;
      const rect = bodyEl.getBoundingClientRect();
      const inside =
        clientX >= rect.left - 12 &&
        clientX <= rect.right + 12 &&
        clientY >= rect.top &&
        clientY <= rect.bottom;
      if (inside && bodyEl.querySelectorAll('[data-block-id]').length === 0) {
        return { targetBlockId: targetId, position: bodyId ? 'body' : 'else' };
      }
    }
  }

  const nodes = container.querySelectorAll<HTMLElement>('[data-block-id]');
  let best: { dist: number; snap: MagneticSnap } | null = null;
  const snapRadiusY = 34;
  const snapPadX = 32;

  nodes.forEach((el) => {
    const id = el.dataset.blockId;
    const targetShape = el.dataset.blockShape as BlockShape | undefined;
    if (!id || excludeIds.has(id) || isExpressionShape(targetShape)) return;

    const rect = el.getBoundingClientRect();
    if (clientX < rect.left - snapPadX || clientX > rect.right + snapPadX) return;

    if (targetShape !== 'hat') {
      const dyTop = Math.abs(clientY - rect.top);
      if (dyTop <= snapRadiusY && (!best || dyTop < best.dist)) {
        best = { dist: dyTop, snap: { targetBlockId: id, position: 'before' } };
      }
    }

    if (draggedShape !== 'hat') {
      const dyBot = Math.abs(clientY - rect.bottom);
      if (dyBot <= snapRadiusY && (!best || dyBot < best.dist)) {
        best = { dist: dyBot, snap: { targetBlockId: id, position: 'after' } };
      }
    }
  });

  return best ? (best as { dist: number; snap: MagneticSnap }).snap : null;
}
