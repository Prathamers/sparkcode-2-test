// SPDX-License-Identifier: AGPL-3.0-or-later
import { useCallback, useState } from 'react';
import type { AssetLibraryMode } from './components/AssetLibraryPanel';
import { BlockPalette } from './components/BlockPalette';
import type { DragPayload } from './components/BlockView';
import { HomeScreen } from './components/HomeScreen';
import { SpriteInspector } from './components/SpriteInspector';
import { StageViewport } from './components/StageViewport';
import { SupportUsPage } from './components/SupportUsPage';
import { TemplateSelectorScreen } from './components/TemplateSelectorScreen';
import { TermsPage } from './components/TermsPage';
import { TopBar } from './components/TopBar';
import { WorkspaceTabs, type WorkspaceTabId } from './components/WorkspaceTabs';
import { NoticeToast, type NoticeState } from './components/shared/NoticeToast';
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
import { normalizeWebGL2Config } from './engine/webgl2Pipeline';
import { useStudioProject } from './hooks/useStudioProject';
import { useThemeMode } from './hooks/useThemeMode';

type AppView = 'home' | 'select-template' | 'studio' | 'support' | 'terms';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('code');
  const [assetLibraryMode, setAssetLibraryMode] = useState<AssetLibraryMode>('sprites');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDrag, setActiveDrag] = useState<DragPayload | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [supporterProfile, setSupporterProfile] = useState<LocalSupporterProfile | null>(() =>
    loadSupporterProfile()
  );
  const [eliteSupporters, setEliteSupporters] = useState<EliteSupporter[]>(() =>
    loadEliteSupporters()
  );
  const [roadmapVotes, setRoadmapVotes] = useState<string[]>(() => loadRoadmapVotes());
  const { theme, toggleTheme } = useThemeMode();

  const showNotice = useCallback((kind: 'info' | 'error', text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => {
      setNotice((curr) => (curr?.text === text ? null : curr));
    }, 3200);
  }, []);

  const openStudioView = useCallback(() => setView('studio'), []);

  const studio = useStudioProject({
    isStudioView: view === 'studio',
    supporterTier: supporterProfile?.tier ?? null,
    setActiveTab,
    openStudioView,
    showNotice,
  });

  const handleOpenAssetLibrary = useCallback((mode: AssetLibraryMode) => {
    setAssetLibraryMode(mode);
    setActiveTab('assets');
  }, []);

  const handleActivateSupport = useCallback(
    (profile: LocalSupporterProfile) => {
      setSupporterProfile(profile);
      saveSupporterProfile(profile);
      if (profile.tier === 'elite') {
        setEliteSupporters(addEliteSupporter(profile.displayName, 'Elite Member'));
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
          theme={theme}
          onToggleTheme={toggleTheme}
          eliteSupporters={eliteSupporters}
          onLaunchStudio={() => setView('select-template')}
          onOpenStudio={studio.handleOpenStudio}
          onCreateBlankProject={studio.handleCreateBlankProject}
          onImportJson={studio.handleImportJson}
          onOpenSupportUs={() => setView('support')}
          onOpenTerms={() => setView('terms')}
        />
        <NoticeToast notice={notice} />
      </>
    );
  }

  if (view === 'select-template') {
    return (
      <>
        <TemplateSelectorScreen
          theme={theme}
          onToggleTheme={toggleTheme}
          initialTemplateId={studio.project.id}
          onSelectTemplate={(templateId) => studio.handleOpenStudio(templateId)}
          onImportJson={studio.handleImportJson}
          onGoHome={() => setView('home')}
          onOpenSupportUs={() => setView('support')}
          onOpenTerms={() => setView('terms')}
        />
        <NoticeToast notice={notice} />
      </>
    );
  }

  if (view === 'support') {
    return (
      <>
        <SupportUsPage
          theme={theme}
          onToggleTheme={toggleTheme}
          activeProfile={supporterProfile}
          eliteSupporters={eliteSupporters}
          roadmapVotes={roadmapVotes}
          onActivateSupport={handleActivateSupport}
          onCancelSupport={handleCancelSupport}
          onToggleRoadmapVote={handleToggleRoadmapVote}
          onGoHome={() => setView('home')}
          onOpenStudio={() => setView('select-template')}
          onOpenTerms={() => setView('terms')}
        />
        <NoticeToast notice={notice} />
      </>
    );
  }

  if (view === 'terms') {
    return (
      <TermsPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onGoHome={() => setView('home')}
        onOpenStudio={() => setView('select-template')}
        onOpenSupportUs={() => setView('support')}
      />
    );
  }

  const {
    project,
    selectedSpriteId,
    setSelectedSpriteId,
    selectedSprite,
    engine,
    telemetry,
    historySnap,
  } = studio;

  return (
    <div
      className="h-screen w-screen flex flex-col bg-[#0B0F17] text-slate-100 overflow-hidden"
      data-run-state={telemetry.runState}
    >
      <TopBar
        theme={theme}
        onToggleTheme={toggleTheme}
        projectName={project.name}
        activeTemplateId={project.id}
        runState={telemetry.runState}
        canUndo={historySnap.canUndo}
        canRedo={historySnap.canRedo}
        undoLabel={historySnap.undoLabel}
        redoLabel={historySnap.redoLabel}
        onUndo={studio.handleUndo}
        onRedo={studio.handleRedo}
        onGoHome={() => {
          engine.stop();
          setView('home');
        }}
        onSelectTemplate={studio.handleSelectTemplate}
        onExportJson={studio.handleExportJson}
        onImportJson={studio.handleImportJson}
        onRun={() => engine.run()}
        onStop={() => engine.stop()}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <BlockPalette
          onQuickAddBlock={studio.handleQuickAddBlock}
          onCreateCustomFunction={studio.handleCreateCustomFunction}
          onDragStartBlock={setActiveDrag}
          onDragEndBlock={() => setActiveDrag(null)}
        />

        {selectedSprite && (
          <WorkspaceTabs
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            assetLibraryMode={assetLibraryMode}
            onChangeAssetLibraryMode={setAssetLibraryMode}
            onOpenAssetLibrary={handleOpenAssetLibrary}
            project={project}
            selectedSprite={selectedSprite}
            activeBlockIds={telemetry.activeBlockIds}
            activeDrag={activeDrag}
            supporterTier={supporterProfile?.tier ?? null}
            renderBackend={telemetry.renderBackend}
            vmStats={telemetry.vmStats}
            onDragStartBlock={setActiveDrag}
            onDragEndBlock={() => setActiveDrag(null)}
            onChangeScripts={studio.handleChangeScripts}
            onChangeSprite={studio.handleUpdateSprite}
            onChangeStage={studio.handleChangeStage}
            onChangeGlobals={studio.handleChangeGlobals}
            onAddSpriteFromLibrary={studio.handleAddSpriteFromLibrary}
            onAddCostumeFromLibrary={studio.handleAddCostumeFromLibrary}
            onApplyBackdropFromLibrary={studio.handleApplyBackdropFromLibrary}
            onOpenSupportUs={() => {
              engine.stop();
              setView('support');
            }}
          />
        )}

        <aside className="w-[392px] shrink-0 flex flex-col h-full border-l border-slate-800/90 bg-[#101623] overflow-hidden">
          <StageViewport
            engine={engine}
            telemetry={telemetry}
            watchedGlobals={project.watchedGlobals}
            renderBackendMode={normalizeWebGL2Config(project.stage.webgl2).backend}
            isElite={supporterProfile?.tier === 'elite'}
            onToggleRenderBackend={studio.handleToggleRenderBackend}
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
            onUpdateSprite={(sp) => studio.handleUpdateSprite(sp, false)}
            onAddSprite={studio.handleAddSprite}
            onOpenSpriteLibrary={() => handleOpenAssetLibrary('sprites')}
            onDuplicateSprite={studio.handleDuplicateSprite}
            onDeleteSprite={studio.handleDeleteSprite}
          />
        </aside>
      </div>

      <NoticeToast notice={notice} />
    </div>
  );
}
