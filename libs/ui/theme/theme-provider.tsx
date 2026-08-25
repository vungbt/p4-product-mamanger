import {
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export type ModuleKey = 'admin' | 'storefront' | (string & {});

/** CSS var references — safe for SSR / Tailwind classes */
export const tokens = {
  color: {
    primary: 'var(--color-primary)',
    primaryBg: 'var(--color-primary-bg)',
    primaryHover: 'var(--color-primary-hover)',
    primaryBase: 'var(--color-primary-base)',
    primaryClicked: 'var(--color-primary-clicked)',
    primaryBorder: 'var(--color-primary-border)',

    secondary: 'var(--color-secondary)',
    secondaryBg: 'var(--color-secondary-bg)',
    secondaryHover: 'var(--color-secondary-hover)',
    secondaryBase: 'var(--color-secondary-base)',
    secondaryClicked: 'var(--color-secondary-clicked)',
    secondaryBorder: 'var(--color-secondary-border)',

    neutral: 'var(--color-neutral)',
    neutralWhite: 'var(--color-neutral-white)',
    neutralTableHeader: 'var(--color-neutral-table-header)',
    neutralBg: 'var(--color-neutral-bg)',
    neutralDivider: 'var(--color-neutral-divider)',
    neutralDisable: 'var(--color-neutral-disable)',
    neutralBorder: 'var(--color-neutral-border)',
    neutralPlaceholder: 'var(--color-neutral-placeholder)',
    neutralTextSecondary: 'var(--color-neutral-text-secondary)',
    neutralTextPrimary: 'var(--color-neutral-text-primary)',
    neutralBlack: 'var(--color-neutral-black)',

    pending: 'var(--color-pending)',
    pendingBg: 'var(--color-pending-bg)',
    pendingBase: 'var(--color-pending-base)',
    pendingBorder: 'var(--color-pending-border)',

    error: 'var(--color-error)',
    errorBg: 'var(--color-error-bg)',
    errorBase: 'var(--color-error-base)',
    errorBorder: 'var(--color-error-border)',

    success: 'var(--color-success)',
    successBg: 'var(--color-success-bg)',
    successBase: 'var(--color-success-base)',
    successBorder: 'var(--color-success-border)',

    info: 'var(--color-info)',
    infoBg: 'var(--color-info-bg)',
    infoBase: 'var(--color-info-base)',
    infoBorder: 'var(--color-info-border)',
  },
  font: {
    primary: 'var(--font-primary)',
    mono: 'var(--font-mono)',
  },
  fontSize: {
    8: 'var(--size-8)',
    10: 'var(--size-10)',
    12: 'var(--size-12)',
    13: 'var(--size-13)',
    14: 'var(--size-14)',
    15: 'var(--size-15)',
    16: 'var(--size-16)',
    17: 'var(--size-17)',
    18: 'var(--size-18)',
    20: 'var(--size-20)',
    24: 'var(--size-24)',
    28: 'var(--size-28)',
    32: 'var(--size-32)',
    36: 'var(--size-36)',
    40: 'var(--size-40)',
    48: 'var(--size-48)',
  },
  lineHeight: {
    12: 'var(--lineHeight-12)',
    16: 'var(--lineHeight-16)',
    20: 'var(--lineHeight-20)',
    24: 'var(--lineHeight-24)',
    32: 'var(--lineHeight-32)',
    40: 'var(--lineHeight-40)',
    48: 'var(--lineHeight-48)',
    56: 'var(--lineHeight-56)',
    64: 'var(--lineHeight-64)',
  },
} as const;

export type Tokens = typeof tokens;

/**
 * Flat map: token path → CSS custom property name.
 * Used to resolve hex values from computed styles.
 */
const COLOR_VAR_MAP = {
  primary: '--color-primary',
  primaryBg: '--color-primary-bg',
  primaryHover: '--color-primary-hover',
  primaryBase: '--color-primary-base',
  primaryClicked: '--color-primary-clicked',
  primaryBorder: '--color-primary-border',
  secondary: '--color-secondary',
  secondaryBg: '--color-secondary-bg',
  secondaryHover: '--color-secondary-hover',
  secondaryBase: '--color-secondary-base',
  secondaryClicked: '--color-secondary-clicked',
  secondaryBorder: '--color-secondary-border',
  neutral: '--color-neutral',
  neutralWhite: '--color-neutral-white',
  neutralTableHeader: '--color-neutral-table-header',
  neutralBg: '--color-neutral-bg',
  neutralDivider: '--color-neutral-divider',
  neutralDisable: '--color-neutral-disable',
  neutralBorder: '--color-neutral-border',
  neutralPlaceholder: '--color-neutral-placeholder',
  neutralTextSecondary: '--color-neutral-text-secondary',
  neutralTextPrimary: '--color-neutral-text-primary',
  neutralBlack: '--color-neutral-black',
  pending: '--color-pending',
  pendingBg: '--color-pending-bg',
  pendingBase: '--color-pending-base',
  pendingBorder: '--color-pending-border',
  error: '--color-error',
  errorBg: '--color-error-bg',
  errorBase: '--color-error-base',
  errorBorder: '--color-error-border',
  success: '--color-success',
  successBg: '--color-success-bg',
  successBase: '--color-success-base',
  successBorder: '--color-success-border',
  info: '--color-info',
  infoBg: '--color-info-bg',
  infoBase: '--color-info-base',
  infoBorder: '--color-info-border',
} as const satisfies Record<keyof Tokens['color'], string>;

type ResolvedColors = Record<keyof Tokens['color'], string>;

type ThemeContextValue = {
  moduleKey: ModuleKey;
  /** CSS var references — `var(--color-primary)`. Safe for SSR, Tailwind, inline styles. */
  tokens: Tokens;
  /**
   * Resolved hex values read from computed styles — always in sync with tokens.css / themes.css.
   * Falls back to CSS var references on SSR / before mount.
   */
  resolvedTokens: { color: ResolvedColors };
  /** Read a single computed CSS custom property from the theme container. Client-only. */
  getToken: (cssVar: string) => string;
};

const ThemeContext = createContext<ThemeContextValue>({
  moduleKey: '',
  tokens,
  resolvedTokens: { color: tokens.color as unknown as ResolvedColors },
  getToken: () => '',
});

type ThemeProviderProps = {
  moduleKey: ModuleKey;
  children: ReactNode;
};

function resolveColors(el: HTMLElement): ResolvedColors {
  const style = getComputedStyle(el);
  const resolved = {} as ResolvedColors;
  for (const [key, cssVar] of Object.entries(COLOR_VAR_MAP) as [keyof ResolvedColors, string][]) {
    resolved[key] = style.getPropertyValue(cssVar).trim();
  }
  return resolved;
}

export function ThemeProvider({ moduleKey, children }: ThemeProviderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [resolvedColors, setResolvedColors] = useState<ResolvedColors>(
    // SSR / first-render fallback: use CSS var references
    tokens.color as unknown as ResolvedColors,
  );

  useLayoutEffect(() => {
    if (!ref.current || !moduleKey) return;
    setResolvedColors(resolveColors(ref.current));
  }, [moduleKey]);

  function getToken(cssVar: string): string {
    if (typeof window === 'undefined' || !ref.current) return '';
    return getComputedStyle(ref.current).getPropertyValue(cssVar).trim();
  }

  return (
    <ThemeContext.Provider
      value={{
        moduleKey,
        tokens,
        resolvedTokens: { color: resolvedColors },
        getToken,
      }}
    >
      <div ref={ref} data-portal={moduleKey}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
