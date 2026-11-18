import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type PageMeta = {
  description: ReactNode;
  setDescription: (description: ReactNode) => void;
};

const PageMetaContext = createContext<PageMeta | null>(null);

/** Shares the current screen's short description between the page and the app header. */
export function PageMetaProvider({ children }: { children: ReactNode }) {
  const [description, setDescription] = useState<ReactNode>(null);

  const value = useMemo(() => ({ description, setDescription }), [description]);

  return <PageMetaContext.Provider value={value}>{children}</PageMetaContext.Provider>;
}

/** Description of the current screen, shown under the breadcrumb. */
export function usePageDescription(): ReactNode {
  return useContext(PageMetaContext)?.description ?? null;
}

/** Publishes `description` to the app header while the calling screen is mounted. */
export function useSetPageDescription(description: ReactNode) {
  const setDescription = useContext(PageMetaContext)?.setDescription;

  useEffect(() => {
    if (!setDescription) return;
    setDescription(description ?? null);
    return () => setDescription(null);
  }, [description, setDescription]);
}
