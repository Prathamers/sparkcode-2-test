// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { Check } from 'lucide-react';
import {
  SUPPORTER_TIERS,
  type BillingCycle,
  type SupporterTierId,
} from '../../data/supporters';

export const TierBadgeInsignia: React.FC<{ tier: SupporterTierId }> = ({ tier }) => {
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

interface TierCardsSectionProps {
  billing: BillingCycle;
  selectedTierId: SupporterTierId;
  activeTierId: SupporterTierId | null;
  onSelectTier: (tierId: SupporterTierId) => void;
}

export const TierCardsSection: React.FC<TierCardsSectionProps> = ({
  billing,
  selectedTierId,
  activeTierId,
  onSelectTier,
}) => (
  <section id="tiers" className="py-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      {SUPPORTER_TIERS.map((tier) => {
        const isSelected = selectedTierId === tier.id;
        const isCurrent = activeTierId === tier.id;
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

              <p className="mt-5 text-sm leading-relaxed text-slate-300">{tier.summary}</p>

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
              onClick={() => onSelectTier(tier.id)}
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
);

const COMPARISON_ROWS: Array<{
  benefit: string;
  plus: React.ReactNode;
  pro: React.ReactNode;
  elite: React.ReactNode;
}> = [
  {
    benefit: 'Monthly Price',
    plus: <span className="font-mono tabular-nums">$3 / mo</span>,
    pro: <span className="font-mono tabular-nums">$10 / mo</span>,
    elite: <span className="font-mono tabular-nums text-amber-200">$20 / mo</span>,
  },
  {
    benefit: 'Yearly Price',
    plus: <span className="font-mono tabular-nums">$25 / yr</span>,
    pro: <span className="font-mono tabular-nums">$100 / yr</span>,
    elite: <span className="font-mono tabular-nums text-amber-200">$200 / yr</span>,
  },
  {
    benefit: 'Supporter Badge',
    plus: <span className="font-mono text-sky-300">PlusBadge</span>,
    pro: <span className="font-mono text-emerald-300">ProBadge</span>,
    elite: <span className="font-mono text-amber-300">Elite Badge</span>,
  },
  {
    benefit: 'Priority Bug Reports',
    plus: <span className="text-slate-500">—</span>,
    pro: <span className="text-emerald-300">Included</span>,
    elite: <span className="text-emerald-300">Included</span>,
  },
  {
    benefit: 'Feature Roadmap Voting',
    plus: <span className="text-slate-500">—</span>,
    pro: <span className="text-emerald-300">Included</span>,
    elite: <span className="text-emerald-300">Included</span>,
  },
  {
    benefit: 'Vector Pen Tool (Experimental Tab Only)',
    plus: <span className="text-slate-500">—</span>,
    pro: <span className="text-emerald-300">Included</span>,
    elite: <span className="text-emerald-300">Included</span>,
  },
  {
    benefit: 'WebGL2 Hardware Shadow & Bloom Pass (Experimental)',
    plus: <span className="text-slate-500">—</span>,
    pro: <span className="text-slate-500">—</span>,
    elite: <span className="text-amber-300">Included</span>,
  },
  {
    benefit: 'Improved SparkVM (Turbo Budget & Caps)',
    plus: <span className="text-slate-500">—</span>,
    pro: <span className="text-slate-500">—</span>,
    elite: <span className="text-amber-300">Included</span>,
  },
  {
    benefit: 'Name Under Supporters on Homepage',
    plus: <span className="text-slate-500">—</span>,
    pro: <span className="text-slate-500">—</span>,
    elite: <span className="text-amber-300">Included</span>,
  },
];

export const TierComparisonSection: React.FC = () => (
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
            <th className="py-3.5 px-4 font-semibold text-slate-200">Plus Contributor</th>
            <th className="py-3.5 px-4 font-semibold text-slate-200">Pro Contributor</th>
            <th className="py-3.5 px-4 font-semibold text-amber-300">Elite Member</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70 text-slate-300">
          {COMPARISON_ROWS.map((row) => (
            <tr key={row.benefit}>
              <td className="py-3 px-4 font-medium text-slate-100">{row.benefit}</td>
              <td className="py-3 px-4">{row.plus}</td>
              <td className="py-3 px-4">{row.pro}</td>
              <td className="py-3 px-4">{row.elite}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
