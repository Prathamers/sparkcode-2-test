import React, { useRef } from 'react';
import { Download, FolderOpen, Home, Play, Square } from 'lucide-react';
import { STARTER_TEMPLATES } from '../data/starterProjects';
import type { EngineRunState } from '../types/project';

interface TopBarProps {
  projectName: string;
  activeTemplateId: string;
  runState: EngineRunState;
  onGoHome: () => void;
  onSelectTemplate: (templateId: string) => void;
  onExportJson: () => void;
  onImportJson: (jsonText: string) => void;
  onRun: () => void;
  onStop: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  activeTemplateId,
  runState,
  onGoHome,
  onSelectTemplate,
  onExportJson,
  onImportJson,
  onRun,
  onStop,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportJson(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="h-12 shrink-0 flex items-center justify-between gap-8 px-4 bg-[#0E1420] border-b border-slate-800/90 select-none">
      {/* Zone 1: Clean single-line brand wordmark + Home return */}
      <div className="flex items-center gap-4 shrink-0">
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
          title="Back to SparkCode 2 Home"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" fill="#0EA5E9" fillOpacity="0.16" stroke="#38BDF8" strokeWidth="1.5" />
            <path d="M13.5 5.5L7.5 13H12L10.5 18.5L16.5 11H12L13.5 5.5Z" fill="#38BDF8" />
          </svg>
          <span className="text-[15px] font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0">
            SparkCode 2
          </span>
        </button>

        <button
          type="button"
          onClick={onGoHome}
          aria-label="Home Screen"
          className="h-7 px-2.5 inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
      </div>

      {/* Zone 2: Starter template selector & project file controls */}
      <div className="flex items-center gap-4 min-w-0">
        <label className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap shrink-0">
          <span>Project</span>
          <select
            aria-label="Starter Project Template"
            value={activeTemplateId}
            onChange={(e) => onSelectTemplate(e.target.value)}
            className="h-8 px-2.5 rounded-md bg-[#161E2E] border border-slate-700/80 text-xs font-medium text-slate-100 focus:outline-none focus:border-sky-400 cursor-pointer"
          >
            {STARTER_TEMPLATES.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
            {!STARTER_TEMPLATES.some((t) => t.id === activeTemplateId) && (
              <option value={activeTemplateId}>{projectName}</option>
            )}
          </select>
        </label>

        <div className="h-4 w-px bg-slate-800 shrink-0" aria-hidden="true" />

        <button
          type="button"
          onClick={onExportJson}
          className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save JSON</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Load JSON</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Import Project JSON File"
        />
      </div>

      {/* Zone 3: Single Primary Action */}
      <div className="flex items-center shrink-0">
        {runState === 'running' ? (
          <button
            type="button"
            onClick={onStop}
            className="h-8 px-4 inline-flex items-center gap-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop Project</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onRun}
            className="h-8 px-4 inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Project</span>
          </button>
        )}
      </div>
    </header>
  );
};
