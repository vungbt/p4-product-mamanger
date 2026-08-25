import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

export type CollapsibleShellValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
};

const CollapsibleShellContext = createContext<CollapsibleShellValue | null>(null);

// Only manages a single `collapsed` boolean + toggle/set functions — no business logic specific to
// admin/storefront, so it lives in `@p4/ui` to be reused by any layout that needs to collapse/expand
// (sidebar, panel...), instead of writing an identical copy in each app. Nested `<CollapsibleShellProvider>`
// instances still work fine — each Provider keeps its own state, `useCollapsibleShell` always
// reads from the nearest Provider.
export function CollapsibleShellProvider({
  children,
  defaultCollapsed = false,
}: {
  children: ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const value = useMemo<CollapsibleShellValue>(
    () => ({
      collapsed,
      toggleCollapsed: () => setCollapsed((prev) => !prev),
      setCollapsed,
    }),
    [collapsed],
  );

  return (
    <CollapsibleShellContext.Provider value={value}>{children}</CollapsibleShellContext.Provider>
  );
}

export function useCollapsibleShell() {
  const ctx = useContext(CollapsibleShellContext);
  if (!ctx) {
    throw new Error('useCollapsibleShell must be used within a CollapsibleShellProvider');
  }
  return ctx;
}
