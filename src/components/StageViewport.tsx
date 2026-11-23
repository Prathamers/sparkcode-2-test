// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Flag, Lock, Maximize2, Minimize2, Pause, Sparkles, Square, StepForward } from 'lucide-react';
import type { SparkEngine } from '../engine/SparkEngine';
import type { EngineTelemetry, RenderBackendMode, RuntimeValue } from '../types/project';

interface StageViewportProps {
  engine: SparkEngine;
  telemetry: EngineTelemetry;
  watchedGlobals: string[];
  renderBackendMode: RenderBackendMode;
  isElite: boolean;
  onToggleRenderBackend: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onRun: () => void;
  onPause: () => void;
  onStop: () => void;
  onStep: () => void;
}

const WatcherCard: React.FC<{ name: string; value: RuntimeValue | undefined }> = ({ name, value }) => {
  const isArray = Array.isArray(value);
  const isDict = Boolean(value && typeof value === 'object' && !isArray);
  const [expanded, setExpanded] = useState(true);

  if (isDict) {
    const entries = Object.entries(value as Record<string, RuntimeValue>);
    return (
      <div
        data-testid={`watcher-${name}`}
        className="pointer-events-auto rounded-md bg-slate-950/82 border border-slate-700/70 text-[11px] font-mono backdrop-blur-xs shadow-sm overflow-hidden"
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full px-2 py-0.5 flex items-center justify-between gap-2.5 text-left hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
            {expanded ? (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-400" />
            )}
            <span>{name}</span>
          </span>
          <span className="text-[10px] text-slate-400 tabular-nums">
            {entries.length} {entries.length === 1 ? 'key' : 'keys'}
          </span>
        </button>
        {expanded && (
          <div className="px-2 py-1 border-t border-slate-800/80 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 bg-slate-900/50">
            {entries.length === 0 ? (
              <span className="text-[10px] text-slate-500 italic">empty</span>
            ) : (
              entries.map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1 tabular-nums">
                  <span className="text-slate-400">{k}:</span>
                  <span className="text-emerald-300 font-semibold">
                    {v && typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}
                  </span>
                </span>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  if (isArray) {
    const items = value as RuntimeValue[];
    return (
      <div
        data-testid={`watcher-${name}`}
        className="pointer-events-auto rounded-md bg-slate-950/82 border border-slate-700/70 text-[11px] font-mono backdrop-blur-xs shadow-sm overflow-hidden"
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full px-2 py-0.5 flex items-center justify-between gap-2.5 text-left hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
            {expanded ? (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-400" />
            )}
            <span>{name}</span>
          </span>
          <span className="text-[10px] text-slate-400 tabular-nums">[{items.length}]</span>
        </button>
        {expanded && (
          <div className="px-2 py-1 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 bg-slate-900/50">
            {items.length === 0 ? (
              <span className="text-[10px] text-slate-500 italic">empty</span>
            ) : (
              items.slice(0, 8).map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-0.5 tabular-nums">
                  <span className="text-slate-500">{idx}:</span>
                  <span className="text-sky-300 font-semibold">{String(item ?? '')}</span>
                </span>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid={`watcher-${name}`}
      className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-700/65 text-[11px] font-mono tabular-nums flex items-center justify-between gap-2.5 backdrop-blur-xs shadow-sm"
    >
      <span className="text-slate-400">{name}</span>
      <span className="text-sky-300 font-semibold">{String(value ?? 0)}</span>
    </div>
  );
};

export const StageViewport: React.FC<StageViewportProps> = ({
  engine,
  telemetry,
  watchedGlobals,
  renderBackendMode,
  isElite,
  onToggleRenderBackend,
  isFullscreen,
  onToggleFullscreen,
  onRun,
  onPause,
  onStop,
  onStep,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mount canvas to SparkEngine once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    engine.attachCanvas(canvas);
    return () => {
      engine.attachCanvas(null);
    };
  }, [engine]);

  return (
    <section
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#0B0F17] flex flex-col p-4'
          : 'flex flex-col bg-[#101623] border-b border-slate-800/90 shrink-0'
      }
    >
      {/* Stage Controls Header */}
      <div className="h-10 px-3 flex items-center justify-between gap-2 border-b border-slate-800/80 bg-[#0F1522]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Green Flag Run"
            title="Run (Green Flag)"
            onClick={onRun}
            className={`h-7 px-2.5 rounded inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              telemetry.runState === 'running'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/35'
            }`}
          >
            <Flag className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
          </button>

          <button
            type="button"
            aria-label="Pause execution"
            title="Pause"
            onClick={onPause}
            disabled={telemetry.runState !== 'running'}
            className="h-7 w-7 rounded inline-flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 text-amber-300 cursor-pointer disabled:cursor-not-allowed"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            aria-label="Step one debugger instruction"
            title="Step Debugger"
            onClick={onStep}
            className="h-7 px-2 rounded inline-flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 text-sky-300 text-[11px] font-medium cursor-pointer whitespace-nowrap"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          <button
            type="button"
            aria-label="Stop and reset stage"
            title="Stop"
            onClick={onStop}
            className="h-7 w-7 rounded inline-flex items-center justify-center bg-slate-800/80 hover:bg-rose-600/40 text-rose-400 cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>
        </div>

        {/* Renderer Mode Toggle & Compact Controls */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-slate-400 whitespace-nowrap shrink-0">
          <span data-testid="fps-readout">{telemetry.fps} FPS</span>
          <span aria-hidden="true">·</span>
          <span>{telemetry.drawCalls}d</span>
          {telemetry.cloneCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-sky-300">{telemetry.cloneCount}c</span>
            </>
          )}
          <button
            type="button"
            onClick={onToggleRenderBackend}
            aria-label={
              !isElite
                ? 'WebGL2 Hardware Shadow and Bloom Pass (Elite Member Experimental feature)'
                : renderBackendMode === 'webgl2'
                  ? 'Switch to 2D Canvas renderer'
                  : 'Enable WebGL2 Hardware Shadow and Bloom Pass'
            }
            title={
              !isElite
                ? 'WebGL2 Hardware Shadow & Bloom Pass is an Elite Member feature — click to open Experimental tab'
                : telemetry.renderBackend.requested === 'webgl2' &&
                    telemetry.renderBackend.active === 'canvas2d'
                  ? `2D Canvas fallback active (${telemetry.renderBackend.fallbackReason ?? 'WebGL2 unavailable'})`
                  : renderBackendMode === 'webgl2'
                    ? 'WebGL2 Hardware Shadow & Bloom active — click to switch to 2D Canvas'
                    : '2D Canvas active — click to enable WebGL2 Hardware Shadow & Bloom'
            }
            className={`ml-0.5 h-6 px-1.5 rounded inline-flex items-center gap-1 text-[10px] font-sans font-semibold border transition-colors cursor-pointer ${
              !isElite
                ? 'bg-slate-800/80 border-amber-500/35 text-amber-200/90 hover:bg-slate-700'
                : renderBackendMode === 'webgl2'
                  ? telemetry.renderBackend.active === 'webgl2'
                    ? 'bg-sky-600/25 border-sky-500/50 text-sky-300 hover:bg-sky-600/35'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-200 hover:bg-amber-900/60'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            {isElite ? <Sparkles className="w-3 h-3" /> : <Lock className="w-3 h-3 text-amber-400" />}
            <span>
              {!isElite
                ? '2D'
                : renderBackendMode === 'webgl2'
                  ? telemetry.renderBackend.active === 'webgl2'
                    ? 'WebGL2'
                    : '2D Fallback'
                  : '2D'}
            </span>
          </button>
          <button
            type="button"
            aria-label={isFullscreen ? 'Exit fullscreen stage' : 'Fullscreen stage'}
            onClick={onToggleFullscreen}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* High-DPI Stage Canvas Container */}
      <div
        className={`spark-preserve-dark relative bg-[#070B12] flex items-center justify-center overflow-hidden ${
          isFullscreen ? 'flex-1 mt-3 rounded-lg border border-slate-800' : 'aspect-[14/9] w-full'
        }`}
      >
        <canvas
          ref={canvasRef}
          data-testid="stage-canvas"
          data-run-state={telemetry.runState}
          onMouseMove={(e) => engine.setMousePositionFromClient(e.clientX, e.clientY)}
          onMouseDown={() => engine.setMouseDown(true)}
          onMouseUp={() => engine.setMouseDown(false)}
          onMouseLeave={() => engine.setMouseDown(false)}
          className="w-full h-full block"
        />

        {/* Live Variable Watchers Overlay */}
        {watchedGlobals.length > 0 && (
          <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5 pointer-events-none max-w-[230px]">
            {watchedGlobals.map((key) => (
              <WatcherCard key={key} name={key} value={telemetry.globals[key]} />
            ))}
          </div>
        )}

        {telemetry.lastError && (
          <div className="absolute bottom-2 inset-x-2 px-3 py-1.5 rounded bg-rose-950/90 border border-rose-500/60 text-xs text-rose-200 font-mono">
            Runtime error: {telemetry.lastError}
          </div>
        )}
      </div>
    </section>
  );
};

