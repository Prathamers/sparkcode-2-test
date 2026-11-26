// SPDX-License-Identifier: AGPL-3.0-or-later
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScriptChangeMeta } from '../components/BlockWorkspace';
import type { WorkspaceTabId } from '../components/WorkspaceTabs';
import type { NoticeState } from '../components/shared/NoticeToast';
import {
  createBlankSprite,
  STARTER_TEMPLATES,
  STUDIO_LAUNCH_TEMPLATES,
} from '../data/starterProjects';
import type { SupporterTierId } from '../data/supporters';
import { BLOCK_DEF_MAP, createBlockNode, createUid, findFreeCanvasPosition } from '../engine/blocks';
import {
  AddSpriteCommand,
  CommandHistoryManager,
  DeleteSpriteCommand,
  UpdateGlobalsCommand,
  UpdateScriptsCommand,
  UpdateSpriteCommand,
  UpdateStageCommand,
  type HistorySnapshot,
  type ProjectCommand,
} from '../engine/history';
import { SparkEngine } from '../engine/SparkEngine';
import { normalizeWebGL2Config } from '../engine/webgl2Pipeline';
import type {
  CostumeData,
  EngineTelemetry,
  RuntimeValue,
  ScriptStack,
  SparkProject,
  SpriteData,
  StageSettings,
} from '../types/project';

interface UseStudioProjectArgs {
  isStudioView: boolean;
  supporterTier: SupporterTierId | null;
  setActiveTab: React.Dispatch<React.SetStateAction<WorkspaceTabId>>;
  openStudioView: () => void;
  showNotice: (kind: NoticeState['kind'], text: string) => void;
}

export function useStudioProject({
  isStudioView,
  supporterTier,
  setActiveTab,
  openStudioView,
  showNotice,
}: UseStudioProjectArgs) {
  const [project, setProject] = useState<SparkProject>(() => STARTER_TEMPLATES[0].build());
  const [selectedSpriteId, setSelectedSpriteId] = useState<string>(
    () => project.sprites[0]?.id ?? ''
  );

  const projectRef = useRef<SparkProject>(project);
  projectRef.current = project;

  const historyRef = useRef<CommandHistoryManager | null>(null);
  if (!historyRef.current) {
    historyRef.current = new CommandHistoryManager(100, 600);
  }
  const history = historyRef.current;
  const [historySnap, setHistorySnap] = useState<HistorySnapshot>(() => history.getSnapshot());

  const engineRef = useRef<SparkEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new SparkEngine(project);
  }
  const engine = engineRef.current;
  const [telemetry, setTelemetry] = useState<EngineTelemetry>(() => engine.getTelemetry());

  useEffect(() => {
    const unsubscribe = engine.subscribe((snap) => setTelemetry(snap));
    return () => {
      unsubscribe();
      engine.dispose();
    };
  }, [engine]);

  useEffect(() => {
    engine.setSelectedSpriteId(selectedSpriteId);
  }, [engine, selectedSpriteId]);

  useEffect(() => {
    engine.setEntitlementTier(supporterTier);
    if (supporterTier !== 'pro' && supporterTier !== 'elite') {
      setActiveTab((curr) => (curr === 'experimental' ? 'code' : curr));
    }
  }, [engine, supporterTier, setActiveTab]);

  const selectedSprite =
    project.sprites.find((s) => s.id === selectedSpriteId) ?? project.sprites[0];

  const loadFreshProject = useCallback(
    (nextProject: SparkProject) => {
      history.clear();
      setHistorySnap(history.getSnapshot());
      projectRef.current = nextProject;
      setProject(nextProject);
      setSelectedSpriteId(nextProject.sprites[0]?.id ?? '');
      engine.loadProject(nextProject);
    },
    [engine, history]
  );

  const executeCommand = useCallback(
    (command: ProjectCommand): SparkProject => {
      const { state: nextProject, rebuildTextures } = history.execute(command, projectRef.current);
      projectRef.current = nextProject;
      setProject(nextProject);
      engine.syncProject(nextProject, rebuildTextures);
      setHistorySnap(history.getSnapshot());
      return nextProject;
    },
    [engine, history]
  );

  const reconcileSelectedSprite = useCallback(
    (nextProject: SparkProject, affectedSpriteId?: string) => {
      if (affectedSpriteId && nextProject.sprites.some((s) => s.id === affectedSpriteId)) {
        setSelectedSpriteId(affectedSpriteId);
        return;
      }
      setSelectedSpriteId((curr) =>
        nextProject.sprites.some((s) => s.id === curr) ? curr : nextProject.sprites[0]?.id ?? ''
      );
    },
    []
  );

  const handleUndo = useCallback(() => {
    const result = history.undo(projectRef.current);
    if (!result) return;
    projectRef.current = result.state;
    setProject(result.state);
    engine.syncProject(result.state, result.rebuildTextures);
    reconcileSelectedSprite(result.state, result.command.affectedSpriteId);
    setHistorySnap(history.getSnapshot());
    showNotice('info', `Undid: ${result.command.label}`);
  }, [engine, history, reconcileSelectedSprite, showNotice]);

  const handleRedo = useCallback(() => {
    const result = history.redo(projectRef.current);
    if (!result) return;
    projectRef.current = result.state;
    setProject(result.state);
    engine.syncProject(result.state, result.rebuildTextures);
    reconcileSelectedSprite(result.state, result.command.affectedSpriteId);
    setHistorySnap(history.getSnapshot());
    showNotice('info', `Redid: ${result.command.label}`);
  }, [engine, history, reconcileSelectedSprite, showNotice]);

  useEffect(() => {
    if (!isStudioView) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isStudioView, handleUndo, handleRedo]);

  const handleOpenStudio = useCallback(
    (templateId?: string) => {
      if (templateId) {
        const tpl = STUDIO_LAUNCH_TEMPLATES.find((t) => t.id === templateId);
        if (tpl) {
          const nextProject = tpl.build();
          loadFreshProject(nextProject);
          showNotice('info', `Loaded "${nextProject.name}"`);
        }
      }
      setActiveTab('code');
      openStudioView();
    },
    [loadFreshProject, openStudioView, setActiveTab, showNotice]
  );

  const handleCreateBlankProject = useCallback(() => {
    const starterSprite = createBlankSprite(1);
    const blankProject: SparkProject = {
      version: '2.0',
      id: createUid('proj'),
      name: 'Untitled Project',
      description: 'Blank SparkCode 2 workspace.',
      stage: {
        width: 560,
        height: 360,
        gravityX: 0,
        gravityY: -900,
        airDrag: 0.5,
        ambientDarkness: 0.15,
        ambientColor: '#050814',
        backgroundShader: 'grid',
        bgColorA: '#090F1E',
        bgColorB: '#0F1B33',
        cameraBounds: { enabled: false, minX: -200, maxX: 200, minY: -150, maxY: 150 },
        defaultZoom: 1,
        stageEffects: { chromatic: 0, pixelate: 0, vignette: 0.15, tint: '#38BDF8', tintAmount: 0 },
      },
      globals: { score: 0 },
      watchedGlobals: ['score'],
      sprites: [starterSprite],
    };
    loadFreshProject(blankProject);
    setActiveTab('code');
    openStudioView();
    showNotice('info', 'Created new blank project');
  }, [loadFreshProject, openStudioView, setActiveTab, showNotice]);

  const handleSelectTemplate = useCallback(
    (templateId: string) => {
      const tpl = STUDIO_LAUNCH_TEMPLATES.find((t) => t.id === templateId);
      if (!tpl) return;
      const nextProject = tpl.build();
      loadFreshProject(nextProject);
      showNotice('info', `Loaded "${nextProject.name}"`);
    },
    [loadFreshProject, showNotice]
  );

  const handleExportJson = useCallback(() => {
    try {
      const json = JSON.stringify(project, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.spark2.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotice('info', 'Project exported as JSON');
    } catch {
      showNotice('error', 'Failed to export project JSON');
    }
  }, [project, showNotice]);

  const handleImportJson = useCallback(
    (jsonText: string) => {
      try {
        const parsed = JSON.parse(jsonText) as SparkProject;
        if (!parsed || !Array.isArray(parsed.sprites) || !parsed.stage) {
          throw new Error('Invalid SparkCode 2 project format');
        }
        loadFreshProject(parsed);
        openStudioView();
        showNotice('info', `Imported "${parsed.name || 'Custom Project'}"`);
      } catch (err) {
        showNotice('error', err instanceof Error ? err.message : 'Invalid JSON file');
      }
    },
    [loadFreshProject, openStudioView, showNotice]
  );

  const getCurrentSprite = useCallback(
    () =>
      projectRef.current.sprites.find((s) => s.id === selectedSpriteId) ??
      projectRef.current.sprites[0],
    [selectedSpriteId]
  );

  const handleUpdateSprite = useCallback(
    (nextSprite: SpriteData, rebuildTextures = false) => {
      const prevSprite = projectRef.current.sprites.find((sp) => sp.id === nextSprite.id);
      if (!prevSprite) return;
      executeCommand(
        new UpdateSpriteCommand(
          prevSprite,
          nextSprite,
          rebuildTextures,
          rebuildTextures ? `Edit ${nextSprite.name} costume` : `Update ${nextSprite.name}`,
          rebuildTextures ? undefined : `sprite:${nextSprite.id}`
        )
      );
    },
    [executeCommand]
  );

  const handleChangeScripts = useCallback(
    (scripts: ScriptStack[], meta?: ScriptChangeMeta) => {
      const currentSprite = getCurrentSprite();
      if (!currentSprite) return;
      executeCommand(
        new UpdateScriptsCommand(
          currentSprite.id,
          currentSprite.scripts,
          scripts,
          meta?.label ?? 'Edit blocks',
          meta?.mergeKey
        )
      );
    },
    [getCurrentSprite, executeCommand]
  );

  const handleQuickAddBlock = useCallback(
    (opcode: string) => {
      const currentSprite = getCurrentSprite();
      if (!currentSprite) return;
      const def = BLOCK_DEF_MAP[opcode];
      if (!def) return;
      setActiveTab('code');

      const node = createBlockNode(opcode);
      const currentScripts = currentSprite.scripts;

      if (
        def.shape === 'hat' ||
        def.shape === 'reporter' ||
        def.shape === 'boolean' ||
        currentScripts.length === 0
      ) {
        const draft: ScriptStack = {
          id: createUid('stack'),
          x: 20,
          y: 20,
          blocks: [node],
        };
        const pos = findFreeCanvasPosition(currentScripts, draft);
        handleChangeScripts([...currentScripts, { ...draft, x: pos.x, y: pos.y }], {
          label: 'Add block',
        });
        return;
      }

      const updated = currentScripts.map((st, idx) =>
        idx === 0 ? { ...st, blocks: [...st.blocks, node] } : st
      );
      handleChangeScripts(updated, { label: 'Add block' });
    },
    [getCurrentSprite, setActiveTab, handleChangeScripts]
  );

  const handleCreateCustomFunction = useCallback(
    (name: string, param1: string, param2: string) => {
      const currentSprite = getCurrentSprite();
      if (!currentSprite) return;
      setActiveTab('code');
      const draft: ScriptStack = {
        id: createUid('stack'),
        x: 20,
        y: 20,
        blocks: [
          createBlockNode('fn_define', { name, param1, param2 }),
          createBlockNode('data_let_local', { name: 'out', value: 0 }),
          createBlockNode('fn_return', { value: 0 }),
        ],
      };
      const pos = findFreeCanvasPosition(currentSprite.scripts, draft);
      const nextSprite: SpriteData = {
        ...currentSprite,
        functions: [
          ...currentSprite.functions,
          {
            id: createUid('fn'),
            name,
            params: [param1, param2]
              .filter(Boolean)
              .map((p) => ({ name: p, type: 'number' as const })),
            returnsValue: true,
          },
        ],
        scripts: [...currentSprite.scripts, { ...draft, x: pos.x, y: pos.y }],
      };
      executeCommand(
        new UpdateSpriteCommand(currentSprite, nextSprite, false, `Create function "${name}"`)
      );
      showNotice('info', `Created custom function "${name}"`);
    },
    [getCurrentSprite, setActiveTab, executeCommand, showNotice]
  );

  const handleAddSprite = useCallback(() => {
    const newSp = createBlankSprite(projectRef.current.sprites.length + 1);
    executeCommand(new AddSpriteCommand(newSp, `Add ${newSp.name}`));
    setSelectedSpriteId(newSp.id);
  }, [executeCommand]);

  const handleAddSpriteFromLibrary = useCallback(
    (newSp: SpriteData) => {
      executeCommand(new AddSpriteCommand(newSp, `Add ${newSp.name} from library`));
      setSelectedSpriteId(newSp.id);
      showNotice('info', `Added "${newSp.name}" to stage`);
    },
    [executeCommand, showNotice]
  );

  const handleAddCostumeFromLibrary = useCallback(
    (costume: CostumeData, replaceActive = false) => {
      const currentSprite = getCurrentSprite();
      if (!currentSprite) return;

      const activeIdx = Math.min(
        currentSprite.activeCostumeIndex,
        Math.max(0, currentSprite.costumes.length - 1)
      );
      const nextCostumes =
        replaceActive && currentSprite.costumes.length > 0
          ? currentSprite.costumes.map((c, idx) => (idx === activeIdx ? costume : c))
          : [...currentSprite.costumes, costume];
      const nextIndex = replaceActive ? activeIdx : nextCostumes.length - 1;

      executeCommand(
        new UpdateSpriteCommand(
          currentSprite,
          { ...currentSprite, costumes: nextCostumes, activeCostumeIndex: nextIndex },
          true,
          replaceActive
            ? `Replace costume on ${currentSprite.name}`
            : `Add costume "${costume.name}" to ${currentSprite.name}`
        )
      );
      showNotice(
        'info',
        replaceActive
          ? `Replaced active costume on "${currentSprite.name}" with "${costume.name}"`
          : `Added costume "${costume.name}" to "${currentSprite.name}"`
      );
    },
    [getCurrentSprite, executeCommand, showNotice]
  );

  const handleApplyBackdropFromLibrary = useCallback(
    (nextStage: StageSettings, label: string) => {
      executeCommand(
        new UpdateStageCommand(projectRef.current.stage, nextStage, `Apply backdrop: ${label}`)
      );
      showNotice('info', `Applied backdrop: ${label}`);
    },
    [executeCommand, showNotice]
  );

  const handleDuplicateSprite = useCallback(
    (id: string) => {
      const src = projectRef.current.sprites.find((s) => s.id === id);
      if (!src) return;
      const copy: SpriteData = {
        ...structuredClone(src),
        id: createUid('sp'),
        name: `${src.name} Copy`,
        x: src.x + 28,
        y: src.y + 18,
      };
      executeCommand(new AddSpriteCommand(copy, `Duplicate ${src.name}`));
      setSelectedSpriteId(copy.id);
    },
    [executeCommand]
  );

  const handleDeleteSprite = useCallback(
    (id: string) => {
      const sprites = projectRef.current.sprites;
      if (sprites.length <= 1) return;
      const idx = sprites.findIndex((s) => s.id === id);
      if (idx === -1) return;
      const target = sprites[idx];
      const nextProject = executeCommand(
        new DeleteSpriteCommand(target, idx, `Delete ${target.name}`)
      );
      if (selectedSpriteId === id) {
        setSelectedSpriteId(nextProject.sprites[0]?.id ?? '');
      }
    },
    [executeCommand, selectedSpriteId]
  );

  const handleChangeStage = useCallback(
    (stage: StageSettings) => {
      executeCommand(
        new UpdateStageCommand(
          projectRef.current.stage,
          stage,
          'Update stage settings',
          'stage:settings'
        )
      );
    },
    [executeCommand]
  );

  const handleToggleRenderBackend = useCallback(() => {
    if (supporterTier !== 'elite') {
      if (supporterTier === 'pro') {
        setActiveTab('experimental');
        showNotice(
          'info',
          'WebGL2 Hardware Shadow & Bloom Pass is an Elite Member experimental feature'
        );
      } else {
        showNotice('info', 'Available to selected members only');
      }
      return;
    }
    const currentStage = projectRef.current.stage;
    const currentGl = normalizeWebGL2Config(currentStage.webgl2);
    const nextBackend = currentGl.backend === 'webgl2' ? 'canvas2d' : 'webgl2';
    executeCommand(
      new UpdateStageCommand(
        currentStage,
        { ...currentStage, webgl2: { ...currentGl, backend: nextBackend } },
        nextBackend === 'webgl2' ? 'Enable WebGL2 GPU lighting & bloom' : 'Switch to 2D Canvas renderer'
      )
    );
    showNotice(
      'info',
      nextBackend === 'webgl2'
        ? 'WebGL2 Hardware Shadow & Bloom Pass enabled (automatic 2D Canvas fallback)'
        : 'Switched to native 2D Canvas renderer'
    );
  }, [supporterTier, setActiveTab, executeCommand, showNotice]);

  const handleChangeGlobals = useCallback(
    (globals: Record<string, RuntimeValue>, watchedGlobals: string[]) => {
      executeCommand(
        new UpdateGlobalsCommand(
          projectRef.current.globals,
          projectRef.current.watchedGlobals,
          globals,
          watchedGlobals,
          'Update global variables'
        )
      );
    },
    [executeCommand]
  );

  return {
    project,
    selectedSpriteId,
    setSelectedSpriteId,
    selectedSprite,
    engine,
    telemetry,
    historySnap,
    handleUndo,
    handleRedo,
    handleOpenStudio,
    handleCreateBlankProject,
    handleSelectTemplate,
    handleExportJson,
    handleImportJson,
    handleUpdateSprite,
    handleChangeScripts,
    handleQuickAddBlock,
    handleCreateCustomFunction,
    handleAddSprite,
    handleAddSpriteFromLibrary,
    handleAddCostumeFromLibrary,
    handleApplyBackdropFromLibrary,
    handleDuplicateSprite,
    handleDeleteSprite,
    handleChangeStage,
    handleToggleRenderBackend,
    handleChangeGlobals,
  };
}
