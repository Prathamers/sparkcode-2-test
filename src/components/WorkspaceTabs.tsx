// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { Code2, FlaskConical, Globe2, Paintbrush } from 'lucide-react';
import type { SupporterTierId } from '../data/supporters';
import type {
  EngineTelemetry,
  RuntimeValue,
  ScriptStack,
  SparkProject,
  SpriteData,
  StageSettings,
} from '../types/project';
import { BlockWorkspace, type ScriptChangeMeta } from './BlockWorkspace';
import type { DragPayload } from './BlockView';
import { CostumeEditor } from './CostumeEditor';
import { ExperimentalPanel } from './ExperimentalPanel';
import { StageSettingsPanel } from './StageSettingsPanel';

export type WorkspaceTabId = 'code' | 'costumes' | 'stage' | 'experimental';

interface WorkspaceTabsProps {
  activeTab: WorkspaceTabId;
  onChangeTab: (tab: WorkspaceTabId) => void;
  project: SparkProject;
  selectedSprite: SpriteData;
  activeBlockIds: string[];
  activeDrag: DragPayload | null;
  supporterTier: SupporterTierId | null;
  renderBackend?: EngineTelemetry['renderBackend'];
  vmStats?: EngineTelemetry['vmStats'];
  onDragStartBlock: (payload: DragPayload) => void;
  onDragEndBlock: () => void;
  onChangeScripts: (scripts: ScriptStack[], meta?: ScriptChangeMeta) => void;
  onChangeSprite: (next: SpriteData, rebuildTextures?: boolean) => void;
  onChangeStage: (stage: StageSettings) => void;
  onChangeGlobals: (globals: Record<string, RuntimeValue>, watchedGlobals: string[]) => void;
  onOpenSupportUs: () => void;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  activeTab,
  onChangeTab,
  project,
  selectedSprite,
  activeBlockIds,
  activeDrag,
  supporterTier,
  renderBackend,
  vmStats,
  onDragStartBlock,
  onDragEndBlock,
  onChangeScripts,
  onChangeSprite,
  onChangeStage,
  onChangeGlobals,
  onOpenSupportUs,
}) => {
  const hasExperimentalAccess = supporterTier === 'pro' || supporterTier === 'elite';

  const tabs: Array<{ id: WorkspaceTabId; label: string; icon: React.ReactNode }> = [
    { id: 'code', label: 'Code', icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: 'costumes', label: 'Costumes', icon: <Paintbrush className="w-3.5 h-3.5" /> },
    { id: 'stage', label: 'Stage & World', icon: <Globe2 className="w-3.5 h-3.5" /> },
    { id: 'experimental', label: 'Experimental', icon: <FlaskConical className="w-3.5 h-3.5" /> },
  ];

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0D121C]">
      {/* Tab Bar */}
      <div
        role="tablist"
        aria-label="Workspace Views"
        className="h-10 shrink-0 px-3 bg-[#0F1522] border-b border-slate-800/90 flex items-center justify-between gap-4 relative z-30"
      >
        <div className="flex items-center gap-1 p-1 rounded-md bg-[#0B0F17] border border-slate-800/80">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isExperimental = tab.id === 'experimental';
            const isLocked = isExperimental && !hasExperimentalAccess;

            if (isLocked) {
              return (
                <div key={tab.id} className="relative group inline-flex shrink-0">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={false}
                    aria-disabled="true"
                    title="Available to selected members only"
                    onClick={(e) => e.preventDefault()}
                    className="h-7 px-3 rounded inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 text-slate-500 bg-slate-800/35 opacity-50 cursor-not-allowed select-none"
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                  <div
                    role="tooltip"
                    className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-[11px] font-medium text-slate-100 whitespace-nowrap shadow-lg"
                  >
                    Available to selected members only
                  </div>
                </div>
              );
            }

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChangeTab(tab.id)}
                className={`h-7 px-3 rounded inline-flex items-center gap-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? isExperimental
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-sky-600 text-white'
                    : isExperimental
                      ? 'text-amber-300/90 hover:text-amber-200 hover:bg-slate-800/60'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden xl:flex items-center gap-2 text-[11px] text-slate-400 truncate">
          <span>Active Sprite:</span>
          <span className="font-semibold text-slate-200">{selectedSprite.name}</span>
          <span aria-hidden="true">·</span>
          <span>{selectedSprite.costumes.length} costumes</span>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'code' && (
        <BlockWorkspace
          sprite={selectedSprite}
          activeBlockIds={activeBlockIds}
          activeDrag={activeDrag}
          onDragStartBlock={onDragStartBlock}
          onDragEndBlock={onDragEndBlock}
          onChangeScripts={onChangeScripts}
        />
      )}

      {activeTab === 'costumes' && (
        <CostumeEditor
          sprite={selectedSprite}
          onChangeSprite={onChangeSprite}
        />
      )}

      {activeTab === 'stage' && (
        <StageSettingsPanel
          project={project}
          supporterTier={supporterTier}
          renderBackend={renderBackend}
          onChangeStage={onChangeStage}
          onChangeGlobals={onChangeGlobals}
          onOpenExperimentalTab={() => onChangeTab('experimental')}
        />
      )}

      {activeTab === 'experimental' && (
        <ExperimentalPanel
          project={project}
          selectedSprite={selectedSprite}
          supporterTier={supporterTier}
          renderBackend={renderBackend}
          vmStats={vmStats}
          onChangeStage={onChangeStage}
          onChangeSprite={onChangeSprite}
          onOpenSupportUs={onOpenSupportUs}
        />
      )}
    </main>
  );
};
