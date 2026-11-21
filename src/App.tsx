import { useCallback, useEffect, useRef, useState } from 'react';
import { BlockPalette } from './components/BlockPalette';
import type { DragPayload } from './components/BlockView';
import type { ScriptChangeMeta } from './components/BlockWorkspace';
import { HomeScreen } from './components/HomeScreen';
import { SpriteInspector } from './components/SpriteInspector';
import { StageViewport } from './components/StageViewport';
import { SupportUsPage } from './components/SupportUsPage';
import { TemplateSelectorScreen } from './components/TemplateSelectorScreen';
import { TopBar } from './components/TopBar';
import { WorkspaceTabs, type WorkspaceTabId } from './components/WorkspaceTabs';
import { createBlankSprite, STARTER_TEMPLATES, STUDIO_LAUNCH_TEMPLATES } from './data/starterProjects';
import {
  addEliteSupporter,
  loadEliteSupporters,
  loadRoadmapVotes,
  loadSupporterProfile,
  saveRoadmapVotes,
  saveSupporterProfile,
  type EliteSupporter,
  type LocalSupporterProfile,
} from './data/supporters';
import { BLOCK_DEF_MAP, createBlockNode, createUid, findFreeCanvasPosition } from './engine/blocks';
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
} from './engine/history';
import { SparkEngine } from './engine/SparkEngine';
import { normalizeWebGL2Config } from './engine/webgl2Pipeline';
import type {
  EngineTelemetry,
  RuntimeValue,
  ScriptStack,
  SparkProject,
  SpriteData,
  StageSettings,
} from './types/project';

export default function App() {
  const [view, setView] = useState<'home' | 'select-template' | 'studio' | 'support'>('home');
  const [project, setProject] = useState<SparkProject>(() => STARTER_TEMPLATES[0].build());
  const [selectedSpriteId, setSelectedSpriteId] = useState<string>(() => project.sprites[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('code');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDrag, setActiveDrag] = useState<DragPayload | null>(null);
  const [notice, setNotice] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);
  const [supporterProfile, setSupporterProfile] = useState<LocalSupporterProfile | null>(() =>
    loadSupporterProfile()
  );
  const [eliteSupporters, setEliteSupporters] = useState<EliteSupporter[]>(() =>
    loadEliteSupporters()
  );
  const [roadmapVotes, setRoadmapVotes] = useState<string[]>(() => loadRoadmapVotes());

  // Ref mirror of latest project state so command execution never double-fires under StrictMode
  const projectRef = useRef<SparkProject>(project);
  projectRef.current = project;

  // Command-pattern history manager for undo/redo across blocks and project edits
  const historyRef = useRef<CommandHistoryManager | null>(null);
  if (!historyRef.current) {
    historyRef.current = new CommandHistoryManager(100, 600);
  }
  const history = historyRef.current;
  const [historySnap, setHistorySnap] = useState<HistorySnapshot>(() => history.getSnapshot());

  // Decoupled 60 FPS native engine controller (instantiated once)
  const engineRef = useRef<SparkEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new SparkEngine(project);
  }
  const engine = engineRef.current;

  // Throttled (~15 FPS) engine telemetry state for React UI
  const [telemetry, setTelemetry] = useState<EngineTelemetry>(() => engine.getTelemetry());

  useEffect(() => {
    const unsubscribe = engine.subscribe((snap) => {
      setTelemetry(snap);
    });
    return () => {
      unsubscribe();
      engine.dispose();
    };
  }, [engine]);

  useEffect(() => {
    engine.setSelectedSpriteId(selectedSpriteId);
  }, [engine, selectedSpriteId]);

  const showNotice = useCallback((kind: 'info' | 'error', text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => {
      setNotice((curr) => (curr?.text === text ? null : curr));
    }, 3200);
  }, []);

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

  // Global Studio keyboard shortcuts: Ctrl/Cmd+Z (Undo), Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y (Redo)
  useEffect(() => {
    if (view !== 'studio') return;
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
  }, [view, handleUndo, handleRedo]);

  const handleOpenStudio = (templateId?: string) => {
    if (templateId) {
      const tpl = STUDIO_LAUNCH_TEMPLATES.find((t) => t.id === templateId);
      if (tpl) {
        const nextProject = tpl.build();
        loadFreshProject(nextProject);
        showNotice('info', `Loaded "${nextProject.name}"`);
      }
    }
    setActiveTab('code');
    setView('studio');
  };

  const handleCreateBlankProject = () => {
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
    setView('studio');
    showNotice('info', 'Created new blank project');
  };

  const handleSelectTemplate = (templateId: string) => {
    const tpl = STUDIO_LAUNCH_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const nextProject = tpl.build();
    loadFreshProject(nextProject);
    showNotice('info', `Loaded "${nextProject.name}"`);
  };

  const handleExportJson = () => {
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
  };

  const handleImportJson = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText) as SparkProject;
      if (!parsed || !Array.isArray(parsed.sprites) || !parsed.stage) {
        throw new Error('Invalid SparkCode 2 project format');
      }
      loadFreshProject(parsed);
      setView('studio');
      showNotice('info', `Imported "${parsed.name || 'Custom Project'}"`);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Invalid JSON file');
    }
  };

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
      const currentSprite =
        projectRef.current.sprites.find((s) => s.id === selectedSpriteId) ??
        projectRef.current.sprites[0];
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
    [selectedSpriteId, executeCommand]
  );

  const handleQuickAddBlock = useCallback(
    (opcode: string) => {
      const currentSprite =
        projectRef.current.sprites.find((s) => s.id === selectedSpriteId) ??
        projectRef.current.sprites[0];
      if (!currentSprite) return;
      const def = BLOCK_DEF_MAP[opcode];
      if (!def) return;
      setActiveTab('code');

      const node = createBlockNode(opcode);
      const currentScripts = currentSprite.scripts;

      if (def.shape === 'hat' || def.shape === 'reporter' || def.shape === 'boolean' || currentScripts.length === 0) {
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

      // Append statement/C-block to the first script stack
      const updated = currentScripts.map((st, idx) =>
        idx === 0 ? { ...st, blocks: [...st.blocks, node] } : st
      );
      handleChangeScripts(updated, { label: 'Add block' });
    },
    [selectedSpriteId, handleChangeScripts]
  );

  const handleCreateCustomFunction = useCallback(
    (name: string, param1: string, param2: string) => {
      const currentSprite =
        projectRef.current.sprites.find((s) => s.id === selectedSpriteId) ??
        projectRef.current.sprites[0];
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
      const newStack: ScriptStack = { ...draft, x: pos.x, y: pos.y };
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
        scripts: [...currentSprite.scripts, newStack],
      };
      executeCommand(
        new UpdateSpriteCommand(currentSprite, nextSprite, false, `Create function "${name}"`)
      );
      showNotice('info', `Created custom function "${name}"`);
    },
    [selectedSpriteId, executeCommand, showNotice]
  );

  const handleAddSprite = () => {
    const newSp = createBlankSprite(projectRef.current.sprites.length + 1);
    executeCommand(new AddSpriteCommand(newSp, `Add ${newSp.name}`));
    setSelectedSpriteId(newSp.id);
  };

  const handleDuplicateSprite = (id: string) => {
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
  };

  const handleDeleteSprite = (id: string) => {
    const sprites = projectRef.current.sprites;
    if (sprites.length <= 1) return;
    const idx = sprites.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const target = sprites[idx];
    const nextProject = executeCommand(new DeleteSpriteCommand(target, idx, `Delete ${target.name}`));
    if (selectedSpriteId === id) {
      setSelectedSpriteId(nextProject.sprites[0]?.id ?? '');
    }
  };

  const handleChangeStage = (stage: StageSettings) => {
    executeCommand(
      new UpdateStageCommand(projectRef.current.stage, stage, 'Update stage settings', 'stage:settings')
    );
  };

  const handleToggleRenderBackend = () => {
    const currentStage = projectRef.current.stage;
    const currentGl = normalizeWebGL2Config(currentStage.webgl2);
    const nextBackend = currentGl.backend === 'webgl2' ? 'canvas2d' : 'webgl2';
    const nextStage: StageSettings = {
      ...currentStage,
      webgl2: { ...currentGl, backend: nextBackend },
    };
    executeCommand(
      new UpdateStageCommand(
        currentStage,
        nextStage,
        nextBackend === 'webgl2' ? 'Enable WebGL2 GPU lighting & bloom' : 'Switch to 2D Canvas renderer'
      )
    );
    showNotice(
      'info',
      nextBackend === 'webgl2'
        ? 'WebGL2 Hardware Shadow & Bloom Pass enabled (automatic 2D Canvas fallback)'
        : 'Switched to native 2D Canvas renderer'
    );
  };

  const handleChangeGlobals = (
    globals: Record<string, RuntimeValue>,
    watchedGlobals: string[]
  ) => {
    executeCommand(
      new UpdateGlobalsCommand(
        projectRef.current.globals,
        projectRef.current.watchedGlobals,
        globals,
        watchedGlobals,
        'Update global variables'
      )
    );
  };

  const handleActivateSupport = useCallback(
    (profile: LocalSupporterProfile) => {
      setSupporterProfile(profile);
      saveSupporterProfile(profile);
      if (profile.tier === 'elite') {
        const updated = addEliteSupporter(profile.displayName, 'Elite Member');
        setEliteSupporters(updated);
      }
      showNotice(
        'info',
        profile.tier === 'elite'
          ? `Welcome ${profile.displayName} — Elite Badge & Homepage Supporters credit active`
          : `Supporter tier activated for ${profile.displayName}`
      );
    },
    [showNotice]
  );

  const handleCancelSupport = useCallback(() => {
    setSupporterProfile(null);
    saveSupporterProfile(null);
    showNotice('info', 'Cleared local supporter membership');
  }, [showNotice]);

  const handleToggleRoadmapVote = useCallback((itemId: string) => {
    setRoadmapVotes((prev) => {
      const next = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      saveRoadmapVotes(next);
      return next;
    });
  }, []);

  if (view === 'home') {
    return (
      <>
        <HomeScreen
          eliteSupporters={eliteSupporters}
          onLaunchStudio={() => setView('select-template')}
          onOpenStudio={handleOpenStudio}
          onCreateBlankProject={handleCreateBlankProject}
          onImportJson={handleImportJson}
          onOpenSupportUs={() => setView('support')}
        />
        {notice && (
          <div
            role="status"
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-md border text-xs font-medium shadow-lg ${
              notice.kind === 'error'
                ? 'bg-rose-950/95 border-rose-500/60 text-rose-100'
                : 'bg-slate-900/95 border-sky-500/50 text-sky-100'
            }`}
          >
            {notice.text}
          </div>
        )}
      </>
    );
  }

  if (view === 'select-template') {
    return (
      <>
        <TemplateSelectorScreen
          initialTemplateId={project.id}
          onSelectTemplate={(templateId) => handleOpenStudio(templateId)}
          onImportJson={handleImportJson}
          onGoHome={() => setView('home')}
          onOpenSupportUs={() => setView('support')}
        />
        {notice && (
          <div
            role="status"
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-md border text-xs font-medium shadow-lg ${
              notice.kind === 'error'
                ? 'bg-rose-950/95 border-rose-500/60 text-rose-100'
                : 'bg-slate-900/95 border-sky-500/50 text-sky-100'
            }`}
          >
            {notice.text}
          </div>
        )}
      </>
    );
  }

  if (view === 'support') {
    return (
      <>
        <SupportUsPage
          activeProfile={supporterProfile}
          eliteSupporters={eliteSupporters}
          roadmapVotes={roadmapVotes}
          onActivateSupport={handleActivateSupport}
          onCancelSupport={handleCancelSupport}
          onToggleRoadmapVote={handleToggleRoadmapVote}
          onGoHome={() => setView('home')}
          onOpenStudio={() => setView('select-template')}
        />
        {notice && (
          <div
            role="status"
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-md border text-xs font-medium shadow-lg ${
              notice.kind === 'error'
                ? 'bg-rose-950/95 border-rose-500/60 text-rose-100'
                : 'bg-slate-900/95 border-sky-500/50 text-sky-100'
            }`}
          >
            {notice.text}
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className="h-screen w-screen flex flex-col bg-[#0B0F17] text-slate-100 overflow-hidden"
      data-run-state={telemetry.runState}
    >
      <TopBar
        projectName={project.name}
        activeTemplateId={project.id}
        runState={telemetry.runState}
        canUndo={historySnap.canUndo}
        canRedo={historySnap.canRedo}
        undoLabel={historySnap.undoLabel}
        redoLabel={historySnap.redoLabel}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onGoHome={() => {
          engine.stop();
          setView('home');
        }}
        onSelectTemplate={handleSelectTemplate}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onRun={() => engine.run()}
        onStop={() => engine.stop()}
      />

      {/* Three-Pane IDE Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Panel: Categorized Block Palette */}
        <BlockPalette
          onQuickAddBlock={handleQuickAddBlock}
          onCreateCustomFunction={handleCreateCustomFunction}
          onDragStartBlock={setActiveDrag}
          onDragEndBlock={() => setActiveDrag(null)}
        />

        {/* Center Panel: Tabbed Workspace (Code | Costumes | Stage & World) */}
        {selectedSprite && (
          <WorkspaceTabs
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            project={project}
            selectedSprite={selectedSprite}
            activeBlockIds={telemetry.activeBlockIds}
            activeDrag={activeDrag}
            renderBackend={telemetry.renderBackend}
            onDragStartBlock={setActiveDrag}
            onDragEndBlock={() => setActiveDrag(null)}
            onChangeScripts={handleChangeScripts}
            onChangeSprite={handleUpdateSprite}
            onChangeStage={handleChangeStage}
            onChangeGlobals={handleChangeGlobals}
          />
        )}

        {/* Right Panel: High-DPI Stage Viewport + Sprite & Clone Inspector */}
        <aside className="w-[392px] shrink-0 flex flex-col h-full border-l border-slate-800/90 bg-[#101623] overflow-hidden">
          <StageViewport
            engine={engine}
            telemetry={telemetry}
            watchedGlobals={project.watchedGlobals}
            renderBackendMode={normalizeWebGL2Config(project.stage.webgl2).backend}
            onToggleRenderBackend={handleToggleRenderBackend}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen((v) => !v)}
            onRun={() => engine.run()}
            onPause={() => engine.pause()}
            onStop={() => engine.stop()}
            onStep={() => engine.stepOnce()}
          />
          <SpriteInspector
            sprites={project.sprites}
            selectedSpriteId={selectedSprite?.id ?? ''}
            telemetry={telemetry}
            onSelectSprite={setSelectedSpriteId}
            onUpdateSprite={(sp) => handleUpdateSprite(sp, false)}
            onAddSprite={handleAddSprite}
            onDuplicateSprite={handleDuplicateSprite}
            onDeleteSprite={handleDeleteSprite}
          />
        </aside>
      </div>

      {/* Subtle transient feedback toast */}
      {notice && (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-md border text-xs font-medium shadow-lg ${
            notice.kind === 'error'
              ? 'bg-rose-950/95 border-rose-500/60 text-rose-100'
              : 'bg-slate-900/95 border-sky-500/50 text-sky-100'
          }`}
        >
          {notice.text}
        </div>
      )}
    </div>
  );
}
