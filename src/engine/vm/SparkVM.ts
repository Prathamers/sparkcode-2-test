import type { BlockInput, BlockNode, RuntimeSpriteState, RuntimeValue } from '../../types/project';
import { EXPRESSION_HANDLERS, STATEMENT_HANDLERS } from './categories/index';
import {
  evaluateEasing,
  type ExecutionFrame,
  type ScriptThread,
  type VMHost,
} from './types';

let threadSeq = 1;

export class SparkVM {
  public threads: ScriptThread[] = [];
  private host: VMHost;
  private maxStepsPerThreadPerTick = 48;

  constructor(host: VMHost) {
    this.host = host;
  }

  public clear(): void {
    this.threads = [];
  }

  public getActiveBlockIds(): string[] {
    const ids = new Set<string>();
    for (const t of this.threads) {
      if (t.finished) continue;
      if (t.activeBlockId) ids.add(t.activeBlockId);
      for (const f of t.frames) {
        const prevIdx = Math.max(0, Math.min(f.blocks.length - 1, f.index - 1));
        const b = f.blocks[prevIdx];
        if (b) ids.add(b.id);
      }
    }
    return Array.from(ids);
  }

  public triggerFlag(): void {
    this.clear();
    for (const sprite of this.host.getAllSprites()) {
      const scripts = this.host.getSpriteScripts(sprite.sourceId);
      for (const stack of scripts) {
        const hat = stack.blocks[0];
        if (hat && hat.opcode === 'event_when_flag' && stack.blocks.length > 1) {
          this.spawnThread(sprite.id, stack.id, stack.blocks.slice(1));
        }
      }
    }
  }

  public triggerKeyPressed(key: string): void {
    for (const sprite of this.host.getAllSprites()) {
      const scripts = this.host.getSpriteScripts(sprite.sourceId);
      for (const stack of scripts) {
        const hat = stack.blocks[0];
        if (hat && hat.opcode === 'event_when_key' && String(hat.inputs.key?.value ?? '') === key) {
          if (stack.blocks.length > 1) {
            this.spawnThread(sprite.id, stack.id, stack.blocks.slice(1));
          }
        }
      }
    }
  }

  public triggerBroadcast(message: string): void {
    for (const thread of this.threads) {
      if (!thread.finished && thread.awaitingEvent === message) {
        thread.awaitingEvent = null;
      }
    }
    for (const sprite of this.host.getAllSprites()) {
      const scripts = this.host.getSpriteScripts(sprite.sourceId);
      for (const stack of scripts) {
        const hat = stack.blocks[0];
        if (hat && hat.opcode === 'event_when_broadcast' && String(hat.inputs.message?.value ?? '') === message) {
          if (stack.blocks.length > 1) {
            this.spawnThread(sprite.id, stack.id, stack.blocks.slice(1));
          }
        }
      }
    }
  }

  public triggerCloneStart(cloneSprite: RuntimeSpriteState): void {
    const scripts = this.host.getSpriteScripts(cloneSprite.sourceId);
    for (const stack of scripts) {
      const hat = stack.blocks[0];
      if (hat && hat.opcode === 'event_when_clone' && stack.blocks.length > 1) {
        this.spawnThread(cloneSprite.id, stack.id, stack.blocks.slice(1));
      }
    }
  }

  public spawnThread(
    spriteId: string,
    stackId: string,
    blocks: BlockNode[],
    initialLocals: Record<string, RuntimeValue> = {}
  ): ScriptThread {
    const thread: ScriptThread = {
      id: `thr_${threadSeq++}`,
      spriteId,
      stackId,
      frames: [{ blocks, index: 0, kind: 'seq', locals: { ...initialLocals } }],
      waitTimer: 0,
      awaitingEvent: null,
      activeTween: null,
      activeBlockId: blocks[0]?.id ?? null,
      finished: false,
    };
    this.threads.push(thread);
    return thread;
  }

  public stepTick(dt: number, singleStepMode = false): void {
    const currentThreads = [...this.threads];
    for (const thread of currentThreads) {
      if (thread.finished) continue;
      const sprite = this.host.getSprite(thread.spriteId);
      if (!sprite) {
        thread.finished = true;
        continue;
      }

      if (thread.awaitingEvent !== null) {
        continue;
      }

      if (thread.activeTween) {
        const tw = thread.activeTween;
        tw.elapsed += dt;
        const progress = tw.duration <= 0 ? 1 : Math.min(1, tw.elapsed / tw.duration);
        const eased = evaluateEasing(progress, tw.easing);
        const val = tw.startVal + (tw.targetVal - tw.startVal) * eased;
        sprite[tw.prop] = val;
        if (progress >= 1) {
          thread.activeTween = null;
        } else {
          continue;
        }
      }

      if (thread.waitTimer > 0) {
        thread.waitTimer -= dt;
        if (thread.waitTimer > 0) continue;
        thread.waitTimer = 0;
      }

      const limit = singleStepMode ? 1 : this.maxStepsPerThreadPerTick;
      let steps = 0;
      while (!thread.finished && steps < limit) {
        const yielded = this.stepThreadOneBlock(thread, sprite);
        steps += 1;
        if (yielded) break;
      }
    }

    this.threads = this.threads.filter((t) => !t.finished);
  }

  private lookupLocal = (frames: ExecutionFrame[], name: string): { found: boolean; value: RuntimeValue } => {
    for (let i = frames.length - 1; i >= 0; i--) {
      if (Object.prototype.hasOwnProperty.call(frames[i].locals, name)) {
        return { found: true, value: frames[i].locals[name] };
      }
    }
    return { found: false, value: 0 };
  };

  private setLocal = (frames: ExecutionFrame[], name: string, value: RuntimeValue): void => {
    for (let i = frames.length - 1; i >= 0; i--) {
      if (Object.prototype.hasOwnProperty.call(frames[i].locals, name)) {
        frames[i].locals[name] = value;
        return;
      }
    }
    const top = frames[frames.length - 1];
    if (top) {
      top.locals[name] = value;
    }
  };

  private findFunctionDef = (
    sprite: RuntimeSpriteState,
    fnName: string
  ): { params: string[]; body: BlockNode[] } | null => {
    const scripts = this.host.getSpriteScripts(sprite.sourceId);
    for (const stack of scripts) {
      const hat = stack.blocks[0];
      if (hat && hat.opcode === 'fn_define' && String(hat.inputs.name?.value ?? '') === fnName) {
        const p1 = String(hat.inputs.param1?.value ?? '').trim();
        const p2 = String(hat.inputs.param2?.value ?? '').trim();
        const params = [p1, p2].filter(Boolean);
        return { params, body: stack.blocks.slice(1) };
      }
    }
    return null;
  };

  /**
   * Synchronously evaluates a custom function reporter call with isolated local scope and return statement.
   */
  public callCustomFunctionSync = (
    sprite: RuntimeSpriteState,
    fnName: string,
    args: RuntimeValue[],
    depth = 0
  ): RuntimeValue => {
    if (depth > 16) return 0;
    const fn = this.findFunctionDef(sprite, fnName);
    if (!fn) return 0;

    const locals: Record<string, RuntimeValue> = {};
    fn.params.forEach((p, idx) => {
      locals[p] = args[idx] ?? 0;
    });

    const tempThread: ScriptThread = {
      id: `fn_sync_${threadSeq++}`,
      spriteId: sprite.id,
      stackId: 'fn_sync',
      frames: [{ blocks: fn.body, index: 0, kind: 'function', locals }],
      waitTimer: 0,
      awaitingEvent: null,
      activeTween: null,
      activeBlockId: null,
      finished: false,
      returnValue: 0,
    };

    let guard = 0;
    while (!tempThread.finished && guard < 256) {
      this.stepThreadOneBlock(tempThread, sprite, depth + 1);
      guard += 1;
    }
    return tempThread.returnValue ?? 0;
  };

  public evalInput(
    input: BlockInput | undefined,
    sprite: RuntimeSpriteState,
    frames: ExecutionFrame[],
    depth = 0
  ): RuntimeValue {
    if (!input) return 0;
    if (input.type === 'literal') {
      return input.value;
    }
    if (!input.block) return 0;
    return this.evalExpression(input.block, sprite, frames, depth);
  }

  public evalExpression(
    block: BlockNode,
    sprite: RuntimeSpriteState,
    frames: ExecutionFrame[],
    depth = 0
  ): RuntimeValue {
    const handler = EXPRESSION_HANDLERS[block.opcode];
    if (!handler) return 0;
    return handler({
      host: this.host,
      sprite,
      frames,
      depth,
      val: (key: string) => this.evalInput(block.inputs[key], sprite, frames, depth),
      lookupLocal: this.lookupLocal,
      callCustomFunctionSync: this.callCustomFunctionSync,
    });
  }

  /**
   * Executes one statement block in the thread. Returns true if the thread should yield until the next frame.
   */
  private stepThreadOneBlock(thread: ScriptThread, sprite: RuntimeSpriteState, depth = 0): boolean {
    while (thread.frames.length > 0) {
      const frame = thread.frames[thread.frames.length - 1];
      if (frame.index < frame.blocks.length) {
        break;
      }
      if (frame.kind === 'forever') {
        frame.index = 0;
        return true;
      }
      if (frame.kind === 'repeat' && (frame.remainingRepeats ?? 0) > 1) {
        frame.remainingRepeats = (frame.remainingRepeats ?? 1) - 1;
        frame.index = 0;
        return true;
      }
      thread.frames.pop();
    }

    if (thread.frames.length === 0) {
      thread.finished = true;
      thread.activeBlockId = null;
      return true;
    }

    const frame = thread.frames[thread.frames.length - 1];
    const block = frame.blocks[frame.index];
    frame.index += 1;
    thread.activeBlockId = block.id;

    const handler = STATEMENT_HANDLERS[block.opcode];
    if (!handler) return false;

    return handler({
      host: this.host,
      thread,
      sprite,
      block,
      depth,
      val: (key: string) => this.evalInput(block.inputs[key], sprite, thread.frames, depth),
      lookupLocal: this.lookupLocal,
      setLocal: this.setLocal,
      findFunctionDef: this.findFunctionDef,
      triggerBroadcast: (msg) => this.triggerBroadcast(msg),
      triggerCloneStart: (clone) => this.triggerCloneStart(clone),
    });
  }
}
