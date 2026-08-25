import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'p4-theme';

function getSystemMode(): ThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredMode(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

function applyMode(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

/**
 * Reads/writes the light/dark theme for the whole app.
 *
 * - Adds/removes the `.dark` class on <html> — matches `darkMode: 'class'` in tailwind.preset.
 *   Set on <html> (not a wrapper div inside the React tree) because Modal/Drawer/Menu use
 *   createPortal(document.body) — they sit outside the React tree, so only a class on <html>/<body>
 *   can cover these portals too.
 * - Persists the choice to localStorage (key p4-theme) to remember it across future loads.
 * - If nothing has been chosen yet, follows the OS's `prefers-color-scheme`.
 * - A FOUC-prevention <script> in apps/web/index.html runs before React mounts,
 *   setting the .dark class immediately so there's no light/dark flash on page load.
 */
export function useDarkMode() {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredMode() ?? getSystemMode());

  useEffect(() => {
    applyMode(mode);
  }, [mode]);

  // Follow the OS setting if the user has never toggled it (nothing in localStorage yet)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      if (getStoredMode() !== null) return; // user already made an explicit choice — don't override it
      setModeState(e.matches ? 'dark' : 'light');
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  return { mode, isDark: mode === 'dark', setMode, toggle };
}
