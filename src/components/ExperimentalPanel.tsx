// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  FlaskConical,
  Lock,
  PenTool,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
} from 'lucide-react';
import type { SupporterTierId } from '../data/supporters';
import { normalizeImprovedVMConfig } from '../engine/vm';
import { normalizeWebGL2Config } from '../engine/webgl2Pipeline';
import type {
  CostumeData,
  EngineTelemetry,
  ImprovedVMConfig,
  SparkProject,
  SpriteData,
  StageSettings,
  WebGL2RenderConfig,
} from '../types/project';

interface ExperimentalPanelProps {
  project: SparkProject;
  selectedSprite: SpriteData;
  supporterTier: SupporterTierId | null;
  renderBackend?: EngineTelemetry['renderBackend'];
  vmStats?: EngineTelemetry['vmStats'];
  onChangeStage: (stage: StageSettings) => void;
  onChangeSprite: (next: SpriteData, rebuildTextures?: boolean) => void;
  onOpenSupportUs: () => void;
}

interface PenPoint {
  x: number; // Normalized 0..1 relative to costume width
  y: number; // Normalized 0..1 relative to costume height
}

const STEP_BUDGET_OPTIONS = [128, 256, 512, 1024] as const;

function drawVectorPath(
  ctx: CanvasRenderingContext2D,
  points: PenPoint[],
  width: number,
  height: number,
  opts: {
    smooth: boolean;
    closed: boolean;
    strokeColor: string;
    fillColor: string;
    strokeWidth: number;
    opacity: number;
  }
): void {
  if (points.length === 0) return;

  const px = (p: PenPoint) => p.x * width;
  const py = (p: PenPoint) => p.y * height;

  ctx.save();
  ctx.globalAlpha = Math.max(0.05, Math.min(1, opts.opacity));
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = opts.strokeColor;
  ctx.fillStyle = opts.fillColor;
  ctx.lineWidth = Math.max(1, opts.strokeWidth);

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(px(points[0]), py(points[0]), Math.max(1.5, opts.strokeWidth * 0.5), 0, Math.PI * 2);
    ctx.fillStyle = opts.strokeColor;
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  if (!opts.smooth || points.length === 2) {
    ctx.moveTo(px(points[0]), py(points[0]));
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(px(points[i]), py(points[i]));
    }
    if (opts.closed) ctx.closePath();
  } else if (opts.closed) {
    // Closed Catmull-Rom / quadratic midpoint smoothing
    const len = points.length;
    const firstMidX = (px(points[len - 1]) + px(points[0])) * 0.5;
    const firstMidY = (py(points[len - 1]) + py(points[0])) * 0.5;
    ctx.moveTo(firstMidX, firstMidY);
    for (let i = 0; i < len; i += 1) {
      const curr = points[i];
      const next = points[(i + 1) % len];
      const midX = (px(curr) + px(next)) * 0.5;
      const midY = (py(curr) + py(next)) * 0.5;
      ctx.quadraticCurveTo(px(curr), py(curr), midX, midY);
    }
    ctx.closePath();
  } else {
    // Open smooth quadratic curve through midpoints
    ctx.moveTo(px(points[0]), py(points[0]));
    for (let i = 1; i < points.length - 1; i += 1) {
      const curr = points[i];
      const next = points[i + 1];
      const midX = (px(curr) + px(next)) * 0.5;
      const midY = (py(curr) + py(next)) * 0.5;
      ctx.quadraticCurveTo(px(curr), py(curr), midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(px(last), py(last));
  }

  if (opts.closed && points.length >= 3) {
    ctx.fill();
  }
  ctx.stroke();
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function compositeCostumePreview(costume: CostumeData): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, costume.width);
  canvas.height = Math.max(1, costume.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return costume.previewUrl ?? '';

  for (const layer of costume.layers) {
    if (!layer.visible || !layer.dataUrl) continue;
    const img = await loadImage(layer.dataUrl);
    if (!img) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  return canvas.toDataURL('image/png');
}

export const ExperimentalPanel: React.FC<ExperimentalPanelProps> = ({
  project,
  selectedSprite,
  supporterTier,
  renderBackend,
  vmStats,
  onChangeStage,
  onChangeSprite,
  onOpenSupportUs,
}) => {
  const isProOrElite = supporterTier === 'pro' || supporterTier === 'elite';
  const isElite = supporterTier === 'elite';

  const { stage } = project;
  const webgl2 = normalizeWebGL2Config(stage.webgl2);
  const improvedVM = normalizeImprovedVMConfig(stage.improvedVM);

  const activeCostume =
    selectedSprite.costumes[selectedSprite.activeCostumeIndex] ?? selectedSprite.costumes[0];

  // Experimental Vector Pen Tool state
  const penCanvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<PenPoint[]>([]);
  const [hoverPoint, setHoverPoint] = useState<PenPoint | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [smoothPath, setSmoothPath] = useState(true);
  const [closedPath, setClosedPath] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokeColor, setStrokeColor] = useState('#38BDF8');
  const [fillColor, setFillColor] = useState('#0EA5E9');
  const [pathOpacity, setPathOpacity] = useState(0.95);
  const [stampFeedback, setStampFeedback] = useState<string | null>(null);
  const [costumeBgImage, setCostumeBgImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let active = true;
    if (!activeCostume?.previewUrl) {
      setCostumeBgImage(null);
      return;
    }
    void loadImage(activeCostume.previewUrl).then((img) => {
      if (active) setCostumeBgImage(img);
    });
    return () => {
      active = false;
    };
  }, [activeCostume?.previewUrl]);

  // Render interactive Pen Tool preview canvas
  useEffect(() => {
    const canvas = penCanvasRef.current;
    if (!canvas || !isProOrElite) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw existing sprite costume underlay
    if (costumeBgImage) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 0.72;
      ctx.drawImage(costumeBgImage, 0, 0, w, h);
      ctx.restore();
    }

    // Draw subtle guide grid
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 8; i += 1) {
      const gx = (w / 8) * i;
      const gy = (h / 8) * i;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }
    ctx.restore();

    // Scale stroke width visually relative to costume size -> preview canvas size
    const costumeW = Math.max(16, activeCostume?.width ?? 48);
    const visualStroke = Math.max(1.5, (strokeWidth / costumeW) * w);

    // Draw active vector path
    drawVectorPath(ctx, points, w, h, {
      smooth: smoothPath,
      closed: closedPath,
      strokeColor,
      fillColor,
      strokeWidth: visualStroke,
      opacity: pathOpacity,
    });

    // Rubber-band preview line to cursor
    if (hoverPoint && points.length > 0 && dragIndex === null) {
      const last = points[points.length - 1];
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(last.x * w, last.y * h);
      ctx.lineTo(hoverPoint.x * w, hoverPoint.y * h);
      ctx.stroke();
      ctx.restore();
    }

    // Draw draggable anchor nodes
    points.forEach((pt, idx) => {
      const cx = pt.x * w;
      const cy = pt.y * h;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, idx === 0 ? 5.5 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = idx === 0 ? '#34D399' : '#F8FAFC';
      ctx.fill();
      ctx.lineWidth = 1.75;
      ctx.strokeStyle = '#0F172A';
      ctx.stroke();
      ctx.restore();
    });
  }, [
    isProOrElite,
    costumeBgImage,
    points,
    hoverPoint,
    dragIndex,
    smoothPath,
    closedPath,
    strokeWidth,
    strokeColor,
    fillColor,
    pathOpacity,
    activeCostume?.width,
  ]);

  const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>): PenPoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height)));
    return { x, y };
  };

  const handlePenPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isProOrElite) return;
    const pt = getNormalizedPoint(e);
    // Check if clicking an existing anchor handle to drag it
    const hitIdx = points.findIndex((existing) => Math.hypot(existing.x - pt.x, existing.y - pt.y) < 0.045);
    if (hitIdx >= 0) {
      setDragIndex(hitIdx);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    setPoints((prev) => [...prev, pt]);
    setStampFeedback(null);
  };

  const handlePenPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isProOrElite) return;
    const pt = getNormalizedPoint(e);
    if (dragIndex !== null) {
      setPoints((prev) => prev.map((p, idx) => (idx === dragIndex ? pt : p)));
      return;
    }
    setHoverPoint(pt);
  };

  const handlePenPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragIndex !== null) {
      setDragIndex(null);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  const handleStampToCostume = async () => {
    if (!isProOrElite || !activeCostume || points.length < 2) return;

    const targetCostumeIdx = selectedSprite.activeCostumeIndex;
    const targetLayerIdx = Math.max(
      0,
      activeCostume.layers.findIndex((l) => l.visible)
    );
    const layer = activeCostume.layers[targetLayerIdx];
    if (!layer) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = Math.max(1, activeCostume.width);
    offscreen.height = Math.max(1, activeCostume.height);
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    if (layer.dataUrl) {
      const existing = await loadImage(layer.dataUrl);
      if (existing) {
        ctx.drawImage(existing, 0, 0, offscreen.width, offscreen.height);
      }
    }

    drawVectorPath(ctx, points, offscreen.width, offscreen.height, {
      smooth: smoothPath,
      closed: closedPath,
      strokeColor,
      fillColor,
      strokeWidth,
      opacity: pathOpacity,
    });

    const nextLayerDataUrl = offscreen.toDataURL('image/png');
    const nextLayers = activeCostume.layers.map((l, idx) =>
      idx === targetLayerIdx ? { ...l, dataUrl: nextLayerDataUrl } : l
    );
    const draftCostume: CostumeData = { ...activeCostume, layers: nextLayers };
    const nextPreview = await compositeCostumePreview(draftCostume);
    const finalCostume: CostumeData = { ...draftCostume, previewUrl: nextPreview };

    const nextSprite: SpriteData = {
      ...selectedSprite,
      costumes: selectedSprite.costumes.map((c, idx) => (idx === targetCostumeIdx ? finalCostume : c)),
    };

    onChangeSprite(nextSprite, true);
    setPoints([]);
    setStampFeedback(`Stamped vector path onto "${selectedSprite.name}" (${activeCostume.name})`);
  };

  const updateWebGL2 = (patch: Partial<WebGL2RenderConfig>) => {
    if (!isElite) return;
    onChangeStage({
      ...stage,
      webgl2: { ...webgl2, ...patch },
    });
  };

  const updateImprovedVM = (patch: Partial<ImprovedVMConfig>) => {
    if (!isElite) return;
    onChangeStage({
      ...stage,
      improvedVM: { ...improvedVM, ...patch },
    });
  };

  const tierLabel =
    supporterTier === 'elite'
      ? 'Elite Member'
      : supporterTier === 'pro'
        ? 'Pro Contributor'
        : supporterTier === 'plus'
          ? 'Plus Contributor'
          : 'Free Plan';

  return (
    <div data-testid="experimental-panel" className="flex-1 overflow-y-auto p-5 bg-[#0D121C]">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Experimental Labs Header & Membership Status */}
        <section className="p-4 rounded-lg bg-[#111827] border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Experimental Labs</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-slate-100">
              Tier-Gated Engine &amp; Studio Experiments
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Current membership:{' '}
              <span
                className={`font-semibold ${
                  isElite
                    ? 'text-amber-300'
                    : supporterTier === 'pro'
                      ? 'text-emerald-300'
                      : 'text-slate-200'
                }`}
              >
                {tierLabel}
              </span>
              {' · '}
              {isElite
                ? 'All Experimental Labs unlocked (Pen Tool, WebGL2 Shadow & Bloom, Improved SparkVM).'
                : supporterTier === 'pro'
                  ? 'Pro Experimental Labs unlocked (Vector Pen Tool).'
                  : 'Upgrade to Pro Contributor for the Pen Tool, or Elite Member for full Experimental access.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSupportUs}
            className="h-9 px-3.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isElite ? 'Manage Membership' : 'Unlock in Support Us'}
          </button>
        </section>

        {/* SECTION 1: EXPERIMENTAL VECTOR PEN TOOL (PRO & ELITE — EXPERIMENTAL TAB ONLY) */}
        <section
          data-testid="experimental-pen-tool"
          className="p-4 rounded-lg bg-[#111827] border border-slate-800/90"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 inline-flex items-center gap-2">
                <PenTool className="w-4 h-4 text-emerald-400" />
                <span>Vector Pen Tool</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-mono font-semibold text-emerald-300">
                  PRO &amp; ELITE · EXPERIMENTAL ONLY
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Place anchor points, curve smooth Bézier paths, drag nodes to refine, and stamp crisp vector artwork directly onto{' '}
                <span className="text-slate-200 font-medium">{selectedSprite.name}</span>. Exclusively hosted inside this Experimental tab.
              </p>
            </div>
          </div>

          {isProOrElite ? (
            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Interactive Pen Canvas */}
              <div className="md:col-span-6 flex flex-col items-center gap-2">
                <div className="w-full max-w-[288px] aspect-square rounded-lg border border-slate-700/90 overflow-hidden spark-checker-bg relative">
                  <canvas
                    ref={penCanvasRef}
                    width={288}
                    height={288}
                    onPointerDown={handlePenPointerDown}
                    onPointerMove={handlePenPointerMove}
                    onPointerUp={handlePenPointerUp}
                    onPointerLeave={() => {
                      setHoverPoint(null);
                      setDragIndex(null);
                    }}
                    className="w-full h-full block cursor-crosshair touch-none"
                    aria-label="Experimental Vector Pen Canvas"
                  />
                </div>
                <div className="w-full max-w-[288px] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{points.length} anchor {points.length === 1 ? 'point' : 'points'}</span>
                  <span>Click to add · Drag node to move</span>
                </div>
              </div>

              {/* Vector Pen Controls */}
              <div className="md:col-span-6 flex flex-col gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smoothPath}
                      onChange={(e) => setSmoothPath(e.target.checked)}
                      className="accent-emerald-400"
                    />
                    <span>Smooth Bézier</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={closedPath}
                      onChange={(e) => setClosedPath(e.target.checked)}
                      className="accent-emerald-400"
                    />
                    <span>Close &amp; Fill</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-slate-400">
                    <span>Stroke Color</span>
                    <input
                      type="color"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="w-full h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-slate-400">
                    <span>Fill Color</span>
                    <input
                      type="color"
                      value={fillColor}
                      disabled={!closedPath}
                      onChange={(e) => setFillColor(e.target.value)}
                      className="w-full h-8 rounded border border-slate-700 bg-transparent cursor-pointer disabled:opacity-40"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1 text-slate-400">
                  <span>Stroke Width ({strokeWidth}px)</span>
                  <input
                    type="range"
                    min={1}
                    max={16}
                    step={0.5}
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="accent-emerald-400"
                  />
                </label>

                <label className="flex flex-col gap-1 text-slate-400">
                  <span>Path Opacity ({Math.round(pathOpacity * 100)}%)</span>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={pathOpacity}
                    onChange={(e) => setPathOpacity(Number(e.target.value))}
                    className="accent-emerald-400"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={points.length === 0}
                    onClick={() => setPoints((prev) => prev.slice(0, -1))}
                    className="h-8 px-2.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Undo Point</span>
                  </button>
                  <button
                    type="button"
                    disabled={points.length === 0}
                    onClick={() => {
                      setPoints([]);
                      setStampFeedback(null);
                    }}
                    className="h-8 px-2.5 rounded bg-slate-800 hover:bg-rose-600/30 disabled:opacity-40 text-slate-200 hover:text-rose-200 inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={points.length < 2}
                  onClick={() => void handleStampToCostume()}
                  className="h-9 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Stamp Path onto {selectedSprite.name}</span>
                </button>

                {stampFeedback && (
                  <div className="px-2.5 py-2 rounded bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-200 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>{stampFeedback}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  The Experimental Vector Pen Tool requires a <strong className="text-slate-100">Pro Contributor ($10/mo)</strong> or{' '}
                  <strong className="text-amber-300">Elite Member ($20/mo)</strong> membership and is available exclusively in this Experimental tab.
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenSupportUs}
                className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Unlock with Pro or Elite
              </button>
            </div>
          )}
        </section>

        {/* SECTION 2: WEBGL2 HARDWARE SHADOW & BLOOM PASS (ELITE ONLY — hidden on Pro) */}
        {supporterTier !== 'pro' && (
          <section
            data-testid="experimental-webgl2"
            className="p-4 rounded-lg bg-[#111827] border border-slate-800/90"
          >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>WebGL2 Hardware Shadow &amp; Bloom Pass</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-[10px] font-mono font-semibold text-amber-300">
                  ELITE ONLY
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Optional GPU-accelerated Sobel normal-mapped sprite lighting, analytic soft shadows, and multi-pass HDR bloom with automatic 2D Canvas fallback.
              </p>
            </div>

            {isElite && (
              <div
                role="group"
                aria-label="Render backend mode"
                className="inline-flex items-center p-0.5 rounded-md bg-[#0B0F17] border border-slate-700/80 text-xs shrink-0"
              >
                <button
                  type="button"
                  onClick={() => updateWebGL2({ backend: 'canvas2d' })}
                  className={`h-7 px-2.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    webgl2.backend === 'canvas2d'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  2D Canvas
                </button>
                <button
                  type="button"
                  onClick={() => updateWebGL2({ backend: 'webgl2' })}
                  className={`h-7 px-2.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    webgl2.backend === 'webgl2'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  WebGL2 GPU
                </button>
              </div>
            )}
          </div>

          {isElite ? (
            <>
              {renderBackend &&
                renderBackend.requested === 'webgl2' &&
                renderBackend.active === 'canvas2d' && (
                  <div className="mb-3 px-3 py-2 rounded-md bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200">
                    2D Canvas fallback active: {renderBackend.fallbackReason || 'WebGL2 unavailable on this device.'}
                  </div>
                )}

              {webgl2.backend === 'webgl2' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-800/80">
                  {/* Normal-Mapped Lighting */}
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-slate-200 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webgl2.normalMapping}
                        onChange={(e) => updateWebGL2({ normalMapping: e.target.checked })}
                        className="accent-sky-400"
                      />
                      <span>Normal-Mapped Sprite Lighting</span>
                    </label>
                    <label className="flex flex-col gap-1 text-slate-400">
                      <span>Normal Relief Strength ({webgl2.normalStrength.toFixed(1)}x)</span>
                      <input
                        type="range"
                        min={0}
                        max={3}
                        step={0.1}
                        disabled={!webgl2.normalMapping}
                        value={webgl2.normalStrength}
                        onChange={(e) => updateWebGL2({ normalStrength: Number(e.target.value) })}
                        className="accent-sky-400 disabled:opacity-40"
                      />
                    </label>
                  </div>

                  {/* Hardware Soft Shadows */}
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-slate-200 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webgl2.hardwareShadows}
                        onChange={(e) => updateWebGL2({ hardwareShadows: e.target.checked })}
                        className="accent-sky-400"
                      />
                      <span>Hardware Soft Shadows</span>
                    </label>
                    <label className="flex flex-col gap-1 text-slate-400">
                      <span>Shadow Penumbra Softness ({Math.round(webgl2.shadowSoftness * 100)}%)</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        disabled={!webgl2.hardwareShadows}
                        value={webgl2.shadowSoftness}
                        onChange={(e) => updateWebGL2({ shadowSoftness: Number(e.target.value) })}
                        className="accent-sky-400 disabled:opacity-40"
                      />
                    </label>
                  </div>

                  {/* HDR Bloom Pass */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-800/70 flex flex-col gap-2.5">
                    <label className="flex items-center gap-2 text-slate-200 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webgl2.bloomEnabled}
                        onChange={(e) => updateWebGL2({ bloomEnabled: e.target.checked })}
                        className="accent-sky-400"
                      />
                      <span>HDR Bloom Pass (Bright-Pass + Separable Gaussian Blur)</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <label className="flex flex-col gap-1 text-slate-400">
                        <span>Threshold ({webgl2.bloomThreshold.toFixed(2)})</span>
                        <input
                          type="range"
                          min={0.2}
                          max={0.95}
                          step={0.02}
                          disabled={!webgl2.bloomEnabled}
                          value={webgl2.bloomThreshold}
                          onChange={(e) => updateWebGL2({ bloomThreshold: Number(e.target.value) })}
                          className="accent-sky-400 disabled:opacity-40"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-slate-400">
                        <span>Intensity ({webgl2.bloomIntensity.toFixed(2)})</span>
                        <input
                          type="range"
                          min={0}
                          max={2.5}
                          step={0.05}
                          disabled={!webgl2.bloomEnabled}
                          value={webgl2.bloomIntensity}
                          onChange={(e) => updateWebGL2({ bloomIntensity: Number(e.target.value) })}
                          className="accent-sky-400 disabled:opacity-40"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-slate-400">
                        <span>Spread Radius ({webgl2.bloomRadius.toFixed(1)}px)</span>
                        <input
                          type="range"
                          min={1}
                          max={6}
                          step={0.2}
                          disabled={!webgl2.bloomEnabled}
                          value={webgl2.bloomRadius}
                          onChange={(e) => updateWebGL2({ bloomRadius: Number(e.target.value) })}
                          className="accent-sky-400 disabled:opacity-40"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                  Native 2D Canvas renderer is currently active. Toggle <span className="text-slate-200 font-medium">WebGL2 GPU</span> above to enable normal-mapped lighting, GPU soft shadows, and HDR bloom.
                </p>
              )}
            </>
          ) : (
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  WebGL2 Hardware Shadow &amp; Bloom Pass is an <strong className="text-amber-300">Elite Member ($20/mo)</strong> exclusive experimental renderer. Standard 2D Canvas fallback remains active for all users.
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenSupportUs}
                className="h-8 px-3 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Upgrade to Elite
              </button>
            </div>
          )}
          </section>
        )}

        {/* SECTION 3: IMPROVED SPARK VM (ELITE ONLY — hidden on Pro) */}
        {supporterTier !== 'pro' && (
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
                  onChange={(e) => updateImprovedVM({ enabled: e.target.checked })}
                  className="accent-amber-400"
                />
                <span>{improvedVM.enabled ? 'Improved VM Active' : 'Enable Improved VM'}</span>
              </label>
            )}
          </div>

          {isElite ? (
            <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-4 text-xs">
              {/* Turbo Step Budget */}
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
                        onClick={() => updateImprovedVM({ stepBudget: budget })}
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
                      updateImprovedVM({
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

              {/* Optimization Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="p-3 rounded-md bg-[#0B0F17] border border-slate-800/90 flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!improvedVM.enabled}
                    checked={improvedVM.fastSymbolCache}
                    onChange={(e) => updateImprovedVM({ fastSymbolCache: e.target.checked })}
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
                    onChange={(e) => updateImprovedVM({ expandedLimits: e.target.checked })}
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

              {/* Live VM Runtime Telemetry Bar */}
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
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Improved SparkVM (turbo step budgets, O(1) symbol cache, 250 clones &amp; 1,200 particles) is an{' '}
                  <strong className="text-amber-300">Elite Member ($20/mo)</strong> exclusive runtime mode.
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenSupportUs}
                className="h-8 px-3 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Upgrade to Elite
              </button>
            </div>
          )}
          </section>
        )}
      </div>
    </div>
  );
};
