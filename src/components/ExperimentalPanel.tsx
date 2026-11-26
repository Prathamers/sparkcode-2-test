// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { FlaskConical } from 'lucide-react';
import type { SupporterTierId } from '../data/supporters';
import { normalizeImprovedVMConfig } from '../engine/vm';
import { normalizeWebGL2Config } from '../engine/webgl2Pipeline';
import type {
  EngineTelemetry,
  ImprovedVMConfig,
  SparkProject,
  SpriteData,
  StageSettings,
  WebGL2RenderConfig,
} from '../types/project';
import { ImprovedVMLab } from './experimental/ImprovedVMLab';
import { VectorPenLab } from './experimental/VectorPenLab';
import { WebGL2Lab } from './experimental/WebGL2Lab';

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

const TIER_NAMES: Record<SupporterTierId, string> = {
  plus: 'Plus Contributor',
  pro: 'Pro Contributor',
  elite: 'Elite Member',
};

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

  const updateWebGL2 = (patch: Partial<WebGL2RenderConfig>) => {
    if (!isElite) return;
    onChangeStage({ ...stage, webgl2: { ...webgl2, ...patch } });
  };

  const updateImprovedVM = (patch: Partial<ImprovedVMConfig>) => {
    if (!isElite) return;
    onChangeStage({ ...stage, improvedVM: { ...improvedVM, ...patch } });
  };

  const tierLabel = supporterTier ? TIER_NAMES[supporterTier] : 'Free Plan';

  return (
    <div data-testid="experimental-panel" className="flex-1 overflow-y-auto p-5 bg-[#0D121C]">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
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

        <VectorPenLab
          selectedSprite={selectedSprite}
          isProOrElite={isProOrElite}
          onChangeSprite={onChangeSprite}
          onOpenSupportUs={onOpenSupportUs}
        />

        {supporterTier !== 'pro' && (
          <>
            <WebGL2Lab
              webgl2={webgl2}
              isElite={isElite}
              renderBackend={renderBackend}
              onUpdate={updateWebGL2}
              onOpenSupportUs={onOpenSupportUs}
            />
            <ImprovedVMLab
              improvedVM={improvedVM}
              isElite={isElite}
              vmStats={vmStats}
              onUpdate={updateImprovedVM}
              onOpenSupportUs={onOpenSupportUs}
            />
          </>
        )}
      </div>
    </div>
  );
};
