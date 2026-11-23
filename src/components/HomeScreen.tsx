// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  FolderOpen,
  Layers,
  Pause,
  Play,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { STARTER_TEMPLATES } from '../data/starterProjects';
import type { EliteSupporter } from '../data/supporters';
import { CATEGORY_MAP } from '../engine/blocks';
import { SparkEngine } from '../engine/SparkEngine';
import type { EngineTelemetry, SparkProject } from '../types/project';
import { ThemeToggleButton, type ThemeMode } from './ThemeToggleButton';

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

interface PreviewSnippetBlock {
  category: keyof typeof CATEGORY_MAP;
  shape: 'hat' | 'stack' | 'c-block';
  text: string;
  indent?: number;
}

const SIMPLE_MODE_BLOCKS: PreviewSnippetBlock[] = [
  { category: 'events', shape: 'hat', text: 'when green flag clicked' },
  { category: 'looks', shape: 'stack', text: 'say [Ready to jump!] for [2] s' },
  { category: 'control', shape: 'c-block', text: 'forever' },
  { category: 'motion', shape: 'stack', text: 'move [10] steps', indent: 1 },
  { category: 'motion', shape: 'stack', text: 'turn [15] deg', indent: 1 },
];

const ADVANCED_MODE_BLOCKS: PreviewSnippetBlock[] = [
  { category: 'functions', shape: 'hat', text: 'define fn calcBonus ( base , mult )' },
  { category: 'data', shape: 'stack', text: 'let [total] = ( var [base] * var [mult] )' },
  { category: 'functions', shape: 'stack', text: 'return ( var [total] )' },
  { category: 'events', shape: 'hat', text: 'when I receive [core_collected]' },
  { category: 'data', shape: 'stack', text: 'dict [stats][cores] = ( dict [stats][cores] + 1 )' },
  { category: 'camera', shape: 'stack', text: 'shake camera power [7] for [0.2] s' },
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
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [previewTemplateId, setPreviewTemplateId] = useState<string>(STARTER_TEMPLATES[0].id);
  const [complexityTab, setComplexityTab] = useState<'simple' | 'advanced'>('simple');

  // Pre-build starter metadata & real procedural sprite thumbnails once
  const starterCards = useMemo(
    () =>
      STARTER_TEMPLATES.map((tpl) => {
        const built: SparkProject = tpl.build();
        const leadSprites = built.sprites.slice(0, 4).map((sp) => ({
          id: sp.id,
          name: sp.name,
          thumb: sp.costumes[sp.activeCostumeIndex]?.previewUrl ?? '',
        }));
        const totalScripts = built.sprites.reduce((sum, sp) => sum + sp.scripts.length, 0);
        const hasLighting = built.stage.ambientDarkness > 0.2;
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

  // Dedicated self-contained SparkEngine instance for the Hero live preview stage
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
    setPreviewTemplateId(tplId);
    previewEngine.loadProject(found.build());
    previewEngine.run();
  };

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

  const activePreviewMeta =
    STARTER_TEMPLATES.find((t) => t.id === previewTemplateId) ?? STARTER_TEMPLATES[0];

  return (
    <div
      data-testid="home-screen"
      className="h-screen w-screen overflow-y-auto bg-[#0B0F17] text-slate-100"
    >
      {/* Top Navigation Bar — 3-Zone Contract */}
      <header className="sticky top-0 z-40 h-14 bg-[#0B0F17]/95 backdrop-blur-sm border-b border-slate-800/80">
        <div className="max-w-[1240px] h-full mx-auto px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single clean wordmark */}
          <a
            href="#top"
            className="flex items-center gap-2.5 text-slate-100 whitespace-nowrap shrink-0"
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
          </a>

          {/* Zone 2: 4 concise single-line text navigation links */}
          <nav
            aria-label="Homepage sections"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400"
          >
            <a
              href="#progressive"
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Simplicity
            </a>
            <a
              href="#capabilities"
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Engine
            </a>
            <a
              href="#templates"
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Templates
            </a>
            <a
              href="#open-source"
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Open Source
            </a>
            <button
              type="button"
              onClick={onOpenSupportUs}
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Support Us
            </button>
          </nav>

          {/* Zone 3: Theme Toggle & Primary CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggleButton theme={theme} onToggleTheme={onToggleTheme} />
            <button
              type="button"
              onClick={onLaunchStudio}
              className="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="max-w-[1240px] mx-auto px-6">
        {/* HERO SECTION */}
        <section className="pt-12 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Proposition */}
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

            {/* Right Live Native Engine Preview */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="flex-1 flex flex-col rounded-xl border border-slate-800 bg-[#101623] overflow-hidden">
                {/* Preview Switcher Strip */}
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
                            active
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-400 hover:text-slate-200'
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
                        telemetry.runState === 'running'
                          ? previewEngine.pause()
                          : previewEngine.run()
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

                {/* Real 60 FPS Stage Canvas */}
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

                {/* Preview Footer Action */}
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
          </div>

          {/* 4-Column Full-Width Architecture Metrics Strip */}
          <div className="mt-10 pt-8 border-t border-slate-800/90 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-50">0 deps</div>
              <div className="mt-1 text-xs text-slate-400">
                Zero external VM, rendering, or physics libraries
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-50">60 FPS</div>
              <div className="mt-1 text-xs text-slate-400">
                Decoupled native HTML5 Canvas loop & solver
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-50">42+</div>
              <div className="mt-1 text-xs text-slate-400">
                Physics, shader, particle, dict & function blocks
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-50">100%</div>
              <div className="mt-1 text-xs text-slate-400">
                Open-source local execution with portable JSON
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: SIMPLE BY DEFAULT, ADVANCED WHEN NEEDED */}
        <section id="progressive" className="py-14 border-t border-slate-800/80">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-medium text-sky-400">Progressive Design</p>
              <h2
                style={{ textWrap: 'balance' }}
                className="mt-2 text-2xl lg:text-3xl font-bold tracking-tight text-slate-50"
              >
                Simple by default. Advanced when your game demands it.
              </h2>
            </div>

            {/* Working Mode Comparison Toggle */}
            <div
              role="tablist"
              aria-label="Compare Simple and Advanced workflows"
              className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#101623] border border-slate-800 shrink-0 self-start"
            >
              <button
                type="button"
                role="tab"
                aria-selected={complexityTab === 'simple'}
                onClick={() => setComplexityTab('simple')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  complexityTab === 'simple'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                Simple by Default
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={complexityTab === 'advanced'}
                onClick={() => setComplexityTab('advanced')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  complexityTab === 'advanced'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                Advanced When Needed
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Explanation */}
            <div className="lg:col-span-5 rounded-xl border border-slate-800/90 bg-[#0F1522] p-6 flex flex-col justify-between">
              {complexityTab === 'simple' ? (
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Start building in under 30 seconds
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                    Open a starter world or drag motion and event blocks onto the dot-grid canvas.
                    Magnetic notches snap whole stacks together cleanly so beginners focus on game
                    ideas instead of syntax errors.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-300 border-t border-slate-800/80 pt-5">
                    <li>
                      <span className="font-semibold text-slate-100">Single-click block add:</span>{' '}
                      Click any palette item to append it straight into your active script.
                    </li>
                    <li>
                      <span className="font-semibold text-slate-100">Visual sprite art:</span>{' '}
                      Draw pixels, fill regions, or generate mirrored ships without leaving the IDE.
                    </li>
                    <li>
                      <span className="font-semibold text-slate-100">Instant stage playback:</span>{' '}
                      Press Run to test physics and collisions immediately at 60 FPS.
                    </li>
                  </ul>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Full game-engineering primitives on demand
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                    When prototypes grow into full games, reach directly for scoped memory, typed
                    return functions, real-time 2D raycasting, shader passes, and frame-stepped
                    debugging in the same workspace.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-300 border-t border-slate-800/80 pt-5">
                    <li>
                      <span className="font-semibold text-slate-100">Return functions & dicts:</span>{' '}
                      Nest custom function reporters and JSON-style key-value dictionaries inline.
                    </li>
                    <li>
                      <span className="font-semibold text-slate-100">Physics & 2D raycasts:</span>{' '}
                      Cast rays for line-of-sight, tune restitution/friction, and spawn dynamic clones.
                    </li>
                    <li>
                      <span className="font-semibold text-slate-100">Camera & lighting FX:</span>{' '}
                      Combine spotlight shadow casting, trauma shake, easing tweens, and post-FX.
                    </li>
                  </ul>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {complexityTab === 'simple'
                    ? 'Zero boilerplate · Visual defaults'
                    : 'Coroutines · Scoped let · Live step debugger'}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenStudio(previewTemplateId)}
                  className="font-semibold text-sky-400 hover:text-sky-300 cursor-pointer whitespace-nowrap"
                >
                  Try in Studio →
                </button>
              </div>
            </div>

            {/* Right Real Block Stack Representation */}
            <div className="lg:col-span-7 rounded-xl border border-slate-800/90 spark-grid-bg p-6 flex flex-col justify-center">
              <div className="text-xs font-medium text-slate-400 mb-4">
                {complexityTab === 'simple'
                  ? 'Default Starter Script — Runner Movement'
                  : 'Advanced Script — Scoped Return Function & Dictionary State'}
              </div>
              <div className="flex flex-col items-start gap-0.5">
                {(complexityTab === 'simple' ? SIMPLE_MODE_BLOCKS : ADVANCED_MODE_BLOCKS).map(
                  (blk, i) => {
                    const cat = CATEGORY_MAP[blk.category];
                    return (
                      <div
                        key={i}
                        style={{
                          marginLeft: blk.indent ? `${blk.indent * 22}px` : undefined,
                          backgroundColor: cat.color,
                          borderColor: cat.border,
                          color: cat.text,
                        }}
                        className={`px-3 py-1.5 border text-xs font-medium font-mono shadow-sm ${
                          blk.shape === 'hat' ? 'mt-2 first:mt-0 rounded-t-xl rounded-b-md' : 'rounded-md'
                        }`}
                      >
                        {blk.text}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: ALL CORE CAPABILITIES (ASYMMETRIC BENTO GRID) */}
        <section id="capabilities" className="py-14 border-t border-slate-800/80">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-sky-400">Complete Feature Set</p>
            <h2
              style={{ textWrap: 'balance' }}
              className="mt-2 text-2xl lg:text-3xl font-bold tracking-tight text-slate-50"
            >
              Everything included in one fast, self-contained studio.
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 01 - Wide */}
            <article className="lg:col-span-2 rounded-xl border border-slate-800/90 bg-[#0F1522] p-6">
              <h3 className="text-lg font-semibold text-slate-100">
                01. Custom Scene Graph & Rigid-Body Physics Engine
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 max-w-[65ch]">
                Written directly against HTML5 Canvas without Matter.js or PixiJS overhead. Every
                sprite supports non-uniform X/Y scaling, skew shear, Z-index layering, opacity,
                composite blend modes, static/dynamic rigid bodies, friction, bounce restitution,
                and continuous 2D raycasting.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-mono text-slate-400">
                <span>AABB & Circle Colliders</span>
                <span aria-hidden="true">·</span>
                <span>2D Raycast Hit/Distance</span>
                <span aria-hidden="true">·</span>
                <span>Blend Modes (Add, Multiply, Screen)</span>
              </div>
            </article>

            {/* 02 - Narrow */}
            <article className="lg:col-span-1 rounded-xl border border-slate-800/90 bg-[#0F1522] p-6">
              <h3 className="text-lg font-semibold text-slate-100">
                02. 2D Lighting, Camera & Shaders
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Attach point or directional spotlights with shadow casting directly to sprites,
                drive smooth camera follow/zoom and damped trauma shake, and trigger chromatic
                aberration, pixelate, vignette, and particle bursts from blocks.
              </p>
            </article>

            {/* 03 - Narrow */}
            <article className="lg:col-span-1 rounded-xl border border-slate-800/90 bg-[#0F1522] p-6">
              <h3 className="text-lg font-semibold text-slate-100">
                03. Multi-Layer Costume Studio
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Paint sprites pixel-by-pixel with layers, onion skinning, flood fill, shape tools,
                flip/transform gizmos, custom pivot crosshairs, and an offline procedural texture
                generator.
              </p>
            </article>

            {/* 04 - Wide */}
            <article className="lg:col-span-2 rounded-xl border border-slate-800/90 bg-[#0F1522] p-6">
              <h3 className="text-lg font-semibold text-slate-100">
                04. Concurrent Block VM, Return Functions & Step Debugger
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 max-w-[65ch]">
                Drag single blocks or whole joined stacks with magnetic notch snapping, auto-slotted
                reporter expressions, and collision-free Tidy layout. Execute concurrent event
                coroutines, clones, easing tweens, local variables, arrays, dictionaries, and custom
                functions while stepping instruction-by-instruction.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-mono text-slate-400">
                <span>First-Class Return Functions</span>
                <span aria-hidden="true">·</span>
                <span>2D Arrays & Dictionaries</span>
                <span aria-hidden="true">·</span>
                <span>Live Watchers & Active Block Highlight</span>
              </div>
            </article>
          </div>
        </section>

        {/* SECTION 3: PLAYABLE STARTER TEMPLATES */}
        <section id="templates" className="py-14 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-sky-400">Playable Worlds</p>
              <h2
                style={{ textWrap: 'balance' }}
                className="mt-2 text-2xl lg:text-3xl font-bold tracking-tight text-slate-50"
              >
                Inspect working games, remix every block.
              </h2>
            </div>
            <button
              type="button"
              onClick={onCreateBlankProject}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              Or start from an empty canvas →
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            {starterCards.map((item) => (
              <div
                key={item.meta.id}
                className="rounded-xl border border-slate-800/90 bg-[#0F1522] p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Real procedural costume sprite strip */}
                  <div className="h-20 rounded-lg bg-[#090E18] border border-slate-800/80 px-4 flex items-center justify-center gap-4">
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

                  <h3 className="mt-4 text-base font-semibold text-slate-100">{item.meta.name}</h3>
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
                  onClick={() => onOpenStudio(item.meta.id)}
                  className="mt-5 w-full h-9 px-4 rounded-md bg-slate-800 hover:bg-sky-600 text-xs font-semibold text-slate-100 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: 100% OPEN SOURCE & LEAN ARCHITECTURE */}
        <section id="open-source" className="py-14 border-t border-slate-800/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <p className="text-xs font-medium text-emerald-400">100% Open Source</p>
              <h2
                style={{ textWrap: 'balance' }}
                className="mt-2 text-2xl lg:text-3xl font-bold tracking-tight text-slate-50"
              >
                Less bloat, direct hardware speed, full project ownership.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Traditional web block IDEs bundle megabytes of legacy wrapper frameworks before
                drawing a single pixel. SparkCode 2 removes every middleman so projects open
                instantly, save as readable JSON, and stay yours forever.
              </p>
            </div>

            <div className="lg:col-span-7 rounded-xl border border-slate-800/90 bg-[#0F1522] overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 bg-[#0B101B]">
                    <th className="py-3 px-4 font-semibold">Subsystem</th>
                    <th className="py-3 px-4 font-semibold">SparkCode 2 Implementation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300">
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-100 whitespace-nowrap">
                      Renderer & Lighting
                    </td>
                    <td className="py-3 px-4">
                      Direct HTML5 Canvas 2D scene graph, shadow buffers & shader pass (0 runtime deps)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-100 whitespace-nowrap">
                      Physics & Raycast
                    </td>
                    <td className="py-3 px-4">
                      Custom impulse/restitution AABB & circle solver in pure TypeScript
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-100 whitespace-nowrap">
                      Block Workspace
                    </td>
                    <td className="py-3 px-4">
                      Native React + SVG Bezier blocks with magnetic snapping (no Blockly / Scratch VM)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-100 whitespace-nowrap">
                      Costume Pipeline
                    </td>
                    <td className="py-3 px-4">
                      Multi-layer canvas painting, flood fill, onion skinning & local procedural synthesis
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-100 whitespace-nowrap">
                      Project Format
                    </td>
                    <td className="py-3 px-4">
                      100% Open Source · Single-file <span className="font-mono text-sky-300">.spark2.json</span> export &amp; import
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 5: ELITE SUPPORTERS */}
        <section id="supporters" className="py-14 border-t border-slate-800/80">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-amber-400">Community Patrons</p>
              <h2
                style={{ textWrap: 'balance' }}
                className="mt-2 text-2xl lg:text-3xl font-bold tracking-tight text-slate-50"
              >
                Supporters
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                SparkCode 2 is backed by our Elite Members and community contributors. Join as an
                Elite Member to receive the Elite Badge, early access to extra features, all Pro
                benefits, and your name listed here.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenSupportUs}
              className="h-10 px-5 rounded-md bg-[#131A29] hover:bg-[#1B2438] border border-slate-700/80 text-xs font-semibold text-slate-100 inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 self-start md:self-auto cursor-pointer"
            >
              <span>Support SparkCode 2</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            data-testid="homepage-supporters-list"
            className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {eliteSupporters.map((supporter) => (
              <div
                key={supporter.id}
                className="rounded-xl border border-slate-800/90 bg-[#0F1522] px-5 py-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100 truncate">
                    {supporter.name}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400 truncate">
                    {supporter.role} · Elite Member since {supporter.since}
                  </div>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 28 28"
                  fill="none"
                  aria-label="Elite Badge"
                  className="shrink-0"
                >
                  <path
                    d="M14 2L17.4 8.8L25 9.9L19.5 15.2L20.8 22.8L14 19.2L7.2 22.8L8.5 15.2L3 9.9L10.6 8.8L14 2Z"
                    fill="#F59E0B"
                    fillOpacity="0.16"
                    stroke="#FBBF24"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ))}
          </div>
        </section>

        {/* QUIET FOOTER */}
        <footer className="py-10 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-200">SparkCode 2</span>
            <span aria-hidden="true">·</span>
            <span>Open-source visual block IDE &amp; native 2D engine</span>
          </div>
          <div className="flex items-center gap-5">
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
          </div>
        </footer>
      </main>
    </div>
  );
};
