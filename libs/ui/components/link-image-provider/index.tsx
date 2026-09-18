import {
  type ComponentType,
  createContext,
  createElement,
  type MouseEventHandler,
  type ReactEventHandler,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';

export type UiLinkProps = {
  href: string;
  className?: string;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  /** Native hover tooltip (e.g. the collapsed-sidebar nav-item tooltip) — not routing-related, always forwarded as-is. */
  title?: string;
};

export type UiLinkComponent = ComponentType<UiLinkProps>;

export type UiImageProps = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onError?: ReactEventHandler<HTMLImageElement>;
};

export type UiImageComponent = ComponentType<UiImageProps>;

function DefaultLink({ href, children, ...props }: UiLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

function DefaultImage({ src, alt, ...props }: UiImageProps) {
  // `alt` is required by UiImageProps, but a caller can still pass '' by mistake (e.g. a dynamic
  // field that came back empty) — fall back to a generic label rather than leaving it silently empty.
  return <img alt={alt || 'Hình ảnh'} src={src} {...props} />;
}

const LinkImageContext = createContext<{
  Link: UiLinkComponent;
  Image: UiImageComponent;
}>({
  Link: DefaultLink,
  Image: DefaultImage,
});

export type LinkImageProviderProps = {
  Link?: UiLinkComponent;
  Image?: UiImageComponent;
  children: ReactNode;
};

// Keeps libs/ui components decoupled from any specific router/image lib (react-router-dom here,
// but the shape mirrors the same pattern used for next/link + next/image in other @p4 apps) —
// consumers inject their own Link/Image at the app root; Storybook/other consumers fall back to
// plain <a>/<img>.
export function LinkImageProvider({ Link, Image, children }: LinkImageProviderProps) {
  const value = useMemo(
    () => ({ Link: Link ?? DefaultLink, Image: Image ?? DefaultImage }),
    [Link, Image],
  );

  return <LinkImageContext.Provider value={value}>{children}</LinkImageContext.Provider>;
}

export function useUiLink(): UiLinkComponent {
  return useContext(LinkImageContext).Link;
}

export function useUiImage(): UiImageComponent {
  return useContext(LinkImageContext).Image;
}

export function UiLink({ href, className, children, onClick, title }: UiLinkProps) {
  const Link = useUiLink();

  return createElement(Link, { className, href, onClick, title }, children);
}

export function UiImage({ src, alt, className, width, height, onError }: UiImageProps) {
  const Image = useUiImage();

  return createElement(Image, { alt, className, height, onError, src, width });
}
