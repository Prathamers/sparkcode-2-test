// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface WorkspaceZoomControlsProps {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onZoomIn: () => void;
}

export const WorkspaceZoomControls: React.FC<WorkspaceZoomControlsProps> = ({
  zoom,
  minZoom,
  maxZoom,
  onZoomOut,
  onResetZoom,
  onZoomIn,
}) => (
  <div
    role="group"
    aria-label="Workspace zoom controls"
    className="absolute bottom-4 right-4 z-30 flex items-center gap-0.5 p-1 rounded-lg bg-[#0E1420]/95 border border-slate-700/90 shadow-lg backdrop-blur-sm"
  >
    <button
      type="button"
      onClick={onZoomOut}
      disabled={zoom <= minZoom}
      aria-label="Zoom out"
      title="Zoom out"
      className="w-7 h-7 rounded-md inline-flex items-center justify-center text-slate-200 hover:bg-slate-800 hover:text-white disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
    >
      <ZoomOut className="w-3.5 h-3.5" />
    </button>
    <button
      type="button"
      onClick={onResetZoom}
      aria-label="Reset zoom to 100%"
      title="Reset zoom to 100%"
      className="h-7 min-w-[3.1rem] px-1.5 rounded-md font-mono text-[11px] font-medium tabular-nums text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
    >
      {Math.round(zoom * 100)}%
    </button>
    <button
      type="button"
      onClick={onZoomIn}
      disabled={zoom >= maxZoom}
      aria-label="Zoom in"
      title="Zoom in"
      className="w-7 h-7 rounded-md inline-flex items-center justify-center text-slate-200 hover:bg-slate-800 hover:text-white disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
    >
      <ZoomIn className="w-3.5 h-3.5" />
    </button>
  </div>
);
