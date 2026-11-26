// SPDX-License-Identifier: AGPL-3.0-or-later
import { useCallback, useEffect, useState } from 'react';
import type { ThemeMode } from '../components/ThemeToggleButton';

export function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      return localStorage.getItem('sparkcode2:theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('sparkcode2:theme', theme);
    } catch {
      // Ignore storage quota / private-browsing errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggleTheme };
}
