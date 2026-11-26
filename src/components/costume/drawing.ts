// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ProceduralPreset } from '../../engine/procedural';

export type DrawTool =
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

export interface MarqueeSelection {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  buffer: HTMLCanvasElement;
}

export const PROCEDURAL_PRESETS: Array<{ id: ProceduralPreset; label: string; group: string }> = [
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

export function paintStroke(
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

export function drawShapeOnContext(
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
