import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

type AdminShellContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
};

const AdminShellContext = createContext<AdminShellContextValue | null>(null);

export function AdminShellProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  const value = useMemo(
    () => ({
      collapsed,
      toggleCollapsed: () => setCollapsed((prev) => !prev),
    }),
    [collapsed],
  );

  return <AdminShellContext.Provider value={value}>{children}</AdminShellContext.Provider>;
}

export function useAdminShell() {
  const ctx = useContext(AdminShellContext);
  if (!ctx) throw new Error('useAdminShell must be used within AdminShellProvider');
  return ctx;
}
