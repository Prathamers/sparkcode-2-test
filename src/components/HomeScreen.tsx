// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useMemo, useRef, useState } from 'react';
import { FolderOpen, Play, Plus } from 'lucide-react';
import { STARTER_TEMPLATES } from '../data/starterProjects';
import type { EliteSupporter } from '../data/supporters';
import type { SparkProject } from '../types/project';
import type { ThemeMode } from './ThemeToggleButton';
import { HeroEnginePreview } from './home/HeroEnginePreview';
import {
  CapabilitiesSection,
  OpenSourceSection,
  ProgressiveWorkflowSection,
  SupportersSection,
  TemplatesSection,
  type StarterCardSummary,
} from './home/HomeSections';
import { SiteFooter, SiteHeader } from './shared/SiteChrome';

interface HomeScreenProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  eliteSupporters: EliteSupporter[];
  onLaunchStudio: () => void;
  onOpenStudio: (templateId?: string) => void;
  onCreateBlankProject: () => void;
  onImportJson: (jsonText: string) => void;
  onOpenSupportUs: () => void;
  onOpenTerms: () => void;
}

const HERO_METRICS = [
  { value: '0 deps', label: 'Zero external VM, rendering, or physics libraries' },
  { value: '60 FPS', label: 'Decoupled native HTML5 Canvas loop & solver' },
  { value: '42+', label: 'Physics, shader, particle, dict & function blocks' },
  { value: '100%', label: 'Open-source local execution with portable JSON' },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  theme,
  onToggleTheme,
  eliteSupporters,
  onLaunchStudio,
  onOpenStudio,
  onCreateBlankProject,
  onImportJson,
  onOpenSupportUs,
  onOpenTerms,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<string>(STARTER_TEMPLATES[0].id);
  const [complexityTab, setComplexityTab] = useState<'simple' | 'advanced'>('simple');

  const starterCards: StarterCardSummary[] = useMemo(
    () =>
      STARTER_TEMPLATES.map((tpl) => {
        const built: SparkProject = tpl.build();
        return {
          meta: tpl,
          spriteCount: built.sprites.length,
          scriptCount: built.sprites.reduce((sum, sp) => sum + sp.scripts.length, 0),
          hasLighting: built.stage.ambientDarkness > 0.2,
          hasPhysics: built.sprites.some((sp) => sp.physics.enabled),
          leadSprites: built.sprites.slice(0, 4).map((sp) => ({
            id: sp.id,
            name: sp.name,
            thumb: sp.costumes[sp.activeCostumeIndex]?.previewUrl ?? '',
          })),
        };
      }),
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onImportJson(reader.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      data-testid="home-screen"
      className="h-screen w-screen overflow-y-auto bg-[#0B0F17] text-slate-100"
    >
      <SiteHeader
        theme={theme}
        onToggleTheme={onToggleTheme}
        brandHref="#top"
        navLabel="Homepage sections"
        onOpenStudio={onLaunchStudio}
        navLinks={
          <>
            <a href="#progressive" className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              Simplicity
            </a>
            <a href="#capabilities" className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              Engine
            </a>
            <a href="#templates" className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              Templates
            </a>
            <a href="#open-source" className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              Open Source
            </a>
            <button
              type="button"
              onClick={onOpenSupportUs}
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Support Us
            </button>
          </>
        }
      />

      <main id="top" className="max-w-[1240px] mx-auto px-6">
        <section className="pt-12 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div>
                <p className="text-xs font-medium text-slate-400 tracking-wide">
                  100% Open Source · Zero Dependencies · Browser-Native Canvas
                </p>

                <h1
                  style={{ fontSize: 'clamp(2.25rem, 3.8vw, 3.35rem)', textWrap: 'balance' }}
                  className="mt-4 font-bold tracking-tight leading-[1.08] text-slate-50"
                >
                  Build games visually with raw engine speed.
                </h1>

                <p className="mt-5 text-[16px] leading-[1.6] text-slate-300 max-w-[56ch]">
                  SparkCode 2 pairs snap-together programming blocks with a custom 60 FPS HTML5
                  Canvas renderer, rigid-body physics solver, dynamic 2D lighting, and a
                  multi-layer costume editor. Simple to start immediately, with return functions,
                  dictionaries, and raycasting ready when you need them.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onLaunchStudio}
                    className="h-11 px-6 inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Launch Studio</span>
                  </button>

                  <button
                    type="button"
                    onClick={onCreateBlankProject}
                    className="h-11 px-5 inline-flex items-center gap-2 rounded-md bg-[#131A29] hover:bg-[#1B2438] border border-slate-700/80 text-sm font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Blank Project</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-11 px-4 inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Load JSON</span>
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

              <div className="mt-10 pt-5 border-t border-slate-800/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
                <span>No Scratch VM</span>
                <span aria-hidden="true">·</span>
                <span>No Blockly</span>
                <span aria-hidden="true">·</span>
                <span>No PixiJS or Matter.js</span>
                <span aria-hidden="true">·</span>
                <span>Runs offline in your browser</span>
              </div>
            </div>

            <HeroEnginePreview
              previewTemplateId={previewTemplateId}
              onChangeTemplateId={setPreviewTemplateId}
              onOpenStudio={onOpenStudio}
            />
          </div>

          <div className="mt-10 pt-8 border-t border-slate-800/90 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {HERO_METRICS.map((m) => (
              <div key={m.value}>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-50">{m.value}</div>
                <div className="mt-1 text-xs text-slate-400">{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        <ProgressiveWorkflowSection
          complexityTab={complexityTab}
          onChangeTab={setComplexityTab}
          onTryInStudio={() => onOpenStudio(previewTemplateId)}
        />
        <CapabilitiesSection />
        <TemplatesSection
          starterCards={starterCards}
          onCreateBlankProject={onCreateBlankProject}
          onOpenStudio={(id) => onOpenStudio(id)}
        />
        <OpenSourceSection />
        <SupportersSection eliteSupporters={eliteSupporters} onOpenSupportUs={onOpenSupportUs} />

        <SiteFooter subtitle="Open-source visual block IDE &amp; native 2D engine">
          <a href="#capabilities" className="hover:text-slate-200 transition-colors">
            Capabilities
          </a>
          <a href="#templates" className="hover:text-slate-200 transition-colors">
            Templates
          </a>
          <button
            type="button"
            onClick={onOpenSupportUs}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            Support Us
          </button>
          <button
            type="button"
            onClick={onOpenTerms}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            Terms &amp; Conditions
          </button>
          <button
            type="button"
            onClick={onLaunchStudio}
            className="font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
          >
            Launch Studio
          </button>
        </SiteFooter>
      </main>
    </div>
  );
};
