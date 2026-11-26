// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import {
  floodFillPixels,
  generateProceduralBuffer,
  hexToRgb,
  rgbaBufferToDataUrl,
  type ProceduralPreset,
} from '../engine/procedural';
import type { CostumeData, CostumeLayer, SpriteData } from '../types/project';
import { CostumeFrameStrip } from './costume/CostumeFrameStrip';
import { CostumeSidePanel } from './costume/CostumeSidePanel';
import { CostumeToolRail, CostumeTopBar } from './costume/CostumeToolbar';
import {
  drawShapeOnContext,
  paintStroke,
  type DrawTool,
  type MarqueeSelection,
} from './costume/drawing';

interface CostumeEditorProps {
  sprite: SpriteData;
  onChangeSprite: (next: SpriteData, rebuildTextures?: boolean) => void;
  onOpenCostumeLibrary?: () => void;
}

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

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0D121C]">
      <CostumeTopBar
        tool={tool}
        color={color}
        brushSize={brushSize}
        brushOpacity={brushOpacity}
        textValue={textValue}
        hasSelection={Boolean(selection)}
        onionSkin={onionSkin}
        onChangeColor={setColor}
        onChangeBrushSize={setBrushSize}
        onChangeBrushOpacity={setBrushOpacity}
        onChangeTextValue={setTextValue}
        onFlip={handleFlip}
        onCopy={handleCopySelection}
        onPaste={handlePasteSelection}
        onCommitSelection={commitFloatingSelection}
        onToggleOnionSkin={() => setOnionSkin((v) => !v)}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <CostumeToolRail activeTool={tool} onSelectTool={setTool} />

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

          <CostumeFrameStrip
            costumes={sprite.costumes}
            activeIndex={costumeIdx}
            onSelectFrame={(idx) => onChangeSprite({ ...sprite, activeCostumeIndex: idx }, false)}
            onAddFrame={handleAddCostumeFrame}
            onDeleteFrame={handleDeleteCostumeFrame}
            onOpenCostumeLibrary={onOpenCostumeLibrary}
          />
        </div>

        <CostumeSidePanel
          layers={costume.layers}
          activeLayerId={activeLayerId}
          procPreset={procPreset}
          secondaryColor={secondaryColor}
          procSeed={procSeed}
          onSelectLayer={setActiveLayerId}
          onAddLayer={handleAddLayer}
          onToggleLayerVis={handleToggleLayerVis}
          onMoveLayer={handleMoveLayer}
          onDeleteLayer={handleDeleteLayer}
          onChangeProcPreset={setProcPreset}
          onChangeSecondaryColor={setSecondaryColor}
          onChangeProcSeed={setProcSeed}
          onGenerateProcedural={handleGenerateProcedural}
        />
      </div>
    </div>
  );
};
