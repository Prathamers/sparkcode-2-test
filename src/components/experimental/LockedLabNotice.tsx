// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { Lock } from 'lucide-react';

interface LockedLabNoticeProps {
  ctaLabel: string;
  ctaClassName: string;
  onUnlock: () => void;
  children: React.ReactNode;
}

export const LockedLabNotice: React.FC<LockedLabNoticeProps> = ({
  ctaLabel,
  ctaClassName,
  onUnlock,
  children,
}) => (
  <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-start gap-2.5 text-xs text-slate-300">
      <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
    <button
      type="button"
      onClick={onUnlock}
      className={`h-8 px-3 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${ctaClassName}`}
    >
      {ctaLabel}
    </button>
  </div>
);
