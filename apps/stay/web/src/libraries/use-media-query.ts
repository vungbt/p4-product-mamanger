import { useSyncExternalStore } from 'react';

/** Whether a CSS media query matches (re-renders when it changes). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);

      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Desktop layout from `lg` (1024px), as the shell (sidebar vs bottom nav). */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
