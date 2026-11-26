// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import type { StarterTemplateMeta } from '../../data/starterProjects';
import type { EliteSupporter } from '../../data/supporters';
import { CATEGORY_MAP } from '../../engine/blocks';

interface PreviewSnippetBlock {
  category: keyof typeof CATEGORY_MAP;
  shape: 'hat' | 'stack' | 'c-block';
  text: string;
  indent?: number;
}

export interface StarterCardSummary {
  meta: StarterTemplateMeta;
  spriteCount: number;
  scriptCount: number;
  hasLighting: boolean;
  hasPhysics: boolean;
  leadSprites: Array<{ id: string; name: string; thumb: string }>;
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

const ARCHITECTURE_ROWS: Array<{ subsystem: string; implementation: React.ReactNode }> = [
  {
    subsystem: 'Renderer & Lighting',
    implementation: 'Direct HTML5 Canvas 2D scene graph, shadow buffers & shader pass (0 runtime deps)',
  },
  {
    subsystem: 'Physics & Raycast',
    implementation: 'Custom impulse/restitution AABB & circle solver in pure TypeScript',
  },
  {
    subsystem: 'Block Workspace',
    implementation: 'Native React + SVG Bezier blocks with magnetic snapping (no Blockly / Scratch VM)',
  },
  {
    subsystem: 'Costume Pipeline',
    implementation: 'Multi-layer canvas painting, flood fill, onion skinning & local procedural synthesis',
  },
  {
    subsystem: 'Project Format',
    implementation: (
      <>
        100% Open Source · Single-file <span className="font-mono text-sky-300">.spark2.json</span>{' '}
        export &amp; import
      </>
    ),
  },
];

export const ProgressiveWorkflowSection: React.FC<{
  complexityTab: 'simple' | 'advanced';
  onChangeTab: (tab: 'simple' | 'advanced') => void;
  onTryInStudio: () => void;
}> = ({ complexityTab, onChangeTab, onTryInStudio }) => (
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

      <div
        role="tablist"
        aria-label="Compare Simple and Advanced workflows"
        className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#101623] border border-slate-800 shrink-0 self-start"
      >
        {(['simple', 'advanced'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={complexityTab === tab}
            onClick={() => onChangeTab(tab)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              complexityTab === tab ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {tab === 'simple' ? 'Simple by Default' : 'Advanced When Needed'}
          </button>
        ))}
      </div>
    </div>

    <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
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
                <span className="font-semibold text-slate-100">Return functions &amp; dicts:</span>{' '}
                Nest custom function reporters and JSON-style key-value dictionaries inline.
              </li>
              <li>
                <span className="font-semibold text-slate-100">Physics &amp; 2D raycasts:</span>{' '}
                Cast rays for line-of-sight, tune restitution/friction, and spawn dynamic clones.
              </li>
              <li>
                <span className="font-semibold text-slate-100">Camera &amp; lighting FX:</span>{' '}
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
            onClick={onTryInStudio}
            className="font-semibold text-sky-400 hover:text-sky-300 cursor-pointer whitespace-nowrap"
          >
            Try in Studio →
          </button>
        </div>
      </div>

      <div className="lg:col-span-7 rounded-xl border border-slate-800/90 spark-grid-bg p-6 flex flex-col justify-center">
        <div className="text-xs font-medium text-slate-400 mb-4">
          {complexityTab === 'simple'
            ? 'Default Starter Script — Runner Movement'
            : 'Advanced Script — Scoped Return Function & Dictionary State'}
        </div>
        <div className="flex flex-col items-start gap-0.5">
          {(complexityTab === 'simple' ? SIMPLE_MODE_BLOCKS : ADVANCED_MODE_BLOCKS).map((blk, i) => {
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
          })}
        </div>
      </div>
    </div>
  </section>
);

export const CapabilitiesSection: React.FC = () => (
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
      <article className="lg:col-span-2 rounded-xl border border-slate-800/90 bg-[#0F1522] p-6">
        <h3 className="text-lg font-semibold text-slate-100">
          01. Custom Scene Graph &amp; Rigid-Body Physics Engine
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300 max-w-[65ch]">
          Written directly against HTML5 Canvas without Matter.js or PixiJS overhead. Every
          sprite supports non-uniform X/Y scaling, skew shear, Z-index layering, opacity,
          composite blend modes, static/dynamic rigid bodies, friction, bounce restitution,
          and continuous 2D raycasting.
        </p>
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-mono text-slate-400">
          <span>AABB &amp; Circle Colliders</span>
          <span aria-hidden="true">·</span>
          <span>2D Raycast Hit/Distance</span>
          <span aria-hidden="true">·</span>
          <span>Blend Modes (Add, Multiply, Screen)</span>
        </div>
      </article>

      <article className="lg:col-span-1 rounded-xl border border-slate-800/90 bg-[#0F1522] p-6">
        <h3 className="text-lg font-semibold text-slate-100">
          02. 2D Lighting, Camera &amp; Shaders
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Attach point or directional spotlights with shadow casting directly to sprites,
          drive smooth camera follow/zoom and damped trauma shake, and trigger chromatic
          aberration, pixelate, vignette, and particle bursts from blocks.
        </p>
      </article>

      <article className="lg:col-span-1 rounded-xl border border-slate-800/90 bg-[#0F1522] p-6">
        <h3 className="text-lg font-semibold text-slate-100">03. Multi-Layer Costume Studio</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Paint sprites pixel-by-pixel with layers, onion skinning, flood fill, shape tools,
          flip/transform gizmos, custom pivot crosshairs, and an offline procedural texture
          generator.
        </p>
      </article>

      <article className="lg:col-span-2 rounded-xl border border-slate-800/90 bg-[#0F1522] p-6">
        <h3 className="text-lg font-semibold text-slate-100">
          04. Concurrent Block VM, Return Functions &amp; Step Debugger
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
          <span>2D Arrays &amp; Dictionaries</span>
          <span aria-hidden="true">·</span>
          <span>Live Watchers &amp; Active Block Highlight</span>
        </div>
      </article>
    </div>
  </section>
);

export const TemplatesSection: React.FC<{
  starterCards: StarterCardSummary[];
  onCreateBlankProject: () => void;
  onOpenStudio: (templateId: string) => void;
}> = ({ starterCards, onCreateBlankProject, onOpenStudio }) => (
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
            <p className="mt-2.5 text-sm leading-relaxed text-slate-300">{item.meta.description}</p>
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
);

export const OpenSourceSection: React.FC = () => (
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
          Traditional web block IDEs bundle megabytes of legacy wrapper frameworks before drawing a
          single pixel. SparkCode 2 removes every middleman so projects open instantly, save as
          readable JSON, and stay yours forever.
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
            {ARCHITECTURE_ROWS.map((row) => (
              <tr key={row.subsystem}>
                <td className="py-3 px-4 font-medium text-slate-100 whitespace-nowrap">
                  {row.subsystem}
                </td>
                <td className="py-3 px-4">{row.implementation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export const SupportersSection: React.FC<{
  eliteSupporters: EliteSupporter[];
  onOpenSupportUs: () => void;
}> = ({ eliteSupporters, onOpenSupportUs }) => (
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
          SparkCode 2 is backed by our Elite Members and community contributors. Join as an Elite
          Member to receive the Elite Badge, early access to extra features, all Pro benefits, and
          your name listed here.
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
            <div className="text-sm font-semibold text-slate-100 truncate">{supporter.name}</div>
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
);
