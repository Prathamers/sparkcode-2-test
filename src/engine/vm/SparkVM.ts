// SPDX-License-Identifier: AGPL-3.0-or-later
import type {
  BlockInput,
  BlockNode,
  ImprovedVMConfig,
  RuntimeSpriteState,
  RuntimeValue,
} from '../../types/project';
import { EXPRESSION_HANDLERS, STATEMENT_HANDLERS } from './categories/index';
import { normalizeImprovedVMConfig } from './config';
import { lookupLocal, resolveFunctionDef, setLocal, type FunctionDefinition } from './scope';
import {
  evaluateEasing,
  toBoolean,
  type ExecutionFrame,
  type ScriptThread,
  type StopScope,
  type VMHost,
} from './types';

let threadSeq = 1;

export class SparkVM {
  public threads: ScriptThread[] = [];
  private host: VMHost;
  private maxStepsPerThreadPerTick = 48;
  private improvedActive = false;
  private fastSymbolCache = false;
  private stepsLastTick = 0;
  private fnStackCache = new Map<string, FunctionDefinition | null>();

  constructor(host: VMHost) {
    this.host = host;
  }

  public configureImprovedMode(cfg: ImprovedVMConfig): void {
    const norm = normalizeImprovedVMConfig(cfg);
    this.improvedActive = norm.enabled;
    this.maxStepsPerThreadPerTick = norm.enabled ? norm.stepBudget : 48;
    this.fastSymbolCache = norm.enabled && norm.fastSymbolCache;
    if (!this.fastSymbolCache) {
      this.fnStackCache.clear();
    }
  }

  public invalidateSymbolCache(): void {
    this.fnStackCache.clear();
  }

  public getRuntimeStats(): {
    improvedActive: boolean;
    stepBudget: number;
    stepsLastTick: number;
    fastSymbolCache: boolean;
  } {
    return {
      improvedActive: this.improvedActive,
      stepBudget: this.maxStepsPerThreadPerTick,
      stepsLastTick: this.stepsLastTick,
      fastSymbolCache: this.fastSymbolCache,
    };
  }

  public clear(): void {
    this.threads = [];
    this.stepsLastTick = 0;
    this.fnStackCache.clear();
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

  private triggerHat(
    opcode: string,
    predicate?: (hat: BlockNode) => boolean,
    targetSprite?: RuntimeSpriteState
  ): void {
    const sprites = targetSprite ? [targetSprite] : this.host.getAllSprites();
    for (const sprite of sprites) {
      for (const stack of this.host.getSpriteScripts(sprite.sourceId)) {
        const hat = stack.blocks[0];
        if (hat?.opcode === opcode && stack.blocks.length > 1 && (!predicate || predicate(hat))) {
          this.spawnThread(sprite.id, stack.id, stack.blocks.slice(1));
        }
      }
    }
  }

  public triggerFlag(): void {
    this.clear();
    this.triggerHat('event_when_flag');
  }

  public triggerKeyPressed(key: string): void {
    this.triggerHat('event_when_key', (hat) => String(hat.inputs.key?.value ?? '') === key);
  }

  public triggerBroadcast(message: string): void {
    for (const thread of this.threads) {
      if (!thread.finished && thread.awaitingEvent === message) {
        thread.awaitingEvent = null;
      }
    }
    this.triggerHat('event_when_broadcast', (hat) => String(hat.inputs.message?.value ?? '') === message);
  }

  public triggerCloneStart(cloneSprite: RuntimeSpriteState): void {
    this.triggerHat('event_when_clone', undefined, cloneSprite);
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
      awaitingCondition: null,
      activeTween: null,
      activeBlockId: blocks[0]?.id ?? null,
      finished: false,
    };
    this.threads.push(thread);
    return thread;
  }

  public stopThreads = (mode: StopScope, spriteId: string, activeThreadId: string): void => {
    for (const t of this.threads) {
      if (mode === 'all') {
        t.finished = true;
      } else if (mode === 'other scripts in sprite') {
        if (t.spriteId === spriteId && t.id !== activeThreadId) {
          t.finished = true;
        }
      } else if (t.id === activeThreadId) {
        t.finished = true;
      }
    }
  };

  public stepTick(dt: number, singleStepMode = false): void {
    const currentThreads = [...this.threads];
    let totalSteps = 0;

    for (const thread of currentThreads) {
      if (thread.finished) continue;
      const sprite = this.host.getSprite(thread.spriteId);
      if (!sprite) {
        thread.finished = true;
        continue;
      }

      if (thread.awaitingEvent !== null) continue;

      if (thread.awaitingCondition) {
        const ready = toBoolean(this.evalInput(thread.awaitingCondition, sprite, thread.frames));
        if (!ready) continue;
        thread.awaitingCondition = null;
      }

      if (thread.activeTween) {
        const tw = thread.activeTween;
        tw.elapsed += dt;
        const progress = tw.duration <= 0 ? 1 : Math.min(1, tw.elapsed / tw.duration);
        const eased = evaluateEasing(progress, tw.easing);
        sprite[tw.prop] = tw.startVal + (tw.targetVal - tw.startVal) * eased;
        if (progress < 1) continue;
        thread.activeTween = null;
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
        totalSteps += 1;
        if (yielded) break;
      }
    }

    this.stepsLastTick = totalSteps;
    this.threads = this.threads.filter((t) => !t.finished);
  }

  private findFunctionDef = (
    sprite: RuntimeSpriteState,
    fnName: string
  ): FunctionDefinition | null => {
    return resolveFunctionDef(this.host, sprite, fnName, this.fastSymbolCache ? this.fnStackCache : null);
  };

  public callCustomFunctionSync = (
    sprite: RuntimeSpriteState,
    fnName: string,
    args: RuntimeValue[],
    depth = 0
  ): RuntimeValue => {
    const maxDepth = this.improvedActive ? 32 : 16;
    if (depth > maxDepth) return 0;
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
      awaitingCondition: null,
      activeTween: null,
      activeBlockId: null,
      finished: false,
      returnValue: 0,
    };

    const maxSyncSteps = this.improvedActive ? Math.max(512, this.maxStepsPerThreadPerTick) : 256;
    let guard = 0;
    while (!tempThread.finished && guard < maxSyncSteps) {
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
    if (input.type === 'literal') return input.value;
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
      lookupLocal,
      callCustomFunctionSync: this.callCustomFunctionSync,
    });
  }

  private stepThreadOneBlock(thread: ScriptThread, sprite: RuntimeSpriteState, depth = 0): boolean {
    while (thread.frames.length > 0) {
      const frame = thread.frames[thread.frames.length - 1];
      if (frame.index < frame.blocks.length) break;

      if (frame.kind === 'forever') {
        frame.index = 0;
        return true;
      }
      if (frame.kind === 'repeat' && (frame.remainingRepeats ?? 0) > 1) {
        frame.remainingRepeats = (frame.remainingRepeats ?? 1) - 1;
        frame.index = 0;
        return true;
      }
      if (frame.kind === 'repeat_until') {
        const done = toBoolean(this.evalInput(frame.conditionInput, sprite, thread.frames, depth));
        if (!done) {
          frame.index = 0;
          return true;
        }
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
      lookupLocal,
      setLocal,
      findFunctionDef: this.findFunctionDef,
      triggerBroadcast: (msg) => this.triggerBroadcast(msg),
      triggerCloneStart: (clone) => this.triggerCloneStart(clone),
      stopThreads: this.stopThreads,
    });
  }
}
