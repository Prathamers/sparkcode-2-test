// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { Cpu, RotateCcw } from 'lucide-react';
import type { EngineTelemetry, ImprovedVMConfig } from '../../types/project';
import { LockedLabNotice } from './LockedLabNotice';

interface ImprovedVMLabProps {
  improvedVM: ImprovedVMConfig;
  isElite: boolean;
  vmStats?: EngineTelemetry['vmStats'];
  onUpdate: (patch: Partial<ImprovedVMConfig>) => void;
  onOpenSupportUs: () => void;
}

const STEP_BUDGET_OPTIONS = [128, 256, 512, 1024] as const;

export const ImprovedVMLab: React.FC<ImprovedVMLabProps> = ({
  improvedVM,
  isElite,
  vmStats,
  onUpdate,
  onOpenSupportUs,
}) => (
  <section
    data-testid="experimental-improved-vm"
    className="p-4 rounded-lg bg-[#111827] border border-slate-800/90"
  >
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-100 inline-flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-400" />
          <span>Improved SparkVM</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-[10px] font-mono font-semibold text-amber-300">
            ELITE ONLY
          </span>
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">
          High-throughput bytecode coroutine scheduler with turbo instruction budgets (up to 1,024 ops/tick vs 48 standard), O(1) function lookup cache, and expanded clone &amp; particle budgets.
        </p>
      </div>

      {isElite && (
        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0B0F17] border border-slate-700/80 text-xs font-semibold text-slate-100 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={improvedVM.enabled}
            onChange={(e) => onUpdate({ enabled: e.target.checked })}
            className="accent-amber-400"
          />
          <span>{improvedVM.enabled ? 'Improved VM Active' : 'Enable Improved VM'}</span>
        </label>
      )}
    </div>

    {isElite ? (
      <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-4 text-xs">
        <div>
          <div className="text-slate-300 font-medium mb-2">
            Turbo Instruction Budget per Thread / Frame (Standard: 48 ops/tick)
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {STEP_BUDGET_OPTIONS.map((budget) => {
              const selected = improvedVM.stepBudget === budget;
              return (
                <button
                  key={budget}
                  type="button"
                  disabled={!improvedVM.enabled}
                  onClick={() => onUpdate({ stepBudget: budget })}
                  className={`h-8 px-3 rounded-md font-mono font-semibold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    selected
                      ? 'bg-amber-500/20 border-amber-400/70 text-amber-200'
                      : 'bg-[#0B0F17] border-slate-700/80 text-slate-300 hover:text-white'
                  }`}
                >
                  {budget} ops/tick
                </button>
              );
            })}
            <button
              type="button"
              disabled={!improvedVM.enabled}
              onClick={() =>
                onUpdate({
                  stepBudget: 256,
                  fastSymbolCache: true,
                  expandedLimits: true,
                })
              }
              className="h-8 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 inline-flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              title="Reset Improved SparkVM defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="p-3 rounded-md bg-[#0B0F17] border border-slate-800/90 flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              disabled={!improvedVM.enabled}
              checked={improvedVM.fastSymbolCache}
              onChange={(e) => onUpdate({ fastSymbolCache: e.target.checked })}
              className="mt-0.5 accent-amber-400"
            />
            <div>
              <div className="font-semibold text-slate-100">O(1) Function &amp; Symbol Cache</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Memoizes custom function definitions per sprite and raises sync recursion depth from 16 to 32.
              </div>
            </div>
          </label>

          <label className="p-3 rounded-md bg-[#0B0F17] border border-slate-800/90 flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              disabled={!improvedVM.enabled}
              checked={improvedVM.expandedLimits}
              onChange={(e) => onUpdate({ expandedLimits: e.target.checked })}
              className="mt-0.5 accent-amber-400"
            />
            <div>
              <div className="font-semibold text-slate-100">Expanded Clone &amp; Particle Caps</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Raises runtime ceilings from 90 → 250 clones and 420 → 1,200 simultaneous particles.
              </div>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80 font-mono tabular-nums">
          <div className="p-2.5 rounded bg-[#0B0F17] border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase">VM Mode</div>
            <div className={`mt-0.5 text-xs font-semibold ${vmStats?.improvedActive ? 'text-amber-300' : 'text-slate-200'}`}>
              {vmStats?.improvedActive ? 'Improved' : 'Standard'}
            </div>
          </div>
          <div className="p-2.5 rounded bg-[#0B0F17] border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase">Budget / Tick</div>
            <div className="mt-0.5 text-xs font-semibold text-sky-300">
              {vmStats?.stepBudget ?? 48} ops
            </div>
          </div>
          <div className="p-2.5 rounded bg-[#0B0F17] border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase">Last Tick Ops</div>
            <div className="mt-0.5 text-xs font-semibold text-emerald-300">
              {vmStats?.stepsLastTick ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded bg-[#0B0F17] border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase">Entity Caps</div>
            <div className="mt-0.5 text-xs font-semibold text-slate-200">
              {vmStats?.maxClones ?? 90}c / {vmStats?.maxParticles ?? 420}p
            </div>
          </div>
        </div>
      </div>
    ) : (
      <LockedLabNotice
        ctaLabel="Upgrade to Elite"
        ctaClassName="bg-amber-500 hover:bg-amber-400 text-slate-950"
        onUnlock={onOpenSupportUs}
      >
        Improved SparkVM (turbo step budgets, O(1) symbol cache, 250 clones &amp; 1,200 particles) is an{' '}
        <strong className="text-amber-300">Elite Member ($20/mo)</strong> exclusive runtime mode.
      </LockedLabNotice>
    )}
  </section>
);
