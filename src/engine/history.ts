import type {
  RuntimeValue,
  ScriptStack,
  SparkProject,
  SpriteData,
  StageSettings,
} from '../types/project';

export interface ProjectCommand {
  readonly id: string;
  readonly label: string;
  /** True when executing or undoing this command requires rebuilding Canvas sprite textures. */
  readonly rebuildTextures: boolean;
  /** Optional sprite ID impacted by this command so the UI can keep selection focused. */
  readonly affectedSpriteId?: string;
  /** Optional key for coalescing rapid consecutive edits (e.g. typing inputs or scrubbing sliders). */
  readonly mergeKey?: string;
  readonly timestamp: number;
  execute(state: SparkProject): SparkProject;
  undo(state: SparkProject): SparkProject;
  mergeWith?(next: ProjectCommand): ProjectCommand | null;
}

export interface HistorySnapshot {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  undoLabel: string | null;
  redoLabel: string | null;
}

let commandSeq = 1;
function nextCommandId(): string {
  commandSeq += 1;
  return `cmd_${commandSeq}`;
}

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

/**
 * Command for block workspace mutations (snapping, moving, deleting, editing inputs, tidying).
 */
export class UpdateScriptsCommand implements ProjectCommand {
  public readonly id = nextCommandId();
  public readonly label: string;
  public readonly rebuildTextures = false;
  public readonly affectedSpriteId: string;
  public readonly mergeKey?: string;
  public readonly timestamp: number;

  private readonly spriteId: string;
  private readonly prevScripts: ScriptStack[];
  private readonly nextScripts: ScriptStack[];

  constructor(
    spriteId: string,
    prevScripts: ScriptStack[],
    nextScripts: ScriptStack[],
    label = 'Edit blocks',
    mergeKey?: string,
    timestamp = Date.now()
  ) {
    this.spriteId = spriteId;
    this.affectedSpriteId = spriteId;
    this.prevScripts = cloneValue(prevScripts);
    this.nextScripts = cloneValue(nextScripts);
    this.label = label;
    this.mergeKey = mergeKey;
    this.timestamp = timestamp;
  }

  public execute(state: SparkProject): SparkProject {
    const nextCopy = cloneValue(this.nextScripts);
    return {
      ...state,
      sprites: state.sprites.map((sp) =>
        sp.id === this.spriteId ? { ...sp, scripts: nextCopy } : sp
      ),
    };
  }

  public undo(state: SparkProject): SparkProject {
    const prevCopy = cloneValue(this.prevScripts);
    return {
      ...state,
      sprites: state.sprites.map((sp) =>
        sp.id === this.spriteId ? { ...sp, scripts: prevCopy } : sp
      ),
    };
  }

  public mergeWith(next: ProjectCommand): ProjectCommand | null {
    if (
      next instanceof UpdateScriptsCommand &&
      this.mergeKey &&
      next.mergeKey === this.mergeKey &&
      next.spriteId === this.spriteId
    ) {
      return new UpdateScriptsCommand(
        this.spriteId,
        this.prevScripts,
        next.nextScripts,
        next.label,
        this.mergeKey,
        next.timestamp
      );
    }
    return null;
  }
}

/**
 * Command for sprite property, custom function, physics/light, or costume edits.
 */
export class UpdateSpriteCommand implements ProjectCommand {
  public readonly id = nextCommandId();
  public readonly label: string;
  public readonly rebuildTextures: boolean;
  public readonly affectedSpriteId: string;
  public readonly mergeKey?: string;
  public readonly timestamp: number;

  private readonly spriteId: string;
  private readonly prevSprite: SpriteData;
  private readonly nextSprite: SpriteData;

  constructor(
    prevSprite: SpriteData,
    nextSprite: SpriteData,
    rebuildTextures = false,
    label = 'Update sprite',
    mergeKey?: string,
    timestamp = Date.now()
  ) {
    this.spriteId = nextSprite.id;
    this.affectedSpriteId = nextSprite.id;
    this.prevSprite = cloneValue(prevSprite);
    this.nextSprite = cloneValue(nextSprite);
    this.rebuildTextures = rebuildTextures;
    this.label = label;
    this.mergeKey = mergeKey;
    this.timestamp = timestamp;
  }

  public execute(state: SparkProject): SparkProject {
    const nextCopy = cloneValue(this.nextSprite);
    return {
      ...state,
      sprites: state.sprites.map((sp) => (sp.id === this.spriteId ? nextCopy : sp)),
    };
  }

  public undo(state: SparkProject): SparkProject {
    const prevCopy = cloneValue(this.prevSprite);
    return {
      ...state,
      sprites: state.sprites.map((sp) => (sp.id === this.spriteId ? prevCopy : sp)),
    };
  }

  public mergeWith(next: ProjectCommand): ProjectCommand | null {
    if (
      next instanceof UpdateSpriteCommand &&
      this.mergeKey &&
      next.mergeKey === this.mergeKey &&
      next.spriteId === this.spriteId &&
      next.rebuildTextures === this.rebuildTextures
    ) {
      return new UpdateSpriteCommand(
        this.prevSprite,
        next.nextSprite,
        this.rebuildTextures,
        next.label,
        this.mergeKey,
        next.timestamp
      );
    }
    return null;
  }
}

/**
 * Command for adding or duplicating a sprite in the project.
 */
export class AddSpriteCommand implements ProjectCommand {
  public readonly id = nextCommandId();
  public readonly label: string;
  public readonly rebuildTextures = true;
  public readonly affectedSpriteId: string;
  public readonly timestamp: number;

  private readonly sprite: SpriteData;

  constructor(sprite: SpriteData, label = `Add ${sprite.name}`, timestamp = Date.now()) {
    this.sprite = cloneValue(sprite);
    this.affectedSpriteId = sprite.id;
    this.label = label;
    this.timestamp = timestamp;
  }

  public execute(state: SparkProject): SparkProject {
    const copy = cloneValue(this.sprite);
    return {
      ...state,
      sprites: [...state.sprites, copy],
    };
  }

  public undo(state: SparkProject): SparkProject {
    return {
      ...state,
      sprites: state.sprites.filter((sp) => sp.id !== this.sprite.id),
    };
  }
}

/**
 * Command for deleting a sprite while remembering its exact index for clean restoration on undo.
 */
export class DeleteSpriteCommand implements ProjectCommand {
  public readonly id = nextCommandId();
  public readonly label: string;
  public readonly rebuildTextures = true;
  public readonly affectedSpriteId: string;
  public readonly timestamp: number;

  private readonly sprite: SpriteData;
  private readonly index: number;

  constructor(sprite: SpriteData, index: number, label = `Delete ${sprite.name}`, timestamp = Date.now()) {
    this.sprite = cloneValue(sprite);
    this.index = Math.max(0, index);
    this.affectedSpriteId = sprite.id;
    this.label = label;
    this.timestamp = timestamp;
  }

  public execute(state: SparkProject): SparkProject {
    return {
      ...state,
      sprites: state.sprites.filter((sp) => sp.id !== this.sprite.id),
    };
  }

  public undo(state: SparkProject): SparkProject {
    const copy = cloneValue(this.sprite);
    const nextSprites = [...state.sprites];
    const insertIdx = Math.min(this.index, nextSprites.length);
    nextSprites.splice(insertIdx, 0, copy);
    return {
      ...state,
      sprites: nextSprites,
    };
  }
}

/**
 * Command for Stage & World settings updates (gravity, shaders, lighting, effects, camera bounds).
 */
export class UpdateStageCommand implements ProjectCommand {
  public readonly id = nextCommandId();
  public readonly label: string;
  public readonly rebuildTextures = false;
  public readonly mergeKey?: string;
  public readonly timestamp: number;

  private readonly prevStage: StageSettings;
  private readonly nextStage: StageSettings;

  constructor(
    prevStage: StageSettings,
    nextStage: StageSettings,
    label = 'Update stage settings',
    mergeKey?: string,
    timestamp = Date.now()
  ) {
    this.prevStage = cloneValue(prevStage);
    this.nextStage = cloneValue(nextStage);
    this.label = label;
    this.mergeKey = mergeKey;
    this.timestamp = timestamp;
  }

  public execute(state: SparkProject): SparkProject {
    return {
      ...state,
      stage: cloneValue(this.nextStage),
    };
  }

  public undo(state: SparkProject): SparkProject {
    return {
      ...state,
      stage: cloneValue(this.prevStage),
    };
  }

  public mergeWith(next: ProjectCommand): ProjectCommand | null {
    if (
      next instanceof UpdateStageCommand &&
      this.mergeKey &&
      next.mergeKey === this.mergeKey
    ) {
      return new UpdateStageCommand(
        this.prevStage,
        next.nextStage,
        next.label,
        this.mergeKey,
        next.timestamp
      );
    }
    return null;
  }
}

/**
 * Command for global variables and HUD watched globals updates.
 */
export class UpdateGlobalsCommand implements ProjectCommand {
  public readonly id = nextCommandId();
  public readonly label: string;
  public readonly rebuildTextures = false;
  public readonly mergeKey?: string;
  public readonly timestamp: number;

  private readonly prevGlobals: Record<string, RuntimeValue>;
  private readonly prevWatched: string[];
  private readonly nextGlobals: Record<string, RuntimeValue>;
  private readonly nextWatched: string[];

  constructor(
    prevGlobals: Record<string, RuntimeValue>,
    prevWatched: string[],
    nextGlobals: Record<string, RuntimeValue>,
    nextWatched: string[],
    label = 'Update global variables',
    mergeKey?: string,
    timestamp = Date.now()
  ) {
    this.prevGlobals = cloneValue(prevGlobals);
    this.prevWatched = [...prevWatched];
    this.nextGlobals = cloneValue(nextGlobals);
    this.nextWatched = [...nextWatched];
    this.label = label;
    this.mergeKey = mergeKey;
    this.timestamp = timestamp;
  }

  public execute(state: SparkProject): SparkProject {
    return {
      ...state,
      globals: cloneValue(this.nextGlobals),
      watchedGlobals: [...this.nextWatched],
    };
  }

  public undo(state: SparkProject): SparkProject {
    return {
      ...state,
      globals: cloneValue(this.prevGlobals),
      watchedGlobals: [...this.prevWatched],
    };
  }

  public mergeWith(next: ProjectCommand): ProjectCommand | null {
    if (
      next instanceof UpdateGlobalsCommand &&
      this.mergeKey &&
      next.mergeKey === this.mergeKey
    ) {
      return new UpdateGlobalsCommand(
        this.prevGlobals,
        this.prevWatched,
        next.nextGlobals,
        next.nextWatched,
        next.label,
        this.mergeKey,
        next.timestamp
      );
    }
    return null;
  }
}

/**
 * Bounded command-pattern history manager supporting undo, redo, and rapid-edit coalescing.
 */
export class CommandHistoryManager {
  private undoStack: ProjectCommand[] = [];
  private redoStack: ProjectCommand[] = [];
  private readonly maxDepth: number;
  private readonly coalesceWindowMs: number;

  constructor(maxDepth = 100, coalesceWindowMs = 600) {
    this.maxDepth = Math.max(1, maxDepth);
    this.coalesceWindowMs = Math.max(0, coalesceWindowMs);
  }

  public execute(
    command: ProjectCommand,
    currentState: SparkProject
  ): { state: SparkProject; rebuildTextures: boolean } {
    const nextState = command.execute(currentState);
    this.redoStack = [];

    const top = this.undoStack[this.undoStack.length - 1];
    if (
      top &&
      top.mergeKey &&
      command.mergeKey === top.mergeKey &&
      command.timestamp - top.timestamp <= this.coalesceWindowMs &&
      typeof top.mergeWith === 'function'
    ) {
      const merged = top.mergeWith(command);
      if (merged) {
        this.undoStack[this.undoStack.length - 1] = merged;
        return { state: nextState, rebuildTextures: command.rebuildTextures };
      }
    }

    this.undoStack.push(command);
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
    return { state: nextState, rebuildTextures: command.rebuildTextures };
  }

  public undo(currentState: SparkProject): {
    state: SparkProject;
    command: ProjectCommand;
    rebuildTextures: boolean;
  } | null {
    const command = this.undoStack.pop();
    if (!command) return null;
    const prevState = command.undo(currentState);
    this.redoStack.push(command);
    return {
      state: prevState,
      command,
      rebuildTextures: command.rebuildTextures,
    };
  }

  public redo(currentState: SparkProject): {
    state: SparkProject;
    command: ProjectCommand;
    rebuildTextures: boolean;
  } | null {
    const command = this.redoStack.pop();
    if (!command) return null;
    const nextState = command.execute(currentState);
    this.undoStack.push(command);
    return {
      state: nextState,
      command,
      rebuildTextures: command.rebuildTextures,
    };
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  public getSnapshot(): HistorySnapshot {
    const topUndo = this.undoStack[this.undoStack.length - 1] ?? null;
    const topRedo = this.redoStack[this.redoStack.length - 1] ?? null;
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      undoLabel: topUndo?.label ?? null,
      redoLabel: topRedo?.label ?? null,
    };
  }
}
