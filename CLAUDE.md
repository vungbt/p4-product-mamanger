# Frontend conventions

## UI components

- Import shared controls, forms, tables and navigation directly from `@itclabs/react-ui`.
- Use the published library and its Storybook: https://react-ui-one-rose.vercel.app/.
- Reusable P4 business compositions live in `libs/blocks` (`@p4/blocks`), built from the published kit. Do not copy Button/Input/Avatar or other kit primitives into this package. Feature-specific UI stays alongside its page in `apps/web/src`.
- Preserve business props, callbacks and stories when changing a block. Run `pnpm --filter @p4/blocks typecheck` and `pnpm build:storybook`; preview with `pnpm storybook`.
- Use `cn` from `@itclabs/react-ui` for conditional classes; prefer the kit's semantic text and color utilities when merging classes.
- Read installed TypeScript declarations before using props. Button supports `variant` (`primary`, `secondary`, `ghost`, `danger`) and `size` (`sm`, `md`, `lg`); render custom icons as children. IconButton requires a `label`.
- Forms use `Form`, `FormField`, `useAppForm` and Valibot (imported directly from `valibot`).
- Use `toast` from `@itclabs/react-ui/toast`; the root mounts `ToastProvider`.
- Register additional named glyph imports in `apps/web/src/libraries/ui-theme.ts`; avoid importing the full icon catalog.

## Styling

- Follow the [official theming guide](https://react-ui-one-rose.vercel.app/?path=/docs/guides-theming--docs) and `docs/design/p4-theme.md`. Fixed branding lives in CSS on `:root`; use `UIProvider.theme.tokens` only for runtime branding, never duplicate a token in both sources.
- The kit's default fonts include 400–700. Keep the optional `theme/fonts-800.css` entry while blocks use `font-extrabold`.

- Tailwind CSS 4 is compiled by `@tailwindcss/vite`.
- `apps/web/src/styles/tailwind.css` imports kit styles once. Import `p4-theme.css` after kit styles for the P4 Ember orange/cool-neutral palette; keep Be Vietnam Pro typography. Use semantic tokens (`canvas`, `surface`, `ink`, `muted`, `line`, `brand-*`).
- Extend `@theme` for new design tokens. Avoid adding arbitrary values or inline style props for values a token can express.
- The current app uses a light P4 palette mapped to the kit tokens on `:root`, including portals. Do not restore legacy font, sizing or dark mode overrides.
- `UIProvider` configures React Router, images and UI locale; app translations stay in i18next.

## Layout and accessibility

- Derive menus from RouteConfigs; use Sidebar/Navbar rather than duplicating navigation.
- Keep feature-specific hooks/components alongside their page; use `src/libraries` or `src/hooks` only for shared consumers.
- Preserve existing auth, role guards and API contracts. This UI migration does not require backend changes.
- Give images meaningful alt text (empty only for decorative images), label icon buttons, and verify mobile navigation, keyboard focus and form errors.
- Check `pnpm --filter @p4/web build` and `pnpm lint` before finishing frontend work.

- Table rows with up to three actions show them inline. Use the kit IconButton with descriptive labels; reserve overflow menus for larger action sets.

## Code spacing

- Separate hook calls, derived data, handler declarations and the returned JSX with blank lines. Keep a blank line between top-level type declarations and components/functions. Biome does not insert all semantic blank lines; check these manually after formatting.
