// SPDX-License-Identifier: AGPL-3.0-or-later
import { toBoolean, toNumber, type StatementHandler } from '../types';

export const CONTROL_STATEMENT_HANDLERS: Record<string, StatementHandler> = {
  control_wait: ({ thread, val }) => {
    thread.waitTimer = Math.max(0.016, toNumber(val('secs')));
    return true;
  },
  control_forever: ({ thread, block }) => {
    if (block.body && block.body.length > 0) {
      thread.frames.push({ blocks: block.body, index: 0, kind: 'forever', locals: {} });
      return false;
    }
    return true;
  },
  control_repeat: ({ thread, block, val }) => {
    const count = Math.max(0, Math.floor(toNumber(val('times'))));
    if (count > 0 && block.body && block.body.length > 0) {
      thread.frames.push({
        blocks: block.body,
        index: 0,
        kind: 'repeat',
        remainingRepeats: count,
        locals: {},
      });
    }
    return false;
  },
  control_if: ({ thread, block, val }) => {
    if (toBoolean(val('condition')) && block.body && block.body.length > 0) {
      thread.frames.push({ blocks: block.body, index: 0, kind: 'seq', locals: {} });
    }
    return false;
  },
  control_if_else: ({ thread, block, val }) => {
    const branch = toBoolean(val('condition')) ? block.body : block.elseBody;
    if (branch && branch.length > 0) {
      thread.frames.push({ blocks: branch, index: 0, kind: 'seq', locals: {} });
    }
    return false;
  },
  control_create_clone: ({ host, sprite, val, triggerCloneStart }) => {
    const clone = host.spawnClone(String(val('target')), sprite.id);
    if (clone) {
      triggerCloneStart(clone);
    }
    return false;
  },
  control_delete_clone: ({ host, sprite, thread }) => {
    if (sprite.isClone) {
      host.deleteClone(sprite.id);
      thread.finished = true;
      return true;
    }
    return false;
  },
};
