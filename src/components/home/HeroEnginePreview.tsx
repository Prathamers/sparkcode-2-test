// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { STARTER_TEMPLATES } from '../../data/starterProjects';
import { SparkEngine } from '../../engine/SparkEngine';
import type { EngineTelemetry } from '../../types/project';

interface HeroEnginePreviewProps {
  previewTemplateId: string;
  onChangeTemplateId: (templateId: string) => void;
  onOpenStudio: (templateId?: string) => void;
}

export const HeroEnginePreview: React.FC<HeroEnginePreviewProps> = ({
  previewTemplateId,
  onChangeTemplateId,
  onOpenStudio,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewEngineRef = useRef<SparkEngine | null>(null);
  if (!previewEngineRef.current) {
    previewEngineRef.current = new SparkEngine(STARTER_TEMPLATES[0].build());
  }
  const previewEngine = previewEngineRef.current;
  const [telemetry, setTelemetry] = useState<EngineTelemetry>(() => previewEngine.getTelemetry());

  useEffect(() => {
    const unsubscribe = previewEngine.subscribe((snap) => setTelemetry(snap));
    const canvas = previewCanvasRef.current;
    if (canvas) {
      previewEngine.attachCanvas(canvas);
      previewEngine.run();
    }
    return () => {
      unsubscribe();
      previewEngine.attachCanvas(null);
      previewEngine.dispose();
    };
  }, [previewEngine]);

  const handleSwitchPreviewTemplate = (tplId: string) => {
    const found = STARTER_TEMPLATES.find((t) => t.id === tplId);
    if (!found) return;
    onChangeTemplateId(tplId);
    previewEngine.loadProject(found.build());
    previewEngine.run();
  };

  const activePreviewMeta =
    STARTER_TEMPLATES.find((t) => t.id === previewTemplateId) ?? STARTER_TEMPLATES[0];

  return (
    <div className="lg:col-span-6 flex flex-col">
      <div className="flex-1 flex flex-col rounded-xl border border-slate-800 bg-[#101623] overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-slate-800/90 bg-[#0D131F] flex flex-wrap items-center justify-between gap-2">
          <div
            role="tablist"
            aria-label="Live engine preview templates"
            className="inline-flex items-center gap-1 p-0.5 rounded-md bg-[#090D16] border border-slate-800/80"
          >
            {STARTER_TEMPLATES.map((tpl, idx) => {
              const active = tpl.id === previewTemplateId;
              const shortLabel =
                idx === 0 ? 'Platformer' : idx === 1 ? 'Space Shooter' : 'Lighting';
              return (
                <button
                  key={tpl.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleSwitchPreviewTemplate(tpl.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {shortLabel}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tabular-nums text-slate-400 whitespace-nowrap">
              {telemetry.fps} FPS · {telemetry.drawCalls} draws
            </span>
            <button
              type="button"
              aria-label={telemetry.runState === 'running' ? 'Pause preview' : 'Play preview'}
              onClick={() =>
                telemetry.runState === 'running' ? previewEngine.pause() : previewEngine.run()
              }
              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 inline-flex items-center justify-center cursor-pointer"
            >
              {telemetry.runState === 'running' ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </button>
            <button
              type="button"
              aria-label="Reset preview"
              onClick={() => {
                previewEngine.stop();
                previewEngine.run();
              }}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 inline-flex items-center justify-center cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="spark-preserve-dark relative bg-[#070B12] aspect-[14/9] w-full flex-1">
          <canvas
            ref={previewCanvasRef}
            data-testid="home-preview-canvas"
            onMouseMove={(e) => previewEngine.setMousePositionFromClient(e.clientX, e.clientY)}
            onMouseDown={() => previewEngine.setMouseDown(true)}
            onMouseUp={() => previewEngine.setMouseDown(false)}
            onMouseLeave={() => previewEngine.setMouseDown(false)}
            className="w-full h-full block cursor-crosshair"
          />
        </div>

        <div className="px-4 py-2.5 border-t border-slate-800/90 bg-[#0D131F] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-100 truncate">
              {activePreviewMeta.name}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {activePreviewMeta.description}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenStudio(previewTemplateId)}
            className="px-3 py-1.5 rounded-md bg-sky-600/20 hover:bg-sky-600/35 border border-sky-500/40 text-xs font-medium text-sky-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <span>Edit in Studio</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
