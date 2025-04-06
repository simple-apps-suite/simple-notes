// SPDX-FileCopyrightText: Copyright 2025 Fabio Iotti
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeProviderValue {
  theme: Theme
  setTheme(theme: Theme): void
}

const ThemeProviderContext = createContext<ThemeProviderValue | null>(null);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem(storageKey) as Theme) ?? defaultTheme
  );

  useEffect(() => {
    let isLight = theme === 'light';
    let isDark = theme === 'dark';
    if (!isLight && !isDark) {
      isDark = window.matchMedia("(prefers-color-scheme:dark)").matches;
      isLight = !isDark;
    }

    const root = window.document.documentElement;
    root.classList.toggle('light', isLight);
    root.classList.toggle('dark', isDark);
  }, [theme]);

  const value = useMemo<ThemeProviderValue>(() => ({
    theme,
    setTheme(theme: Theme) {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  }), [theme, storageKey]);

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
}
