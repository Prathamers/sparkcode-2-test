// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, FolderOpen, Layers, Play } from 'lucide-react';
import { STUDIO_LAUNCH_TEMPLATES } from '../data/starterProjects';
import type { SparkProject } from '../types/project';

interface TemplateSelectorScreenProps {
  initialTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
  onImportJson: (jsonText: string) => void;
  onGoHome: () => void;
  onOpenSupportUs: () => void;
}

export const TemplateSelectorScreen: React.FC<TemplateSelectorScreenProps> = ({
  initialTemplateId,
  onSelectTemplate,
  onImportJson,
  onGoHome,
  onOpenSupportUs,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultId = STUDIO_LAUNCH_TEMPLATES.some((t) => t.id === initialTemplateId)
    ? initialTemplateId!
    : STUDIO_LAUNCH_TEMPLATES[0].id;
  const [selectedId, setSelectedId] = useState<string>(defaultId);

  const templateCards = useMemo(
    () =>
      STUDIO_LAUNCH_TEMPLATES.map((tpl) => {
        const built: SparkProject = tpl.build();
        const leadSprites = built.sprites.slice(0, 4).map((sp) => ({
          id: sp.id,
          name: sp.name,
          thumb: sp.costumes[sp.activeCostumeIndex]?.previewUrl ?? '',
        }));
        const totalScripts = built.sprites.reduce((sum, sp) => sum + sp.scripts.length, 0);
        const hasLighting = built.stage.ambientDarkness > 0.25;
        const hasPhysics = built.sprites.some((sp) => sp.physics.enabled);
        return {
          meta: tpl,
          spriteCount: built.sprites.length,
          scriptCount: totalScripts,
          hasLighting,
          hasPhysics,
          leadSprites,
        };
      }),
    []
  );

  const starterCards = templateCards.filter((c) => c.meta.group === 'starter');
  const showcaseCards = templateCards.filter((c) => c.meta.group !== 'starter');
  const activeMeta =
    STUDIO_LAUNCH_TEMPLATES.find((t) => t.id === selectedId) ?? STUDIO_LAUNCH_TEMPLATES[0];

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
    <div
      data-testid="template-selector-screen"
      className="h-screen w-screen overflow-y-auto bg-[#0B0F17] text-slate-100"
    >
      {/* Top Navigation Bar — 3-Zone Contract */}
      <header className="sticky top-0 z-40 h-14 bg-[#0B0F17]/95 backdrop-blur-sm border-b border-slate-800/80">
        <div className="max-w-[1240px] h-full mx-auto px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single clean wordmark */}
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2.5 text-slate-100 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect
                x="2"
                y="2"
                width="20"
                height="20"
                rx="5"
                fill="#0EA5E9"
                fillOpacity="0.16"
                stroke="#38BDF8"
                strokeWidth="1.5"
              />
              <path d="M13.5 5.5L7.5 13H12L10.5 18.5L16.5 11H12L13.5 5.5Z" fill="#38BDF8" />
            </svg>
            <span className="text-[16px] font-bold tracking-tight whitespace-nowrap shrink-0">
              SparkCode 2
            </span>
          </button>

          {/* Zone 2: Clean single-line text nav links */}
          <nav
            aria-label="Template selector navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400"
          >
            <button
              type="button"
              onClick={onGoHome}
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Home
            </button>
            <a
              href="#quick-start"
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Start Fresh
            </a>
            <a
              href="#showcases"
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Showcases
            </a>
            <button
              type="button"
              onClick={onOpenSupportUs}
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Support Us
            </button>
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onSelectTemplate(activeMeta.id)}
              className="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch {activeMeta.name}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1240px] mx-auto px-6">
        {/* HEADER SECTION */}
        <section className="pt-10 pb-8">
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>

          <div className="mt-5 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-sky-400">
                New Studio Session · 5 Templates Available
              </p>
              <h1
                style={{ fontSize: 'clamp(2rem, 3.2vw, 2.85rem)', textWrap: 'balance' }}
                className="mt-2.5 font-bold tracking-tight leading-[1.1] text-slate-50"
              >
                Select a template to launch the studio.
              </h1>
              <p className="mt-3 text-[15px] leading-[1.6] text-slate-300 max-w-[58ch]">
                Start from an empty canvas, jump in with a basic keyboard-controlled setup, or
                open a full playable demo to inspect physics, particles, and 2D lighting.
              </p>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 px-4 inline-flex items-center gap-2 rounded-md bg-[#131A29] hover:bg-[#1B2438] border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Load .spark2.json Project</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Import SparkCode JSON Project"
              />
            </div>
          </div>
        </section>

        {/* ROW 1: START FRESH (EMPTY & BASIC) */}
        <section id="quick-start" className="pb-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Start Fresh</h2>
            <span className="text-xs text-slate-400">Clean templates for new games</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {starterCards.map((item) => {
              const isSelected = selectedId === item.meta.id;
              const isEmpty = item.meta.id === 'tpl_empty';
              return (
                <div
                  key={item.meta.id}
                  data-testid={`launch-template-${item.meta.id}`}
                  onClick={() => setSelectedId(item.meta.id)}
                  onDoubleClick={() => onSelectTemplate(item.meta.id)}
                  className={`rounded-xl border p-5 flex flex-col justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-sky-500/80 bg-[#11192A]'
                      : 'border-slate-800/90 bg-[#0F1522] hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Visual Preview Strip */}
                    <div className="h-24 rounded-lg bg-[#090E18] border border-slate-800/80 spark-grid-bg px-4 flex items-center justify-center gap-5">
                      {isEmpty ? (
                        <div className="flex flex-col items-center gap-1.5 text-slate-500">
                          <div className="w-9 h-9 rounded-md border border-dashed border-slate-700 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-slate-500" />
                          </div>
                          <span className="text-[11px] font-mono">0 blocks · blank canvas</span>
                        </div>
                      ) : (
                        item.leadSprites.map((sp) =>
                          sp.thumb ? (
                            <img
                              key={sp.id}
                              src={sp.thumb}
                              alt={sp.name}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 object-contain"
                            />
                          ) : (
                            <div
                              key={sp.id}
                              className="w-11 h-11 rounded bg-slate-800 flex items-center justify-center"
                            >
                              <Layers className="w-4 h-4 text-slate-400" />
                            </div>
                          )
                        )
                      )}
                    </div>

                    <div className="mt-4 flex items-baseline justify-between gap-2">
                      <h3 className="text-lg font-semibold text-slate-50">{item.meta.name}</h3>
                      <span className="text-xs font-mono tabular-nums text-slate-400">
                        {item.spriteCount} {item.spriteCount === 1 ? 'sprite' : 'sprites'} ·{' '}
                        {item.scriptCount} {item.scriptCount === 1 ? 'script' : 'scripts'}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      {item.meta.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(item.meta.id);
                    }}
                    className={`mt-5 w-full h-10 px-4 rounded-md text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 hover:bg-sky-500 text-white'
                        : 'bg-slate-800 hover:bg-sky-600 text-slate-100'
                    }`}
                  >
                    <span>Open {item.meta.name} Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ROW 2: PLAYABLE ENGINE SHOWCASES */}
        <section id="showcases" className="pb-14 pt-6 border-t border-slate-800/80">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Playable Engine Showcases</h2>
            <span className="text-xs text-slate-400">
              Complete projects ready to run and remix
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {showcaseCards.map((item) => {
              const isSelected = selectedId === item.meta.id;
              return (
                <div
                  key={item.meta.id}
                  data-testid={`launch-template-${item.meta.id}`}
                  onClick={() => setSelectedId(item.meta.id)}
                  onDoubleClick={() => onSelectTemplate(item.meta.id)}
                  className={`rounded-xl border p-5 flex flex-col justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-sky-500/80 bg-[#11192A]'
                      : 'border-slate-800/90 bg-[#0F1522] hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="h-24 rounded-lg bg-[#090E18] border border-slate-800/80 px-4 flex items-center justify-center gap-4">
                      {item.leadSprites.map((sp) =>
                        sp.thumb ? (
                          <img
                            key={sp.id}
                            src={sp.thumb}
                            alt={sp.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-contain"
                          />
                        ) : (
                          <div
                            key={sp.id}
                            className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center"
                          >
                            <Layers className="w-4 h-4 text-slate-400" />
                          </div>
                        )
                      )}
                    </div>

                    <h3 className="mt-4 text-base font-semibold text-slate-100">
                      {item.meta.name}
                    </h3>
                    <div className="mt-1 text-xs text-slate-400 font-mono tabular-nums">
                      {item.spriteCount} sprites · {item.scriptCount} scripts
                      {item.hasPhysics ? ' · Physics' : ''}
                      {item.hasLighting ? ' · 2D Lighting' : ''}
                    </div>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                      {item.meta.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(item.meta.id);
                    }}
                    className={`mt-5 w-full h-10 px-4 rounded-md text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 hover:bg-sky-500 text-white'
                        : 'bg-slate-800 hover:bg-sky-600 text-slate-100'
                    }`}
                  >
                    <span>Open Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
