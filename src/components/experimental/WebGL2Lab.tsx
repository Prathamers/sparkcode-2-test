// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { Sparkles } from 'lucide-react';
import type { EngineTelemetry, WebGL2RenderConfig } from '../../types/project';
import { LockedLabNotice } from './LockedLabNotice';

interface WebGL2LabProps {
  webgl2: WebGL2RenderConfig;
  isElite: boolean;
  renderBackend?: EngineTelemetry['renderBackend'];
  onUpdate: (patch: Partial<WebGL2RenderConfig>) => void;
  onOpenSupportUs: () => void;
}

export const WebGL2Lab: React.FC<WebGL2LabProps> = ({
  webgl2,
  isElite,
  renderBackend,
  onUpdate,
  onOpenSupportUs,
}) => (
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
            onClick={() => onUpdate({ backend: 'canvas2d' })}
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
            onClick={() => onUpdate({ backend: 'webgl2' })}
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
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-slate-200 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={webgl2.normalMapping}
                  onChange={(e) => onUpdate({ normalMapping: e.target.checked })}
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
                  onChange={(e) => onUpdate({ normalStrength: Number(e.target.value) })}
                  className="accent-sky-400 disabled:opacity-40"
                />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-slate-200 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={webgl2.hardwareShadows}
                  onChange={(e) => onUpdate({ hardwareShadows: e.target.checked })}
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
                  onChange={(e) => onUpdate({ shadowSoftness: Number(e.target.value) })}
                  className="accent-sky-400 disabled:opacity-40"
                />
              </label>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-800/70 flex flex-col gap-2.5">
              <label className="flex items-center gap-2 text-slate-200 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={webgl2.bloomEnabled}
                  onChange={(e) => onUpdate({ bloomEnabled: e.target.checked })}
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
                    onChange={(e) => onUpdate({ bloomThreshold: Number(e.target.value) })}
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
                    onChange={(e) => onUpdate({ bloomIntensity: Number(e.target.value) })}
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
                    onChange={(e) => onUpdate({ bloomRadius: Number(e.target.value) })}
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
      <LockedLabNotice
        ctaLabel="Upgrade to Elite"
        ctaClassName="bg-amber-500 hover:bg-amber-400 text-slate-950"
        onUnlock={onOpenSupportUs}
      >
        WebGL2 Hardware Shadow &amp; Bloom Pass is an <strong className="text-amber-300">Elite Member ($20/mo)</strong> exclusive experimental renderer. Standard 2D Canvas fallback remains active for all users.
      </LockedLabNotice>
    )}
  </section>
);
