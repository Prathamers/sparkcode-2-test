import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronUp, ShieldCheck } from 'lucide-react';
import {
  ROADMAP_ITEMS,
  SUPPORTER_TIERS,
  type BillingCycle,
  type EliteSupporter,
  type LocalSupporterProfile,
  type SupporterTierId,
} from '../data/supporters';

interface SupportUsPageProps {
  activeProfile: LocalSupporterProfile | null;
  eliteSupporters: EliteSupporter[];
  roadmapVotes: string[];
  onActivateSupport: (profile: LocalSupporterProfile) => void;
  onCancelSupport: () => void;
  onToggleRoadmapVote: (itemId: string) => void;
  onGoHome: () => void;
  onOpenStudio: () => void;
}

const TierBadgeInsignia: React.FC<{ tier: SupporterTierId }> = ({ tier }) => {
  if (tier === 'plus') {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="shrink-0">
        <rect x="2" y="2" width="24" height="24" rx="6" fill="#0EA5E9" fillOpacity="0.14" stroke="#38BDF8" strokeWidth="1.5" />
        <path d="M14 8.5V19.5M8.5 14H19.5" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (tier === 'pro') {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="shrink-0">
        <path
          d="M14 2.5L24.5 8.5V19.5L14 25.5L3.5 19.5V8.5L14 2.5Z"
          fill="#10B981"
          fillOpacity="0.14"
          stroke="#34D399"
          strokeWidth="1.5"
        />
        <path d="M15.2 7.5L9.8 14.5H14L12.8 20.5L18.2 13.5H14L15.2 7.5Z" fill="#34D399" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M14 2L17.4 8.8L25 9.9L19.5 15.2L20.8 22.8L14 19.2L7.2 22.8L8.5 15.2L3 9.9L10.6 8.8L14 2Z"
        fill="#F59E0B"
        fillOpacity="0.16"
        stroke="#FBBF24"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const SupportUsPage: React.FC<SupportUsPageProps> = ({
  activeProfile,
  eliteSupporters,
  roadmapVotes,
  onActivateSupport,
  onCancelSupport,
  onToggleRoadmapVote,
  onGoHome,
  onOpenStudio,
}) => {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [selectedTierId, setSelectedTierId] = useState<SupporterTierId>(
    activeProfile?.tier ?? 'pro'
  );
  const [displayName, setDisplayName] = useState<string>(activeProfile?.displayName ?? '');
  const [email, setEmail] = useState<string>(activeProfile?.email ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  const selectedTier = useMemo(
    () => SUPPORTER_TIERS.find((t) => t.id === selectedTierId) ?? SUPPORTER_TIERS[1],
    [selectedTierId]
  );

  const canVoteOnRoadmap =
    activeProfile?.tier === 'pro' || activeProfile?.tier === 'elite';

  const handleSelectTier = (tierId: SupporterTierId) => {
    setSelectedTierId(tierId);
    setFormError(null);
    setConfirmationMessage(null);
    const panel = document.getElementById('pledge-panel');
    panel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    const nextProfile: LocalSupporterProfile = {
      tier: selectedTierId,
      billing,
      displayName: cleanName,
      email: cleanEmail,
      joinedAt: new Date().toISOString(),
    };
    onActivateSupport(nextProfile);

    if (selectedTierId === 'elite') {
      setConfirmationMessage(
        `${cleanName} is now an Elite Member. Your Elite Badge is active and your name has been added to Supporters on the Homepage.`
      );
    } else if (selectedTierId === 'pro') {
      setConfirmationMessage(
        `${cleanName} is now a Pro Contributor. Your ProBadge and feature roadmap voting are active below.`
      );
    } else {
      setConfirmationMessage(
        `${cleanName} is now a Plus Contributor. Your PlusBadge is active.`
      );
    }
  };

  return (
    <div
      data-testid="support-us-page"
      className="h-screen w-screen overflow-y-auto bg-[#0B0F17] text-slate-100"
    >
      {/* Top Navigation Bar — Strict 3-Zone Contract */}
      <header className="sticky top-0 z-40 h-14 bg-[#0B0F17]/95 backdrop-blur-sm border-b border-slate-800/80">
        <div className="max-w-[1240px] h-full mx-auto px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single clean wordmark */}
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2.5 text-slate-100 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect
                x="2"
                y="2"
                width="20"
                height="20"
                rx="5"
                fill="#0EA5E9"
                fillOpacity="0.16"
                stroke="#38BDF8"
                strokeWidth="1.5"
              />
              <path d="M13.5 5.5L7.5 13H12L10.5 18.5L16.5 11H12L13.5 5.5Z" fill="#38BDF8" />
            </svg>
            <span className="text-[16px] font-bold tracking-tight whitespace-nowrap shrink-0">
              SparkCode 2
            </span>
          </button>

          {/* Zone 2: 4 concise single-line text links */}
          <nav
            aria-label="Support page navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400"
          >
            <button
              type="button"
              onClick={onGoHome}
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Home
            </button>
            <a
              href="#tiers"
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Tiers
            </a>
            <a
              href="#compare"
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Compare
            </a>
            <a
              href="#roadmap"
              className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Roadmap
            </a>
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenStudio}
              className="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1240px] mx-auto px-6">
        {/* HERO SECTION */}
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
                Support SparkCode 2 · 100% Open Source (GPLv3)
              </p>
              <h1
                style={{ fontSize: 'clamp(2.25rem, 3.6vw, 3.25rem)', textWrap: 'balance' }}
                className="mt-3 font-bold tracking-tight leading-[1.08] text-slate-50"
              >
                Fund an open, zero-bloat game engine built for creators.
              </h1>
              <p className="mt-4 text-[16px] leading-[1.6] text-slate-300 max-w-[60ch]">
                Every core feature of SparkCode 2 stays free and open-source under GPLv3.
                Community memberships fund engine speed, physics and shader engineering,
                and give supporters direct voice over what ships next.
              </p>
            </div>

            {/* Interactive Monthly / Yearly Billing Toggle */}
            <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
              <div
                role="tablist"
                aria-label="Billing interval"
                className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#101623] border border-slate-800"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={billing === 'monthly'}
                  onClick={() => setBilling('monthly')}
                  className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    billing === 'monthly'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={billing === 'yearly'}
                  onClick={() => setBilling('yearly')}
                  className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    billing === 'yearly'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Yearly Billing
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Annual plans save up to 31% on Plus and 2 months free on Pro &amp; Elite.
              </p>
            </div>
          </div>

          {/* Active Membership Banner (only when user has joined) */}
          {activeProfile && (
            <div className="mt-8 rounded-xl border border-emerald-500/40 bg-[#0E1A1A] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <TierBadgeInsignia tier={activeProfile.tier} />
                <div>
                  <div className="text-sm font-semibold text-slate-100">
                    Active Membership: {activeProfile.displayName} ·{' '}
                    {SUPPORTER_TIERS.find((t) => t.id === activeProfile.tier)?.name}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Badge unlocked:{' '}
                    <span className="font-mono text-emerald-300">
                      {SUPPORTER_TIERS.find((t) => t.id === activeProfile.tier)?.badgeName}
                    </span>
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

        {/* SECTION 1: MEMBERSHIP TIERS */}
        <section id="tiers" className="py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {SUPPORTER_TIERS.map((tier) => {
              const isSelected = selectedTierId === tier.id;
              const isCurrent = activeProfile?.tier === tier.id;
              const isElite = tier.id === 'elite';
              const price = billing === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
              const intervalLabel = billing === 'monthly' ? '/ month' : '/ year';
              const altBillingText =
                billing === 'monthly'
                  ? `Or $${tier.yearlyPrice}/year · ${tier.yearlyNote}`
                  : `$${tier.monthlyPrice}/month billed monthly · ${tier.yearlyNote}`;

              return (
                <article
                  key={tier.id}
                  data-testid={`tier-card-${tier.id}`}
                  className={`rounded-xl border p-6 flex flex-col justify-between transition-colors ${
                    isSelected
                      ? isElite
                        ? 'border-amber-400/70 bg-[#141724]'
                        : 'border-sky-500/70 bg-[#11192A]'
                      : 'border-slate-800/90 bg-[#0F1522]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          {tier.kicker}
                          {isCurrent ? ' · Active Plan' : ''}
                        </p>
                        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-50">
                          {tier.name}
                        </h2>
                      </div>
                      <TierBadgeInsignia tier={tier.id} />
                    </div>

                    <div className="mt-5 pb-5 border-b border-slate-800/80">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-bold font-mono tabular-nums text-slate-50">
                          ${price}
                        </span>
                        <span className="text-sm text-slate-400">{intervalLabel}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400 font-mono tabular-nums">
                        {altBillingText}
                      </p>
                    </div>

                    <p className="mt-5 text-sm leading-relaxed text-slate-300">
                      {tier.summary}
                    </p>

                    <div className="mt-5 pt-4 border-t border-slate-800/70">
                      <div className="text-xs font-semibold text-slate-200 mb-3">
                        Included in {tier.name}
                      </div>
                      <ul className="space-y-2.5 text-sm text-slate-300">
                        {tier.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2.5">
                            <Check
                              className={`w-4 h-4 mt-0.5 shrink-0 ${
                                isElite
                                  ? 'text-amber-400'
                                  : tier.id === 'pro'
                                    ? 'text-emerald-400'
                                    : 'text-sky-400'
                              }`}
                              aria-hidden="true"
                            />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectTier(tier.id)}
                    className={`mt-7 w-full h-11 px-4 rounded-md text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      isElite
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : isSelected
                          ? 'bg-sky-600 hover:bg-sky-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                    }`}
                  >
                    {isCurrent ? `Manage ${tier.name}` : tier.ctaLabel}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: VALIDATED SUPPORTER ACTIVATION / PLEDGE PANEL */}
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
              onSubmit={handleSubmitPledge}
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
                      onClick={() => {
                        setSelectedTierId(t.id);
                        setFormError(null);
                      }}
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
                    onChange={(e) => setDisplayName(e.target.value)}
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
                    onChange={(e) => setEmail(e.target.value)}
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

        {/* SECTION 3: TIER COMPARISON TABLE */}
        <section id="compare" className="py-12 border-t border-slate-800/80">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-sky-400">Side-by-Side Breakdown</p>
            <h2
              style={{ textWrap: 'balance' }}
              className="mt-2 text-2xl font-bold tracking-tight text-slate-50"
            >
              Compare contributor tiers at a glance.
            </h2>
          </div>

          <div className="mt-6 rounded-xl border border-slate-800/90 bg-[#0F1522] overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 bg-[#0B101B]">
                  <th className="py-3.5 px-4 font-semibold">Benefit</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-200">
                    Plus Contributor
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-slate-200">
                    Pro Contributor
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-amber-300">
                    Elite Member
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-100">Monthly Price</td>
                  <td className="py-3 px-4 font-mono tabular-nums">$3 / mo</td>
                  <td className="py-3 px-4 font-mono tabular-nums">$10 / mo</td>
                  <td className="py-3 px-4 font-mono tabular-nums text-amber-200">$20 / mo</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-100">Yearly Price</td>
                  <td className="py-3 px-4 font-mono tabular-nums">$25 / yr</td>
                  <td className="py-3 px-4 font-mono tabular-nums">$100 / yr</td>
                  <td className="py-3 px-4 font-mono tabular-nums text-amber-200">$200 / yr</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-100">Supporter Badge</td>
                  <td className="py-3 px-4 font-mono text-sky-300">PlusBadge</td>
                  <td className="py-3 px-4 font-mono text-emerald-300">ProBadge</td>
                  <td className="py-3 px-4 font-mono text-amber-300">Elite Badge</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-100">Priority Bug Reports</td>
                  <td className="py-3 px-4 text-slate-500">—</td>
                  <td className="py-3 px-4 text-emerald-300">Included</td>
                  <td className="py-3 px-4 text-emerald-300">Included</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-100">Feature Roadmap Voting</td>
                  <td className="py-3 px-4 text-slate-500">—</td>
                  <td className="py-3 px-4 text-emerald-300">Included</td>
                  <td className="py-3 px-4 text-emerald-300">Included</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-100">
                    Extra Features &amp; Early Experimental Blocks
                  </td>
                  <td className="py-3 px-4 text-slate-500">—</td>
                  <td className="py-3 px-4 text-slate-500">—</td>
                  <td className="py-3 px-4 text-amber-300">Included</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-100">
                    Name Under Supporters on Homepage
                  </td>
                  <td className="py-3 px-4 text-slate-500">—</td>
                  <td className="py-3 px-4 text-slate-500">—</td>
                  <td className="py-3 px-4 text-amber-300">Included</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 4: INTERACTIVE PRO & ELITE FEATURE ROADMAP VOTING */}
        <section id="roadmap" className="py-12 border-t border-slate-800/80">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-emerald-400">
                Pro Contributor &amp; Elite Member Perk
              </p>
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
                onClick={() => handleSelectTier('pro')}
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
                    <h3 className="mt-1 text-base font-semibold text-slate-100">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                      {item.description}
                    </p>
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
                    <span className="text-xs font-mono font-semibold tabular-nums">
                      {totalVotes}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 5: CURRENT ELITE SUPPORTERS PREVIEW */}
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
              <div
                key={sup.id}
                className="rounded-lg border border-slate-800/90 bg-[#0F1522] px-3.5 py-3"
              >
                <div className="text-sm font-semibold text-slate-100 truncate">{sup.name}</div>
                <div className="mt-0.5 text-[11px] text-slate-400 truncate">
                  {sup.role} · {sup.since}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* QUIET FOOTER */}
        <footer className="py-10 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-200">SparkCode 2</span>
            <span aria-hidden="true">·</span>
            <span>Open-source GPLv3 visual block IDE &amp; native 2D engine</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={onGoHome}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={onOpenStudio}
              className="font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
            >
              Launch Studio
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};
