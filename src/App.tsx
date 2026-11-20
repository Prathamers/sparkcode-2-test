import { useCallback, useEffect, useRef, useState } from 'react';
import { BlockPalette } from './components/BlockPalette';
import type { DragPayload } from './components/BlockView';
import { HomeScreen } from './components/HomeScreen';
import { SpriteInspector } from './components/SpriteInspector';
import { StageViewport } from './components/StageViewport';
import { TopBar } from './components/TopBar';
import { WorkspaceTabs, type WorkspaceTabId } from './components/WorkspaceTabs';
import { createBlankSprite, STARTER_TEMPLATES } from './data/starterProjects';
import { BLOCK_DEF_MAP, createBlockNode, createUid, findFreeCanvasPosition } from './engine/blocks';
import { SparkEngine } from './engine/SparkEngine';
import type {
  EngineTelemetry,
  RuntimeValue,
  ScriptStack,
  SparkProject,
  SpriteData,
  StageSettings,
} from './types/project';

export default function App() {
  const [view, setView] = useState<'home' | 'studio'>('home');
  const [project, setProject] = useState<SparkProject>(() => STARTER_TEMPLATES[0].build());
  const [selectedSpriteId, setSelectedSpriteId] = useState<string>(() => project.sprites[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('code');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDrag, setActiveDrag] = useState<DragPayload | null>(null);
  const [notice, setNotice] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

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

  const commitProject = useCallback(
    (updater: (prev: SparkProject) => SparkProject, rebuildTextures = false) => {
      setProject((prev) => {
        const next = updater(prev);
        engine.syncProject(next, rebuildTextures);
        return next;
      });
    },
    [engine]
  );

  const handleOpenStudio = (templateId?: string) => {
    if (templateId && templateId !== project.id) {
      const tpl = STARTER_TEMPLATES.find((t) => t.id === templateId);
      if (tpl) {
        const nextProject = tpl.build();
        setProject(nextProject);
        setSelectedSpriteId(nextProject.sprites[0]?.id ?? '');
        engine.loadProject(nextProject);
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
    setProject(blankProject);
    setSelectedSpriteId(starterSprite.id);
    engine.loadProject(blankProject);
    setActiveTab('code');
    setView('studio');
    showNotice('info', 'Created new blank project');
  };

  const handleSelectTemplate = (templateId: string) => {
    const tpl = STARTER_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const nextProject = tpl.build();
    setProject(nextProject);
    setSelectedSpriteId(nextProject.sprites[0]?.id ?? '');
    engine.loadProject(nextProject);
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
      setProject(parsed);
      setSelectedSpriteId(parsed.sprites[0]?.id ?? '');
      engine.loadProject(parsed);
      setView('studio');
      showNotice('info', `Imported "${parsed.name || 'Custom Project'}"`);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Invalid JSON file');
    }
  };

  const handleUpdateSprite = useCallback(
    (nextSprite: SpriteData, rebuildTextures = false) => {
      commitProject(
        (prev) => ({
          ...prev,
          sprites: prev.sprites.map((sp) => (sp.id === nextSprite.id ? nextSprite : sp)),
        }),
        rebuildTextures
      );
    },
    [commitProject]
  );

  const handleChangeScripts = useCallback(
    (scripts: ScriptStack[]) => {
      if (!selectedSprite) return;
      handleUpdateSprite({ ...selectedSprite, scripts }, false);
    },
    [selectedSprite, handleUpdateSprite]
  );

  const handleQuickAddBlock = useCallback(
    (opcode: string) => {
      if (!selectedSprite) return;
      const def = BLOCK_DEF_MAP[opcode];
      if (!def) return;
      setActiveTab('code');

      const node = createBlockNode(opcode);
      const currentScripts = selectedSprite.scripts;

      if (def.shape === 'hat' || def.shape === 'reporter' || def.shape === 'boolean' || currentScripts.length === 0) {
        const draft: ScriptStack = {
          id: createUid('stack'),
          x: 20,
          y: 20,
          blocks: [node],
        };
        const pos = findFreeCanvasPosition(currentScripts, draft);
        handleChangeScripts([...currentScripts, { ...draft, x: pos.x, y: pos.y }]);
        return;
      }

      // Append statement/C-block to the first script stack
      const updated = currentScripts.map((st, idx) =>
        idx === 0 ? { ...st, blocks: [...st.blocks, node] } : st
      );
      handleChangeScripts(updated);
    },
    [selectedSprite, handleChangeScripts]
  );

  const handleCreateCustomFunction = useCallback(
    (name: string, param1: string, param2: string) => {
      if (!selectedSprite) return;
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
      const pos = findFreeCanvasPosition(selectedSprite.scripts, draft);
      const newStack: ScriptStack = { ...draft, x: pos.x, y: pos.y };
      handleUpdateSprite(
        {
          ...selectedSprite,
          functions: [
            ...selectedSprite.functions,
            {
              id: createUid('fn'),
              name,
              params: [param1, param2]
                .filter(Boolean)
                .map((p) => ({ name: p, type: 'number' as const })),
              returnsValue: true,
            },
          ],
          scripts: [...selectedSprite.scripts, newStack],
        },
        false
      );
      showNotice('info', `Created custom function "${name}"`);
    },
    [selectedSprite, handleUpdateSprite, showNotice]
  );

  const handleAddSprite = () => {
    const newSp = createBlankSprite(project.sprites.length + 1);
    commitProject(
      (prev) => ({
        ...prev,
        sprites: [...prev.sprites, newSp],
      }),
      true
    );
    setSelectedSpriteId(newSp.id);
  };

  const handleDuplicateSprite = (id: string) => {
    const src = project.sprites.find((s) => s.id === id);
    if (!src) return;
    const copy: SpriteData = {
      ...structuredClone(src),
      id: createUid('sp'),
      name: `${src.name} Copy`,
      x: src.x + 28,
      y: src.y + 18,
    };
    commitProject(
      (prev) => ({
        ...prev,
        sprites: [...prev.sprites, copy],
      }),
      true
    );
    setSelectedSpriteId(copy.id);
  };

  const handleDeleteSprite = (id: string) => {
    if (project.sprites.length <= 1) return;
    const remaining = project.sprites.filter((s) => s.id !== id);
    commitProject(
      (prev) => ({
        ...prev,
        sprites: remaining,
      }),
      true
    );
    if (selectedSpriteId === id) {
      setSelectedSpriteId(remaining[0].id);
    }
  };

  const handleChangeStage = (stage: StageSettings) => {
    commitProject((prev) => ({ ...prev, stage }), false);
  };

  const handleChangeGlobals = (
    globals: Record<string, RuntimeValue>,
    watchedGlobals: string[]
  ) => {
    commitProject((prev) => ({ ...prev, globals, watchedGlobals }), false);
  };

  if (view === 'home') {
    return (
      <>
        <HomeScreen
          onOpenStudio={handleOpenStudio}
          onCreateBlankProject={handleCreateBlankProject}
          onImportJson={handleImportJson}
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
