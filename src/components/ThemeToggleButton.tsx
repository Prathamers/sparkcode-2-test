// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';
import { Moon, Sun } from 'lucide-react';

export type ThemeMode = 'dark' | 'light';

interface ThemeToggleButtonProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  compact?: boolean;
}

export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  theme,
  onToggleTheme,
  compact = false,
}) => {
  const isLight = theme === 'light';
  return (
    <button
      type="button"
      onClick={onToggleTheme}
      data-testid="theme-toggle"
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className={`${
        compact ? 'h-8 px-2' : 'h-9 px-2.5'
      } inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-[#161E2E] hover:bg-slate-800 text-xs font-medium text-slate-200 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer`}
    >
      {isLight ? (
        <Moon className="w-3.5 h-3.5 text-slate-700" />
      ) : (
        <Sun className="w-3.5 h-3.5 text-amber-300" />
      )}
      <span className={compact ? 'hidden xl:inline' : 'hidden sm:inline'}>
        {isLight ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};
