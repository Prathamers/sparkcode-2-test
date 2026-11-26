// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { ChevronUp, ShieldCheck } from 'lucide-react';
import {
  ROADMAP_ITEMS,
  SUPPORTER_TIERS,
  type BillingCycle,
  type EliteSupporter,
  type SupporterTierId,
} from '../../data/supporters';

interface PledgeActivationSectionProps {
  billing: BillingCycle;
  selectedTierId: SupporterTierId;
  displayName: string;
  email: string;
  formError: string | null;
  confirmationMessage: string | null;
  onSelectTierId: (tierId: SupporterTierId) => void;
  onChangeDisplayName: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const PledgeActivationSection: React.FC<PledgeActivationSectionProps> = ({
  billing,
  selectedTierId,
  displayName,
  email,
  formError,
  confirmationMessage,
  onSelectTierId,
  onChangeDisplayName,
  onChangeEmail,
  onSubmit,
}) => {
  const selectedTier =
    SUPPORTER_TIERS.find((t) => t.id === selectedTierId) ?? SUPPORTER_TIERS[1];

  return (
    <section id="pledge-panel" className="py-12 border-t border-slate-800/80 mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5">
          <p className="text-xs font-medium text-sky-400">Supporter Activation</p>
          <h2
            style={{ textWrap: 'balance' }}
            className="mt-2 text-2xl font-bold tracking-tight text-slate-50"
          >
            Complete your {selectedTier.name} pledge
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Select your tier and enter how you want to be credited. This studio build runs
            100% locally in your browser—activating a supporter tier immediately unlocks your
            badge, Pro/Elite roadmap voting, and Homepage Supporters credit for Elite Members.
          </p>

          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span>Selected Tier</span>
              <span className="font-semibold text-slate-100">{selectedTier.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Badge Granted</span>
              <span className="font-mono text-sky-300">{selectedTier.badgeName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Billing Rate</span>
              <span className="font-mono tabular-nums text-slate-100">
                ${billing === 'monthly' ? selectedTier.monthlyPrice : selectedTier.yearlyPrice} /{' '}
                {billing === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Homepage Supporters Credit</span>
              <span className="text-slate-200">
                {selectedTier.id === 'elite' ? 'Included' : 'Elite Member tier'}
              </span>
            </div>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="lg:col-span-7 rounded-xl border border-slate-800/90 bg-[#0F1522] p-6 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SUPPORTER_TIERS.map((t) => {
              const active = t.id === selectedTierId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTierId(t.id)}
                  className={`px-3 py-2.5 rounded-md border text-left transition-colors cursor-pointer ${
                    active
                      ? 'border-sky-500 bg-sky-500/10 text-slate-50'
                      : 'border-slate-800 bg-[#0B101B] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{t.name}</div>
                  <div className="mt-0.5 text-[11px] font-mono tabular-nums text-slate-400">
                    ${billing === 'monthly' ? t.monthlyPrice : t.yearlyPrice}/
                    {billing === 'monthly' ? 'mo' : 'yr'}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="supporter-display-name"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Display Name {selectedTierId === 'elite' ? '(shown on Homepage Supporters)' : ''}
              </label>
              <input
                id="supporter-display-name"
                type="text"
                value={displayName}
                onChange={(e) => onChangeDisplayName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                required
                className="w-full h-10 px-3 rounded-md bg-[#0B0F17] border border-slate-700/90 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label
                htmlFor="supporter-email"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Receipt Email (optional)
              </label>
              <input
                id="supporter-email"
                type="email"
                value={email}
                onChange={(e) => onChangeEmail(e.target.value)}
                placeholder="alex@studio.dev"
                className="w-full h-10 px-3 rounded-md bg-[#0B0F17] border border-slate-700/90 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-rose-400">
              {formError}
            </p>
          )}

          {confirmationMessage && (
            <div
              role="status"
              className="rounded-md border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-2.5 text-xs text-emerald-200 flex items-start gap-2"
            >
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{confirmationMessage}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-400">
              Cancel anytime · 100% goes to SparkCode 2 open-source maintenance
            </span>
            <button
              type="submit"
              className="h-10 px-5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Activate {selectedTier.name} (${billing === 'monthly' ? selectedTier.monthlyPrice : selectedTier.yearlyPrice}/
              {billing === 'monthly' ? 'mo' : 'yr'})
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export const RoadmapAndSupportersSection: React.FC<{
  canVoteOnRoadmap: boolean;
  roadmapVotes: string[];
  eliteSupporters: EliteSupporter[];
  onUnlockVoting: () => void;
  onToggleRoadmapVote: (itemId: string) => void;
  onGoHome: () => void;
}> = ({
  canVoteOnRoadmap,
  roadmapVotes,
  eliteSupporters,
  onUnlockVoting,
  onToggleRoadmapVote,
  onGoHome,
}) => (
  <>
    <section id="roadmap" className="py-12 border-t border-slate-800/80">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-emerald-400">Pro Contributor &amp; Elite Member Perk</p>
          <h2
            style={{ textWrap: 'balance' }}
            className="mt-2 text-2xl font-bold tracking-tight text-slate-50"
          >
            Vote on the SparkCode 2 feature roadmap.
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            {canVoteOnRoadmap
              ? 'Your membership unlocks direct voting. Click any item below to cast or update your vote.'
              : 'Pro Contributors ($10/mo) and Elite Members ($20/mo) vote directly on upcoming engine priorities.'}
          </p>
        </div>
        {!canVoteOnRoadmap && (
          <button
            type="button"
            onClick={onUnlockVoting}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer whitespace-nowrap self-start md:self-auto"
          >
            Unlock voting with Pro Contributor →
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROADMAP_ITEMS.map((item) => {
          const hasVoted = roadmapVotes.includes(item.id);
          const totalVotes = item.baseVotes + (hasVoted ? 1 : 0);
          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800/90 bg-[#0F1522] p-5 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="text-xs text-slate-400">{item.area}</div>
                <h3 className="mt-1 text-base font-semibold text-slate-100">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{item.description}</p>
              </div>

              <button
                type="button"
                disabled={!canVoteOnRoadmap}
                onClick={() => onToggleRoadmapVote(item.id)}
                aria-pressed={hasVoted}
                title={
                  canVoteOnRoadmap
                    ? hasVoted
                      ? 'Remove your roadmap vote'
                      : 'Vote for this feature'
                    : 'Requires Pro Contributor or Elite Member tier'
                }
                className={`min-w-[64px] py-2 px-3 rounded-md border flex flex-col items-center justify-center transition-colors shrink-0 ${
                  hasVoted
                    ? 'border-emerald-500/70 bg-emerald-500/15 text-emerald-200 cursor-pointer'
                    : canVoteOnRoadmap
                      ? 'border-slate-700 bg-[#0B101B] hover:border-sky-500/70 text-slate-200 cursor-pointer'
                      : 'border-slate-800 bg-[#0B101B] text-slate-500 cursor-not-allowed'
                }`}
              >
                <ChevronUp className="w-4 h-4" />
                <span className="text-xs font-mono font-semibold tabular-nums">{totalVotes}</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>

    <section className="py-12 border-t border-slate-800/80">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-amber-400">Homepage Recognition</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-50">
            Current Elite Supporters ({eliteSupporters.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={onGoHome}
          className="text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          See Supporters on Homepage →
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {eliteSupporters.map((sup) => (
          <div key={sup.id} className="rounded-lg border border-slate-800/90 bg-[#0F1522] px-3.5 py-3">
            <div className="text-sm font-semibold text-slate-100 truncate">{sup.name}</div>
            <div className="mt-0.5 text-[11px] text-slate-400 truncate">
              {sup.role} · {sup.since}
            </div>
          </div>
        ))}
      </div>
    </section>
  </>
);
