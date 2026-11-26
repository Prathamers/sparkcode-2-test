// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ThemeToggleButton, type ThemeMode } from '../ThemeToggleButton';

export const SparkBrandMark: React.FC = () => (
  <>
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
  </>
);

interface SiteHeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  navLabel: string;
  navLinks: React.ReactNode;
  onOpenStudio: () => void;
  ctaLabel?: string;
  brandHref?: string;
  onBrandClick?: () => void;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  theme,
  onToggleTheme,
  navLabel,
  navLinks,
  onOpenStudio,
  ctaLabel = 'Open Studio',
  brandHref,
  onBrandClick,
}) => (
  <header className="sticky top-0 z-40 h-14 bg-[#0B0F17]/95 backdrop-blur-sm border-b border-slate-800/80">
    <div className="max-w-[1240px] h-full mx-auto px-6 flex items-center justify-between gap-8">
      {brandHref ? (
        <a
          href={brandHref}
          className="flex items-center gap-2.5 text-slate-100 whitespace-nowrap shrink-0"
        >
          <SparkBrandMark />
        </a>
      ) : (
        <button
          type="button"
          onClick={onBrandClick}
          className="flex items-center gap-2.5 text-slate-100 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
        >
          <SparkBrandMark />
        </button>
      )}

      <nav
        aria-label={navLabel}
        className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400"
      >
        {navLinks}
      </nav>

      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggleButton theme={theme} onToggleTheme={onToggleTheme} />
        <button
          type="button"
          onClick={onOpenStudio}
          className="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </header>
);

interface SiteFooterProps {
  brandTitle?: string;
  subtitle: string;
  className?: string;
  children: React.ReactNode;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({
  brandTitle = 'SparkCode 2',
  subtitle,
  className = '',
  children,
}) => (
  <footer
    className={`${className} py-10 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400`.trim()}
  >
    <div className="flex items-center gap-3">
      <span className="font-semibold text-slate-200">{brandTitle}</span>
      <span aria-hidden="true">·</span>
      <span>{subtitle}</span>
    </div>
    <div className="flex items-center gap-5">{children}</div>
  </footer>
);
