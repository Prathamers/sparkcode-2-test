import React from 'react';
import { Code2, Globe2, Paintbrush } from 'lucide-react';
import type { RuntimeValue, ScriptStack, SparkProject, SpriteData, StageSettings } from '../types/project';
import { BlockWorkspace, type ScriptChangeMeta } from './BlockWorkspace';
import type { DragPayload } from './BlockView';
import { CostumeEditor } from './CostumeEditor';
import { StageSettingsPanel } from './StageSettingsPanel';

export type WorkspaceTabId = 'code' | 'costumes' | 'stage';

interface WorkspaceTabsProps {
  activeTab: WorkspaceTabId;
  onChangeTab: (tab: WorkspaceTabId) => void;
  project: SparkProject;
  selectedSprite: SpriteData;
  activeBlockIds: string[];
  activeDrag: DragPayload | null;
  onDragStartBlock: (payload: DragPayload) => void;
  onDragEndBlock: () => void;
  onChangeScripts: (scripts: ScriptStack[], meta?: ScriptChangeMeta) => void;
  onChangeSprite: (next: SpriteData, rebuildTextures?: boolean) => void;
  onChangeStage: (stage: StageSettings) => void;
  onChangeGlobals: (globals: Record<string, RuntimeValue>, watchedGlobals: string[]) => void;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  activeTab,
  onChangeTab,
  project,
  selectedSprite,
  activeBlockIds,
  activeDrag,
  onDragStartBlock,
  onDragEndBlock,
  onChangeScripts,
  onChangeSprite,
  onChangeStage,
  onChangeGlobals,
}) => {
  const tabs: Array<{ id: WorkspaceTabId; label: string; icon: React.ReactNode }> = [
    { id: 'code', label: 'Code', icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: 'costumes', label: 'Costumes', icon: <Paintbrush className="w-3.5 h-3.5" /> },
    { id: 'stage', label: 'Stage & World', icon: <Globe2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0D121C]">
      {/* Tab Bar */}
      <div
        role="tablist"
        aria-label="Workspace Views"
        className="h-10 shrink-0 px-3 bg-[#0F1522] border-b border-slate-800/90 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-1 p-1 rounded-md bg-[#0B0F17] border border-slate-800/80">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChangeTab(tab.id)}
                className={`h-7 px-3 rounded inline-flex items-center gap-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white'
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
          onChangeStage={onChangeStage}
          onChangeGlobals={onChangeGlobals}
        />
      )}
    </main>
  );
};
