// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, PenTool, Trash2, Undo2 } from 'lucide-react';
import type { CostumeData, SpriteData } from '../../types/project';
import { LockedLabNotice } from './LockedLabNotice';

interface VectorPenLabProps {
  selectedSprite: SpriteData;
  isProOrElite: boolean;
  onChangeSprite: (next: SpriteData, rebuildTextures?: boolean) => void;
  onOpenSupportUs: () => void;
}

interface PenPoint {
  x: number;
  y: number;
}

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
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(px(points[i]), py(points[i]));
    if (opts.closed) ctx.closePath();
  } else if (opts.closed) {
    const len = points.length;
    ctx.moveTo((px(points[len - 1]) + px(points[0])) * 0.5, (py(points[len - 1]) + py(points[0])) * 0.5);
    for (let i = 0; i < len; i += 1) {
      const curr = points[i];
      const next = points[(i + 1) % len];
      ctx.quadraticCurveTo(px(curr), py(curr), (px(curr) + px(next)) * 0.5, (py(curr) + py(next)) * 0.5);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(px(points[0]), py(points[0]));
    for (let i = 1; i < points.length - 1; i += 1) {
      const curr = points[i];
      const next = points[i + 1];
      ctx.quadraticCurveTo(px(curr), py(curr), (px(curr) + px(next)) * 0.5, (py(curr) + py(next)) * 0.5);
    }
    const last = points[points.length - 1];
    ctx.lineTo(px(last), py(last));
  }

  if (opts.closed && points.length >= 3) ctx.fill();
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

export const VectorPenLab: React.FC<VectorPenLabProps> = ({
  selectedSprite,
  isProOrElite,
  onChangeSprite,
  onOpenSupportUs,
}) => {
  const activeCostume =
    selectedSprite.costumes[selectedSprite.activeCostumeIndex] ?? selectedSprite.costumes[0];

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

  useEffect(() => {
    const canvas = penCanvasRef.current;
    if (!canvas || !isProOrElite) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (costumeBgImage) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 0.72;
      ctx.drawImage(costumeBgImage, 0, 0, w, h);
      ctx.restore();
    }

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

    const costumeW = Math.max(16, activeCostume?.width ?? 48);
    drawVectorPath(ctx, points, w, h, {
      smooth: smoothPath,
      closed: closedPath,
      strokeColor,
      fillColor,
      strokeWidth: Math.max(1.5, (strokeWidth / costumeW) * w),
      opacity: pathOpacity,
    });

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

    points.forEach((pt, idx) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x * w, pt.y * h, idx === 0 ? 5.5 : 4.5, 0, Math.PI * 2);
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
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width))),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height))),
    };
  };

  const handlePenPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isProOrElite) return;
    const pt = getNormalizedPoint(e);
    const hitIdx = points.findIndex((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < 0.045);
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
    const targetLayerIdx = Math.max(0, activeCostume.layers.findIndex((l) => l.visible));
    const layer = activeCostume.layers[targetLayerIdx];
    if (!layer) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = Math.max(1, activeCostume.width);
    offscreen.height = Math.max(1, activeCostume.height);
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    if (layer.dataUrl) {
      const existing = await loadImage(layer.dataUrl);
      if (existing) ctx.drawImage(existing, 0, 0, offscreen.width, offscreen.height);
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
    const draftCostume: CostumeData = {
      ...activeCostume,
      layers: activeCostume.layers.map((l, idx) =>
        idx === targetLayerIdx ? { ...l, dataUrl: nextLayerDataUrl } : l
      ),
    };
    const nextPreview = await compositeCostumePreview(draftCostume);
    const finalCostume: CostumeData = { ...draftCostume, previewUrl: nextPreview };

    onChangeSprite(
      {
        ...selectedSprite,
        costumes: selectedSprite.costumes.map((c, idx) =>
          idx === targetCostumeIdx ? finalCostume : c
        ),
      },
      true
    );
    setPoints([]);
    setStampFeedback(`Stamped vector path onto "${selectedSprite.name}" (${activeCostume.name})`);
  };

  return (
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
        <LockedLabNotice
          ctaLabel="Unlock with Pro or Elite"
          ctaClassName="bg-emerald-600 hover:bg-emerald-500 text-white"
          onUnlock={onOpenSupportUs}
        >
          The Experimental Vector Pen Tool requires a <strong className="text-slate-100">Pro Contributor ($10/mo)</strong> or{' '}
          <strong className="text-amber-300">Elite Member ($20/mo)</strong> membership and is available exclusively in this Experimental tab.
        </LockedLabNotice>
      )}
    </section>
  );
};
