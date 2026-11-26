// SPDX-License-Identifier: AGPL-3.0-or-later
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  SUPPORTER_TIERS,
  type BillingCycle,
  type EliteSupporter,
  type LocalSupporterProfile,
  type SupporterTierId,
} from '../data/supporters';
import type { ThemeMode } from './ThemeToggleButton';
import { SiteFooter, SiteHeader } from './shared/SiteChrome';
import { PledgeActivationSection, RoadmapAndSupportersSection } from './support/PledgeAndRoadmapSection';
import { TierBadgeInsignia, TierCardsSection, TierComparisonSection } from './support/TierCardsSection';

interface SupportUsPageProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  activeProfile: LocalSupporterProfile | null;
  eliteSupporters: EliteSupporter[];
  roadmapVotes: string[];
  onActivateSupport: (profile: LocalSupporterProfile) => void;
  onCancelSupport: () => void;
  onToggleRoadmapVote: (itemId: string) => void;
  onGoHome: () => void;
  onOpenStudio: () => void;
  onOpenTerms: () => void;
}

export const SupportUsPage: React.FC<SupportUsPageProps> = ({
  theme,
  onToggleTheme,
  activeProfile,
  eliteSupporters,
  roadmapVotes,
  onActivateSupport,
  onCancelSupport,
  onToggleRoadmapVote,
  onGoHome,
  onOpenStudio,
  onOpenTerms,
}) => {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [selectedTierId, setSelectedTierId] = useState<SupporterTierId>(
    activeProfile?.tier ?? 'pro'
  );
  const [displayName, setDisplayName] = useState<string>(activeProfile?.displayName ?? '');
  const [email, setEmail] = useState<string>(activeProfile?.email ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  const canVoteOnRoadmap = activeProfile?.tier === 'pro' || activeProfile?.tier === 'elite';

  const handleSelectTier = (tierId: SupporterTierId) => {
    setSelectedTierId(tierId);
    setFormError(null);
    setConfirmationMessage(null);
    document.getElementById('pledge-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleSubmitPledge = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    const cleanEmail = email.trim();

    if (cleanName.length < 2) {
      setFormError('Enter a display name (at least 2 characters) for your supporter badge.');
      return;
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Enter a valid email address or leave the receipt email field blank.');
      return;
    }

    setFormError(null);
    onActivateSupport({
      tier: selectedTierId,
      billing,
      displayName: cleanName,
      email: cleanEmail,
      joinedAt: new Date().toISOString(),
    });

    if (selectedTierId === 'elite') {
      setConfirmationMessage(
        `${cleanName} is now an Elite Member. Your Elite Badge is active and your name has been added to Supporters on the Homepage.`
      );
    } else if (selectedTierId === 'pro') {
      setConfirmationMessage(
        `${cleanName} is now a Pro Contributor. Your ProBadge and feature roadmap voting are active below.`
      );
    } else {
      setConfirmationMessage(`${cleanName} is now a Plus Contributor. Your PlusBadge is active.`);
    }
  };

  const activeTierMeta = SUPPORTER_TIERS.find((t) => t.id === activeProfile?.tier);

  return (
    <div
      data-testid="support-us-page"
      className="h-screen w-screen overflow-y-auto bg-[#0B0F17] text-slate-100"
    >
      <SiteHeader
        theme={theme}
        onToggleTheme={onToggleTheme}
        onBrandClick={onGoHome}
        navLabel="Support page navigation"
        onOpenStudio={onOpenStudio}
        navLinks={
          <>
            <button
              type="button"
              onClick={onGoHome}
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Home
            </button>
            <a href="#tiers" className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              Tiers
            </a>
            <a href="#compare" className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              Compare
            </a>
            <a href="#roadmap" className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              Roadmap
            </a>
          </>
        }
      />

      <main className="max-w-[1240px] mx-auto px-6">
        <section className="pt-12 pb-10">
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>

          <div className="mt-6 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-sky-400">
                Support SparkCode 2 · 100% Open Source
              </p>
              <h1
                style={{ fontSize: 'clamp(2.25rem, 3.6vw, 3.25rem)', textWrap: 'balance' }}
                className="mt-3 font-bold tracking-tight leading-[1.08] text-slate-50"
              >
                Fund an open, zero-bloat game engine built for creators.
              </h1>
              <p className="mt-4 text-[16px] leading-[1.6] text-slate-300 max-w-[60ch]">
                Every core feature of SparkCode 2 stays free and open source. Community memberships
                fund engine speed, physics and shader engineering, and give supporters direct voice
                over what ships next.
              </p>
            </div>

            <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
              <div
                role="tablist"
                aria-label="Billing interval"
                className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#101623] border border-slate-800"
              >
                {(['monthly', 'yearly'] as const).map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    role="tab"
                    aria-selected={billing === cycle}
                    onClick={() => setBilling(cycle)}
                    className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      billing === cycle
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {cycle === 'monthly' ? 'Monthly Billing' : 'Yearly Billing'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                Annual plans save up to 31% on Plus and 2 months free on Pro &amp; Elite.
              </p>
            </div>
          </div>

          {activeProfile && (
            <div className="mt-8 rounded-xl border border-emerald-500/40 bg-[#0E1A1A] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <TierBadgeInsignia tier={activeProfile.tier} />
                <div>
                  <div className="text-sm font-semibold text-slate-100">
                    Active Membership: {activeProfile.displayName} · {activeTierMeta?.name}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Badge unlocked:{' '}
                    <span className="font-mono text-emerald-300">{activeTierMeta?.badgeName}</span>
                    {activeProfile.tier === 'elite'
                      ? ' · Listed under Supporters on the Homepage'
                      : activeProfile.tier === 'pro'
                        ? ' · Priority bug reports & roadmap voting unlocked'
                        : ' · Supporting open-source development'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {activeProfile.tier === 'elite' && (
                  <button
                    type="button"
                    onClick={onGoHome}
                    className="h-8 px-3 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-100 whitespace-nowrap cursor-pointer transition-colors"
                  >
                    View on Homepage
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onCancelSupport();
                    setConfirmationMessage(null);
                  }}
                  className="text-xs font-medium text-slate-400 hover:text-rose-300 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Clear local membership
                </button>
              </div>
            </div>
          )}
        </section>

        <TierCardsSection
          billing={billing}
          selectedTierId={selectedTierId}
          activeTierId={activeProfile?.tier ?? null}
          onSelectTier={handleSelectTier}
        />

        <PledgeActivationSection
          billing={billing}
          selectedTierId={selectedTierId}
          displayName={displayName}
          email={email}
          formError={formError}
          confirmationMessage={confirmationMessage}
          onSelectTierId={(id) => {
            setSelectedTierId(id);
            setFormError(null);
          }}
          onChangeDisplayName={setDisplayName}
          onChangeEmail={setEmail}
          onSubmit={handleSubmitPledge}
        />

        <TierComparisonSection />

        <RoadmapAndSupportersSection
          canVoteOnRoadmap={canVoteOnRoadmap}
          roadmapVotes={roadmapVotes}
          eliteSupporters={eliteSupporters}
          onUnlockVoting={() => handleSelectTier('pro')}
          onToggleRoadmapVote={onToggleRoadmapVote}
          onGoHome={onGoHome}
        />

        <SiteFooter subtitle="Open-source visual block IDE &amp; native 2D engine">
          <button
            type="button"
            onClick={onGoHome}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            Home
          </button>
          <button
            type="button"
            onClick={onOpenTerms}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            Terms &amp; Conditions
          </button>
          <button
            type="button"
            onClick={onOpenStudio}
            className="font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
          >
            Launch Studio
          </button>
        </SiteFooter>
      </main>
    </div>
  );
};
