// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Circle,
  Clipboard,
  Copy,
  Crosshair,
  Eraser,
  Eye,
  EyeOff,
  FlipHorizontal2,
  FlipVertical2,
  Hexagon,
  Layers,
  Library,
  Minus,
  MousePointer2,
  PaintBucket,
  Pencil,
  Pipette,
  Plus,
  RotateCw,
  Sparkles,
  Square,
  Trash2,
  Type,
} from 'lucide-react';
import {
  floodFillPixels,
  generateProceduralBuffer,
  hexToRgb,
  rgbaBufferToDataUrl,
  type ProceduralPreset,
} from '../engine/procedural';
import type { CostumeData, CostumeLayer, SpriteData } from '../types/project';

type DrawTool =
  | 'brush'
  | 'eraser'
  | 'line'
  | 'rect'
  | 'ellipse'
  | 'polygon'
  | 'fill'
  | 'eyedropper'
  | 'text'
  | 'marquee'
  | 'pivot';

interface MarqueeSelection {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  buffer: HTMLCanvasElement;
}

interface CostumeEditorProps {
  sprite: SpriteData;
  onChangeSprite: (next: SpriteData, rebuildTextures?: boolean) => void;
  onOpenCostumeLibrary?: () => void;
}

const PROCEDURAL_PRESETS: Array<{ id: ProceduralPreset; label: string; group: string }> = [
  { id: 'symmetry_ship', label: 'Pixel Ship', group: 'Symmetry' },
  { id: 'symmetry_bot', label: 'Pixel Bot', group: 'Symmetry' },
  { id: 'symmetry_gem', label: 'Pixel Gem', group: 'Symmetry' },
  { id: 'noise_plasma', label: 'Plasma Core', group: 'Noise' },
  { id: 'noise_nebula', label: 'Nebula Cloud', group: 'Noise' },
  { id: 'noise_stone', label: 'Stone Tile', group: 'Noise' },
  { id: 'geo_platform', label: 'Neon Platform', group: 'Geometric' },
  { id: 'geo_crystal', label: 'Energy Crystal', group: 'Geometric' },
  { id: 'geo_star', label: 'Radiant Star', group: 'Geometric' },
  { id: 'geo_drone', label: 'Scout Drone', group: 'Geometric' },
  { id: 'geo_pillar', label: 'Shadow Pillar', group: 'Geometric' },
  { id: 'geo_laser', label: 'Laser Bolt', group: 'Geometric' },
];

export const CostumeEditor: React.FC<CostumeEditorProps> = ({
  sprite,
  onChangeSprite,
  onOpenCostumeLibrary,
}) => {
  const costumeIdx = Math.min(sprite.activeCostumeIndex, Math.max(0, sprite.costumes.length - 1));
  const costume = sprite.costumes[costumeIdx];

  const [tool, setTool] = useState<DrawTool>('brush');
  const [color, setColor] = useState('#38BDF8');
  const [secondaryColor, setSecondaryColor] = useState('#1E293B');
  const [brushSize, setBrushSize] = useState(4);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [textValue, setTextValue] = useState('SPARK');
  const [activeLayerId, setActiveLayerId] = useState<string>(costume?.layers[0]?.id ?? '');
  const [onionSkin, setOnionSkin] = useState(false);

  // Procedural generator controls
  const [procPreset, setProcPreset] = useState<ProceduralPreset>('symmetry_ship');
  const [procSeed, setProcSeed] = useState(4096);

  // Selection & clipboard
  const [selection, setSelection] = useState<MarqueeSelection | null>(null);
  const clipboardRef = useRef<HTMLCanvasElement | null>(null);

  // Offscreen layer canvas cache: layerId -> HTMLCanvasElement
  const layerCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const onionPrevRef = useRef<HTMLImageElement | null>(null);
  const onionNextRef = useRef<HTMLImageElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Active pointer stroke state
  const interactionRef = useRef<{
    active: boolean;
    mode: 'draw' | 'shape' | 'marquee_create' | 'marquee_move' | 'marquee_scale' | 'marquee_rotate';
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    previewX: number;
    previewY: number;
    origSel?: { x: number; y: number; w: number; h: number; rotation: number; scaleX: number; scaleY: number };
  }>({
    active: false,
    mode: 'draw',
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    previewX: 0,
    previewY: 0,
  });

  // Keep activeLayerId valid when switching sprites/costumes
  useEffect(() => {
    if (!costume) return;
    if (!costume.layers.some((l) => l.id === activeLayerId)) {
      setActiveLayerId(costume.layers[costume.layers.length - 1]?.id ?? '');
    }
    setSelection(null);
  }, [sprite.id, costumeIdx, costume, activeLayerId]);

  const drawComposite = useCallback(() => {
    const canvas = displayCanvasRef.current;
    if (!canvas || !costume) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewSize = 360;
    const scaleX = viewSize / costume.width;
    const scaleY = viewSize / costume.height;
    const scale = Math.min(scaleX, scaleY);
    const drawW = costume.width * scale;
    const drawH = costume.height * scale;
    const offsetX = (viewSize - drawW) / 2;
    const offsetY = (viewSize - drawH) / 2;

    if (canvas.width !== Math.round(viewSize * dpr) || canvas.height !== Math.round(viewSize * dpr)) {
      canvas.width = Math.round(viewSize * dpr);
      canvas.height = Math.round(viewSize * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, viewSize, viewSize);

    // Subtle canvas frame
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX - 0.5, offsetY - 0.5, drawW + 1, drawH + 1);

    ctx.imageSmoothingEnabled = costume.width > 96;

    // Onion skinning (previous frame red tint, next frame cyan tint)
    if (onionSkin) {
      if (onionPrevRef.current) {
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.drawImage(onionPrevRef.current, offsetX, offsetY, drawW, drawH);
        ctx.restore();
      }
      if (onionNextRef.current) {
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.drawImage(onionNextRef.current, offsetX, offsetY, drawW, drawH);
        ctx.restore();
      }
    }

    // Draw each visible layer in order
    for (const layer of costume.layers) {
      if (!layer.visible) continue;
      const lc = layerCanvasesRef.current.get(layer.id);
      if (!lc) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));
      ctx.drawImage(lc, offsetX, offsetY, drawW, drawH);
      ctx.restore();
    }

    // Live shape preview while dragging
    const inter = interactionRef.current;
    if (inter.active && inter.mode === 'shape') {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.globalAlpha = brushOpacity;
      ctx.lineWidth = Math.max(1, brushSize);
      drawShapeOnContext(ctx, tool, inter.startX, inter.startY, inter.previewX, inter.previewY);
      ctx.restore();
    }

    // Marquee creation rectangle preview
    if (inter.active && inter.mode === 'marquee_create') {
      const rx = offsetX + Math.min(inter.startX, inter.previewX) * scale;
      const ry = offsetY + Math.min(inter.startY, inter.previewY) * scale;
      const rw = Math.abs(inter.previewX - inter.startX) * scale;
      const rh = Math.abs(inter.previewY - inter.startY) * scale;
      ctx.save();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.restore();
    }

    // Active floating marquee selection + transform gizmos
    if (selection) {
      const cx = offsetX + (selection.x + selection.w / 2) * scale;
      const cy = offsetY + (selection.y + selection.h / 2) * scale;
      const sw = selection.w * scale;
      const sh = selection.h * scale;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((selection.rotation * Math.PI) / 180);
      ctx.scale(selection.scaleX, selection.scaleY);
      ctx.drawImage(selection.buffer, -sw / 2, -sh / 2, sw, sh);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);
      ctx.setLineDash([]);

      // Scale handle (bottom-right)
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(sw / 2 - 4, sh / 2 - 4, 8, 8);

      // Rotate handle (top-center stem)
      ctx.beginPath();
      ctx.moveTo(0, -sh / 2);
      ctx.lineTo(0, -sh / 2 - 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -sh / 2 - 16, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Interactive Pivot / Origin Point Crosshair
    const px = offsetX + costume.pivotX * drawW;
    const py = offsetY + costume.pivotY * drawH;
    ctx.save();
    ctx.strokeStyle = tool === 'pivot' ? '#FACC15' : 'rgba(250, 204, 21, 0.72)';
    ctx.lineWidth = tool === 'pivot' ? 2 : 1.25;
    ctx.beginPath();
    ctx.moveTo(px - 10, py);
    ctx.lineTo(px + 10, py);
    ctx.moveTo(px, py - 10);
    ctx.lineTo(px, py + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }, [costume, onionSkin, color, brushOpacity, brushSize, tool, selection]);

  // Hydrate offscreen layer canvases whenever costume layers change
  useEffect(() => {
    if (!costume) return;
    let cancelled = false;
    const map = layerCanvasesRef.current;

    for (const layer of costume.layers) {
      let lc = map.get(layer.id);
      if (!lc || lc.width !== costume.width || lc.height !== costume.height) {
        lc = document.createElement('canvas');
        lc.width = costume.width;
        lc.height = costume.height;
        map.set(layer.id, lc);
      }
      const lctx = lc.getContext('2d');
      if (!lctx) continue;
      if (layer.dataUrl) {
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          lctx.clearRect(0, 0, costume.width, costume.height);
          lctx.drawImage(img, 0, 0, costume.width, costume.height);
          drawComposite();
        };
        img.src = layer.dataUrl;
      } else {
        lctx.clearRect(0, 0, costume.width, costume.height);
      }
    }

    // Load onion skin neighbor frames
    const prevCostume = sprite.costumes[costumeIdx - 1];
    const nextCostume = sprite.costumes[costumeIdx + 1];
    if (prevCostume?.previewUrl) {
      const img = new Image();
      img.onload = () => {
        onionPrevRef.current = img;
        drawComposite();
      };
      img.src = prevCostume.previewUrl;
    } else {
      onionPrevRef.current = null;
    }
    if (nextCostume?.previewUrl) {
      const img = new Image();
      img.onload = () => {
        onionNextRef.current = img;
        drawComposite();
      };
      img.src = nextCostume.previewUrl;
    } else {
      onionNextRef.current = null;
    }

    drawComposite();
    return () => {
      cancelled = true;
    };
  }, [costume, costumeIdx, sprite.costumes, drawComposite]);

  const commitLayersToProject = useCallback(
    (updatedCostumeOverride?: CostumeData) => {
      const target = updatedCostumeOverride ?? costume;
      if (!target) return;

      const flatCanvas = document.createElement('canvas');
      flatCanvas.width = target.width;
      flatCanvas.height = target.height;
      const flatCtx = flatCanvas.getContext('2d');

      const nextLayers: CostumeLayer[] = target.layers.map((layer) => {
        const lc = layerCanvasesRef.current.get(layer.id);
        const dataUrl = lc ? lc.toDataURL('image/png') : layer.dataUrl;
        if (flatCtx && layer.visible && lc) {
          flatCtx.save();
          flatCtx.globalAlpha = layer.opacity;
          flatCtx.drawImage(lc, 0, 0);
          flatCtx.restore();
        }
        return { ...layer, dataUrl };
      });

      const previewUrl = flatCanvas.toDataURL('image/png');
      const nextCostume: CostumeData = { ...target, layers: nextLayers, previewUrl };
      const nextCostumes = sprite.costumes.map((c, idx) => (idx === costumeIdx ? nextCostume : c));
      onChangeSprite({ ...sprite, costumes: nextCostumes }, true);
    },
    [costume, costumeIdx, onChangeSprite, sprite]
  );

  const commitFloatingSelection = useCallback(() => {
    if (!selection || !costume) return;
    const lc = layerCanvasesRef.current.get(activeLayerId);
    const lctx = lc?.getContext('2d');
    if (lctx) {
      const cx = selection.x + selection.w / 2;
      const cy = selection.y + selection.h / 2;
      lctx.save();
      lctx.translate(cx, cy);
      lctx.rotate((selection.rotation * Math.PI) / 180);
      lctx.scale(selection.scaleX, selection.scaleY);
      lctx.drawImage(selection.buffer, -selection.w / 2, -selection.h / 2, selection.w, selection.h);
      lctx.restore();
    }
    setSelection(null);
    drawComposite();
    commitLayersToProject();
  }, [selection, costume, activeLayerId, drawComposite, commitLayersToProject]);

  const toCostumeCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = displayCanvasRef.current;
    if (!canvas || !costume) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const viewSize = 360;
    const scale = Math.min(viewSize / costume.width, viewSize / costume.height);
    const drawW = costume.width * scale;
    const drawH = costume.height * scale;
    const offsetX = (viewSize - drawW) / 2;
    const offsetY = (viewSize - drawH) / 2;

    const vx = ((clientX - rect.left) / rect.width) * viewSize;
    const vy = ((clientY - rect.top) / rect.height) * viewSize;
    return {
      x: (vx - offsetX) / scale,
      y: (vy - offsetY) / scale,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!costume) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = toCostumeCoords(e.clientX, e.clientY);

    if (tool === 'pivot') {
      const nextPivotX = Math.max(0, Math.min(1, x / costume.width));
      const nextPivotY = Math.max(0, Math.min(1, y / costume.height));
      const updated = { ...costume, pivotX: Number(nextPivotX.toFixed(2)), pivotY: Number(nextPivotY.toFixed(2)) };
      const nextCostumes = sprite.costumes.map((c, idx) => (idx === costumeIdx ? updated : c));
      onChangeSprite({ ...sprite, costumes: nextCostumes }, false);
      return;
    }

    const lc = layerCanvasesRef.current.get(activeLayerId);
    const lctx = lc?.getContext('2d');
    if (!lc || !lctx) return;

    if (tool === 'eyedropper') {
      const px = Math.max(0, Math.min(costume.width - 1, Math.floor(x)));
      const py = Math.max(0, Math.min(costume.height - 1, Math.floor(y)));
      const d = lctx.getImageData(px, py, 1, 1).data;
      if (d[3] > 0) {
        const hex = `#${[d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
        setColor(hex);
      }
      return;
    }

    if (tool === 'fill') {
      const imgData = lctx.getImageData(0, 0, costume.width, costume.height);
      const [r, g, b] = hexToRgb(color);
      const filled = floodFillPixels(
        imgData.data,
        costume.width,
        costume.height,
        x,
        y,
        [r, g, b, Math.round(brushOpacity * 255)]
      );
      if (filled) {
        lctx.putImageData(imgData, 0, 0);
        drawComposite();
        commitLayersToProject();
      }
      return;
    }

    if (tool === 'text') {
      lctx.save();
      lctx.globalAlpha = brushOpacity;
      lctx.fillStyle = color;
      const fontSize = Math.max(8, Math.round(brushSize * 3));
      lctx.font = `700 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
      lctx.textBaseline = 'middle';
      lctx.fillText(textValue || 'SPARK', x, y);
      lctx.restore();
      drawComposite();
      commitLayersToProject();
      return;
    }

    if (tool === 'marquee') {
      if (selection) {
        const cx = selection.x + selection.w / 2;
        const cy = selection.y + selection.h / 2;
        const scaleHandleX = selection.x + selection.w;
        const scaleHandleY = selection.y + selection.h;
        const rotHandleX = cx;
        const rotHandleY = selection.y - 6;

        if (Math.hypot(x - rotHandleX, y - rotHandleY) < Math.max(5, costume.width * 0.1)) {
          interactionRef.current = {
            active: true,
            mode: 'marquee_rotate',
            startX: x,
            startY: y,
            lastX: x,
            lastY: y,
            previewX: x,
            previewY: y,
            origSel: { ...selection },
          };
          return;
        }
        if (Math.hypot(x - scaleHandleX, y - scaleHandleY) < Math.max(5, costume.width * 0.1)) {
          interactionRef.current = {
            active: true,
            mode: 'marquee_scale',
            startX: x,
            startY: y,
            lastX: x,
            lastY: y,
            previewX: x,
            previewY: y,
            origSel: { ...selection },
          };
          return;
        }
        if (x >= selection.x && x <= selection.x + selection.w && y >= selection.y && y <= selection.y + selection.h) {
          interactionRef.current = {
            active: true,
            mode: 'marquee_move',
            startX: x,
            startY: y,
            lastX: x,
            lastY: y,
            previewX: x,
            previewY: y,
            origSel: { ...selection },
          };
          return;
        }
        // Clicked outside selection: commit it first
        commitFloatingSelection();
      }
      interactionRef.current = {
        active: true,
        mode: 'marquee_create',
        startX: x,
        startY: y,
        lastX: x,
        lastY: y,
        previewX: x,
        previewY: y,
      };
      return;
    }

    if (selection) {
      commitFloatingSelection();
    }

    if (tool === 'brush' || tool === 'eraser') {
      interactionRef.current = {
        active: true,
        mode: 'draw',
        startX: x,
        startY: y,
        lastX: x,
        lastY: y,
        previewX: x,
        previewY: y,
      };
      paintStroke(lctx, x, y, x + 0.01, y + 0.01, tool === 'eraser', color, brushSize, brushOpacity);
      drawComposite();
      return;
    }

    // Shape tools: line, rect, ellipse, polygon
    interactionRef.current = {
      active: true,
      mode: 'shape',
      startX: x,
      startY: y,
      lastX: x,
      lastY: y,
      previewX: x,
      previewY: y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const inter = interactionRef.current;
    if (!inter.active || !costume) return;
    const { x, y } = toCostumeCoords(e.clientX, e.clientY);

    if (inter.mode === 'draw') {
      const lc = layerCanvasesRef.current.get(activeLayerId);
      const lctx = lc?.getContext('2d');
      if (lctx) {
        paintStroke(lctx, inter.lastX, inter.lastY, x, y, tool === 'eraser', color, brushSize, brushOpacity);
      }
      inter.lastX = x;
      inter.lastY = y;
      drawComposite();
      return;
    }

    if (inter.mode === 'shape' || inter.mode === 'marquee_create') {
      inter.previewX = x;
      inter.previewY = y;
      drawComposite();
      return;
    }

    if (selection && inter.origSel) {
      if (inter.mode === 'marquee_move') {
        const dx = x - inter.startX;
        const dy = y - inter.startY;
        setSelection((prev) => (prev ? { ...prev, x: inter.origSel!.x + dx, y: inter.origSel!.y + dy } : null));
      } else if (inter.mode === 'marquee_scale') {
        const nw = Math.max(4, inter.origSel.w + (x - inter.startX));
        const nh = Math.max(4, inter.origSel.h + (y - inter.startY));
        setSelection((prev) => (prev ? { ...prev, w: nw, h: nh } : null));
      } else if (inter.mode === 'marquee_rotate') {
        const cx = inter.origSel.x + inter.origSel.w / 2;
        const cy = inter.origSel.y + inter.origSel.h / 2;
        const angle = (Math.atan2(y - cy, x - cx) * 180) / Math.PI + 90;
        setSelection((prev) => (prev ? { ...prev, rotation: Math.round(angle) } : null));
      }
    }
  };

  const handlePointerUp = () => {
    const inter = interactionRef.current;
    if (!inter.active || !costume) return;
    inter.active = false;

    const lc = layerCanvasesRef.current.get(activeLayerId);
    const lctx = lc?.getContext('2d');

    if (inter.mode === 'shape' && lctx) {
      lctx.save();
      lctx.strokeStyle = color;
      lctx.fillStyle = color;
      lctx.globalAlpha = brushOpacity;
      lctx.lineWidth = Math.max(1, brushSize);
      drawShapeOnContext(lctx, tool, inter.startX, inter.startY, inter.previewX, inter.previewY);
      lctx.restore();
      drawComposite();
      commitLayersToProject();
    } else if (inter.mode === 'draw') {
      commitLayersToProject();
    } else if (inter.mode === 'marquee_create' && lc && lctx) {
      const rx = Math.max(0, Math.floor(Math.min(inter.startX, inter.previewX)));
      const ry = Math.max(0, Math.floor(Math.min(inter.startY, inter.previewY)));
      const rw = Math.min(costume.width - rx, Math.ceil(Math.abs(inter.previewX - inter.startX)));
      const rh = Math.min(costume.height - ry, Math.ceil(Math.abs(inter.previewY - inter.startY)));
      if (rw >= 3 && rh >= 3) {
        const buf = document.createElement('canvas');
        buf.width = rw;
        buf.height = rh;
        buf.getContext('2d')?.drawImage(lc, rx, ry, rw, rh, 0, 0, rw, rh);
        lctx.clearRect(rx, ry, rw, rh);
        setSelection({ x: rx, y: ry, w: rw, h: rh, rotation: 0, scaleX: 1, scaleY: 1, buffer: buf });
      }
      drawComposite();
    }
  };

  const handleFlip = (axis: 'h' | 'v') => {
    if (selection) {
      setSelection((prev) =>
        prev
          ? {
              ...prev,
              scaleX: axis === 'h' ? prev.scaleX * -1 : prev.scaleX,
              scaleY: axis === 'v' ? prev.scaleY * -1 : prev.scaleY,
            }
          : null
      );
      return;
    }
    const lc = layerCanvasesRef.current.get(activeLayerId);
    const lctx = lc?.getContext('2d');
    if (!lc || !lctx || !costume) return;
    const temp = document.createElement('canvas');
    temp.width = lc.width;
    temp.height = lc.height;
    temp.getContext('2d')?.drawImage(lc, 0, 0);
    lctx.save();
    lctx.clearRect(0, 0, lc.width, lc.height);
    lctx.translate(axis === 'h' ? lc.width : 0, axis === 'v' ? lc.height : 0);
    lctx.scale(axis === 'h' ? -1 : 1, axis === 'v' ? -1 : 1);
    lctx.drawImage(temp, 0, 0);
    lctx.restore();
    drawComposite();
    commitLayersToProject();
  };

  const handleCopySelection = () => {
    if (selection) {
      const copy = document.createElement('canvas');
      copy.width = selection.buffer.width;
      copy.height = selection.buffer.height;
      copy.getContext('2d')?.drawImage(selection.buffer, 0, 0);
      clipboardRef.current = copy;
    } else {
      const lc = layerCanvasesRef.current.get(activeLayerId);
      if (!lc) return;
      const copy = document.createElement('canvas');
      copy.width = lc.width;
      copy.height = lc.height;
      copy.getContext('2d')?.drawImage(lc, 0, 0);
      clipboardRef.current = copy;
    }
  };

  const handlePasteSelection = () => {
    if (!clipboardRef.current || !costume) return;
    if (selection) commitFloatingSelection();
    const buf = document.createElement('canvas');
    buf.width = clipboardRef.current.width;
    buf.height = clipboardRef.current.height;
    buf.getContext('2d')?.drawImage(clipboardRef.current, 0, 0);
    setSelection({
      x: Math.max(0, (costume.width - buf.width) / 2),
      y: Math.max(0, (costume.height - buf.height) / 2),
      w: buf.width,
      h: buf.height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      buffer: buf,
    });
    setTool('marquee');
  };

  const handleGenerateProcedural = () => {
    if (!costume) return;
    const lc = layerCanvasesRef.current.get(activeLayerId);
    const lctx = lc?.getContext('2d');
    if (!lc || !lctx) return;

    const buf = generateProceduralBuffer({
      preset: procPreset,
      width: costume.width,
      height: costume.height,
      seed: procSeed,
      primaryColor: color,
      secondaryColor,
      accentColor: '#F8FAFC',
    });
    const imgData = new ImageData(new Uint8ClampedArray(buf.data), buf.width, buf.height);
    lctx.clearRect(0, 0, costume.width, costume.height);
    lctx.putImageData(imgData, 0, 0);
    setProcSeed((s) => s + 137);
    drawComposite();
    commitLayersToProject();
  };

  // Layer management
  const handleAddLayer = () => {
    if (!costume) return;
    const newLayer: CostumeLayer = {
      id: `lyr_${Date.now().toString(36)}`,
      name: `Layer ${costume.layers.length + 1}`,
      visible: true,
      opacity: 1,
      dataUrl: '',
    };
    const nextCostume = { ...costume, layers: [...costume.layers, newLayer] };
    setActiveLayerId(newLayer.id);
    commitLayersToProject(nextCostume);
  };

  const handleDeleteLayer = (layerId: string) => {
    if (!costume || costume.layers.length <= 1) return;
    const remaining = costume.layers.filter((l) => l.id !== layerId);
    layerCanvasesRef.current.delete(layerId);
    if (activeLayerId === layerId) {
      setActiveLayerId(remaining[remaining.length - 1].id);
    }
    commitLayersToProject({ ...costume, layers: remaining });
  };

  const handleMoveLayer = (layerId: string, dir: -1 | 1) => {
    if (!costume) return;
    const idx = costume.layers.findIndex((l) => l.id === layerId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= costume.layers.length) return;
    const reordered = [...costume.layers];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(target, 0, moved);
    commitLayersToProject({ ...costume, layers: reordered });
  };

  const handleToggleLayerVis = (layerId: string) => {
    if (!costume) return;
    const nextLayers = costume.layers.map((l) =>
      l.id === layerId ? { ...l, visible: !l.visible } : l
    );
    commitLayersToProject({ ...costume, layers: nextLayers });
  };

  // Costume Frame management
  const handleAddCostumeFrame = () => {
    const buf = generateProceduralBuffer({
      preset: 'symmetry_bot',
      width: 48,
      height: 48,
      seed: Math.floor(Math.random() * 9999),
      primaryColor: color,
      secondaryColor,
    });
    const url = rgbaBufferToDataUrl(buf);
    const nextCostume: CostumeData = {
      id: `cos_${Date.now().toString(36)}`,
      name: `Frame ${sprite.costumes.length + 1}`,
      width: 48,
      height: 48,
      pivotX: 0.5,
      pivotY: 0.5,
      layers: [{ id: `lyr_${Date.now().toString(36)}`, name: 'Base Layer', visible: true, opacity: 1, dataUrl: url }],
      previewUrl: url,
    };
    const nextCostumes = [...sprite.costumes, nextCostume];
    onChangeSprite({ ...sprite, costumes: nextCostumes, activeCostumeIndex: nextCostumes.length - 1 }, true);
  };

  const handleDeleteCostumeFrame = (idx: number) => {
    if (sprite.costumes.length <= 1) return;
    const nextCostumes = sprite.costumes.filter((_, i) => i !== idx);
    onChangeSprite(
      { ...sprite, costumes: nextCostumes, activeCostumeIndex: Math.min(idx, nextCostumes.length - 1) },
      true
    );
  };

  if (!costume) return null;

  const toolItems: Array<{ id: DrawTool; label: string; icon: React.ReactNode }> = [
    { id: 'brush', label: 'Brush', icon: <Pencil className="w-3.5 h-3.5" /> },
    { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-3.5 h-3.5" /> },
    { id: 'line', label: 'Line', icon: <Minus className="w-3.5 h-3.5" /> },
    { id: 'rect', label: 'Rectangle', icon: <Square className="w-3.5 h-3.5" /> },
    { id: 'ellipse', label: 'Ellipse', icon: <Circle className="w-3.5 h-3.5" /> },
    { id: 'polygon', label: 'Polygon', icon: <Hexagon className="w-3.5 h-3.5" /> },
    { id: 'fill', label: 'Fill Bucket', icon: <PaintBucket className="w-3.5 h-3.5" /> },
    { id: 'eyedropper', label: 'Eyedropper', icon: <Pipette className="w-3.5 h-3.5" /> },
    { id: 'text', label: 'Text Tool', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'marquee', label: 'Marquee & Transform', icon: <MousePointer2 className="w-3.5 h-3.5" /> },
    { id: 'pivot', label: 'Pivot / Origin Point', icon: <Crosshair className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0D121C]">
      {/* Top Costume Toolbar */}
      <div className="px-3 py-2 bg-[#101623] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="flex items-center gap-1.5 text-slate-400">
            <span>Color</span>
            <input
              type="color"
              aria-label="Primary brush color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
            />
          </label>
          <label className="flex items-center gap-1.5 text-slate-400">
            <span>Size</span>
            <input
              type="range"
              aria-label="Brush size"
              min={1}
              max={16}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-16 accent-sky-400"
            />
            <span className="font-mono tabular-nums text-slate-200 w-5">{brushSize}</span>
          </label>
          <label className="flex items-center gap-1.5 text-slate-400">
            <span>Alpha</span>
            <input
              type="range"
              aria-label="Brush opacity"
              min={0.1}
              max={1}
              step={0.1}
              value={brushOpacity}
              onChange={(e) => setBrushOpacity(Number(e.target.value))}
              className="w-14 accent-sky-400"
            />
            <span className="font-mono tabular-nums text-slate-200">{Math.round(brushOpacity * 100)}%</span>
          </label>
          {tool === 'text' && (
            <input
              type="text"
              aria-label="Text stamp value"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              className="h-7 w-24 px-2 rounded bg-slate-900 border border-slate-700 text-xs text-white"
              placeholder="Text..."
            />
          )}
        </div>

        {/* Transform & Onion Skinning Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleFlip('h')}
            aria-label="Flip horizontal"
            title="Flip Horizontal"
            className="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <FlipHorizontal2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleFlip('v')}
            aria-label="Flip vertical"
            title="Flip Vertical"
            className="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <FlipVertical2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopySelection}
            aria-label="Copy selection"
            title="Copy"
            className="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handlePasteSelection}
            aria-label="Paste selection"
            title="Paste"
            className="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <Clipboard className="w-3.5 h-3.5" />
          </button>
          {selection && (
            <button
              type="button"
              onClick={commitFloatingSelection}
              className="h-7 px-2.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer whitespace-nowrap"
            >
              Apply Transform
            </button>
          )}
          <button
            type="button"
            onClick={() => setOnionSkin((v) => !v)}
            className={`h-7 px-2.5 rounded text-[11px] font-medium cursor-pointer whitespace-nowrap transition-colors ${
              onionSkin
                ? 'bg-sky-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Onion Skin
          </button>
        </div>
      </div>

      {/* Main Editor Body: Left Tool Strip | Center Canvas | Right Layers & Procedural */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Vertical Tool Strip */}
        <div className="w-11 shrink-0 bg-[#0F1522] border-r border-slate-800/80 py-2 flex flex-col items-center gap-1 overflow-y-auto">
          {toolItems.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              title={item.label}
              onClick={() => setTool(item.id)}
              className={`w-8 h-8 rounded-md inline-flex items-center justify-center transition-colors cursor-pointer ${
                tool === item.id
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>

        {/* Center High-DPI Canvas + Frame Strip */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto">
            <div className="relative rounded-lg border border-slate-700/80 overflow-hidden spark-checker-bg shadow-lg">
              <canvas
                ref={displayCanvasRef}
                data-testid="costume-canvas"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{ width: 360, height: 360 }}
                className="block cursor-crosshair touch-none"
              />
            </div>
            <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400 font-mono tabular-nums">
              <span>
                {costume.width}×{costume.height}px
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Pivot ({costume.pivotX.toFixed(2)}, {costume.pivotY.toFixed(2)})
              </span>
              {selection && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-sky-300 inline-flex items-center gap-1">
                    <RotateCw className="w-3 h-3" /> {selection.rotation}°
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Bottom Costume Frames Strip */}
          <div className="h-20 shrink-0 px-3 bg-[#101623] border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
            {sprite.costumes.map((c, idx) => (
              <div
                key={c.id}
                className={`relative shrink-0 w-16 h-14 rounded-md border p-1 flex flex-col items-center justify-center transition-colors ${
                  idx === costumeIdx
                    ? 'border-sky-400 bg-sky-500/15'
                    : 'border-slate-800 bg-[#151D2D] hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onChangeSprite({ ...sprite, activeCostumeIndex: idx }, false)}
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                >
                  {c.previewUrl ? (
                    <img
                      src={c.previewUrl}
                      alt={c.name}
                      className="w-8 h-8 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-slate-800 rounded" />
                  )}
                  <span className="text-[10px] text-slate-300 truncate max-w-[54px]">{c.name}</span>
                </button>
                {sprite.costumes.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Delete costume ${c.name}`}
                    onClick={() => handleDeleteCostumeFrame(idx)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddCostumeFrame}
              className="shrink-0 w-16 h-14 rounded-md border border-dashed border-slate-700 hover:border-sky-400 text-slate-400 hover:text-sky-300 flex flex-col items-center justify-center gap-0.5 text-[10px] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Frame</span>
            </button>
            {onOpenCostumeLibrary && (
              <button
                type="button"
                onClick={onOpenCostumeLibrary}
                title="Choose Costume from Asset Library"
                className="shrink-0 w-16 h-14 rounded-md border border-emerald-500/40 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium cursor-pointer"
              >
                <Library className="w-3.5 h-3.5" />
                <span>Library</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Panel: Layers + Procedural Texture Generator */}
        <div className="w-[228px] shrink-0 bg-[#101623] border-l border-slate-800/80 flex flex-col overflow-y-auto divide-y divide-slate-800/80">
          {/* Layer Stack */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Layers ({costume.layers.length})</span>
              </div>
              <button
                type="button"
                aria-label="Add costume layer"
                onClick={handleAddLayer}
                className="h-6 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {[...costume.layers].reverse().map((layer) => {
                const isSelected = layer.id === activeLayerId;
                return (
                  <div
                    key={layer.id}
                    className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded text-xs border transition-colors ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500/50 text-white'
                        : 'bg-[#161E2E] border-slate-800 text-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveLayerId(layer.id)}
                      className="flex-1 text-left truncate cursor-pointer"
                    >
                      {layer.name}
                    </button>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        aria-label={`Toggle visibility for ${layer.name}`}
                        onClick={() => handleToggleLayerVis(layer.id)}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${layer.name} up`}
                        onClick={() => handleMoveLayer(layer.id, 1)}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${layer.name} down`}
                        onClick={() => handleMoveLayer(layer.id, -1)}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      {costume.layers.length > 1 && (
                        <button
                          type="button"
                          aria-label={`Delete ${layer.name}`}
                          onClick={() => handleDeleteLayer(layer.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Procedural / Algorithmic Texture Generator */}
          <div className="p-3 flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Procedural Generator</span>
            </div>
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              <span>Algorithm Preset</span>
              <select
                aria-label="Procedural texture preset"
                value={procPreset}
                onChange={(e) => setProcPreset(e.target.value as ProceduralPreset)}
                className="h-7.5 px-2 rounded bg-[#161E2E] border border-slate-700 text-xs text-slate-100"
              >
                {PROCEDURAL_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.group}: {p.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-[11px] text-slate-400">
                <span>Secondary</span>
                <input
                  type="color"
                  aria-label="Procedural secondary color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-full h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] text-slate-400">
                <span>Seed</span>
                <input
                  type="number"
                  aria-label="Procedural seed"
                  value={procSeed}
                  onChange={(e) => setProcSeed(Number(e.target.value) || 1)}
                  className="h-7 px-2 rounded bg-[#161E2E] border border-slate-700 text-xs font-mono text-slate-100"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleGenerateProcedural}
              className="h-8 rounded-md bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Generate on Active Layer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function paintStroke(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  isEraser: boolean,
  color: string,
  size: number,
  opacity: number
): void {
  ctx.save();
  ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
  ctx.globalAlpha = isEraser ? 1 : opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawShapeOnContext(
  ctx: CanvasRenderingContext2D,
  tool: DrawTool,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  ctx.beginPath();
  if (tool === 'line') {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  } else if (tool === 'rect') {
    ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
  } else if (tool === 'ellipse') {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const rx = Math.max(1, Math.abs(x2 - x1) / 2);
    const ry = Math.max(1, Math.abs(y2 - y1) / 2);
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (tool === 'polygon') {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const rad = Math.max(2, Math.hypot(x2 - x1, y2 - y1) / 2);
    const sides = 6;
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
}
