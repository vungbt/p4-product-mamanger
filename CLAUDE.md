# Project conventions

Monorepo (pnpm + Turborepo). Linting/formatting is **Biome only** (`pnpm lint` / `pnpm format`) — there is no ESLint, so anything below that isn't caught by Biome must be caught in code review by hand.

## Component structure (`libs/ui/components/**`, `libs/ui/modules/**`)

- One folder per component, **kebab-case** (`icon-button`, `product-card`).
- `index.tsx` exports the component; co-locate `*.stories.tsx` in the same folder.
- The exported component name and its `Props` type must be **PascalCase and match the folder name** (folder `product-card` → `ProductCard` / `ProductCardProps`, not `ProductCart`). The Storybook `title` should match too (e.g. `Components/ProductCard`).
- Use the shared `cn()` helper (`libs/ui/helpers/utils.ts`) to merge Tailwind classes — don't concatenate class strings manually.
- When a class/spacing/color choice isn't obvious from the code (matches a specific design spec, deliberately differs from a nearby similar component, etc.), leave a short comment referencing `docs/design/*` like existing components do (see `button/index.tsx`, `icon-button/index.tsx`). Don't explain what the code obviously does.

## Styling: no arbitrary values, ever — extend the preset instead

- Never write a Tailwind arbitrary value (`w-[15px]`, `text-[#333]`, `text-[13.5px]`) or a raw `style={{ ... }}` prop for something a token could express. This is absolute, not "unless it's a one-off precise measurement" — there is no such exception.
- **The single source of truth for the design scale is `libs/ui/tailwind.preset.cjs`** (plus `libs/ui/theme/tokens.css` for the CSS custom properties `fontSize`/color tokens read from). There used to be three drifted copies of this preset (`config/tailwind/tailwind.preset.ts`, `libs/ui/tailwind.preset.ts`, `libs/ui/tailwind.preset.cjs`) — they're gone; don't recreate one. Both `apps/web/tailwind.config.cjs` and `libs/ui/tailwind.config.cjs` (Storybook) `require()` this one file directly.
- If the exact value you need isn't in the scale, **add it** — don't hardcode it inline and don't silently round to the nearest existing step (design measurements in this project are often genuinely fractional, e.g. `13.5px`/`10.5px` body/caption text — see `docs/design/p4-product-manager-design.html`, which uses half-pixel sizes throughout). Add a `fontSize` entry (`13.5: 'var(--size-13-5)'` in the preset + `--size-13-5: 13.5px;` in `tokens.css`) or extend `theme.extend.spacing` following Tailwind's own `n * 4px` key convention (`1.25` = 5px, `4.5` = 18px) — see the `heart`/`star` badge offset and `flash-sale-product-card`'s `text-13.5`/`text-11`/`gap-1.25` for the pattern.
- A new numeric `fontSize` key is registered in **two** places: the preset's `fontSize` map, and `NUMERIC_TEXT_FONT_SIZES` in `libs/ui/helpers/utils.ts` (so `cn()`'s tailwind-merge config knows `text-13.5` is a font-size utility, not a color one — miss this and `cn('text-13.5', 'text-neutral-text-primary')` can silently drop a class). Spacing keys (`gap-*`, `p-*`, `w-*`, `min-w-*`, ...) don't need this — tailwind-merge already treats any numeric suffix in those groups as spacing.
- Before adding a token, check whether an existing one already matches — a semantic token can exist at the same pixel size but bake in extra properties that don't fit your use case (e.g. `text-ui-overline` is 11px but also forces `font-weight:700` + letter-spacing; a plain 11px label without that treatment needs the bare `text-11` numeric token instead, not `text-ui-overline`).
- Never use `style={{ ... }}` to size/color a child element through a wrapper component's props — props like `style`/`className` on components such as `IconButton`/`Button` are spread onto the *outer* element, not passed down to the icon. Use the component's own class-override prop instead (`iconClassName` on `IconButton`, `customClasses.icon` on `Button`).

## Layout: don't hardcode sizing/positioning that belongs to the consumer

- Don't bake `absolute`/`fixed` positioning with hardcoded offsets (`absolute bottom-0`) directly into a shared component — it assumes one specific parent/viewport context and breaks when reused elsewhere. `mobile-sticky-action-bar` used to hardcode `w-80 absolute bottom-0`, which overflowed any viewport narrower than 320px and had no horizontal placement (`left`/`right` unset); it's now `w-full max-w-80` with no positioning baked in, leaving placement (`fixed inset-x-0 bottom-0 mx-auto`, etc.) to whatever mounts it via `className`.
- If positioning genuinely is the component's whole job (an overlay like `Modal`/`Drawer`/`Toast`), that's fine — but still avoid a hardcoded fixed pixel width alongside it; make width overridable via `className`/props the same way.
- For a component that sits in normal document flow and is typically repeated in a grid/flex (a "Card"), don't hardcode `w-*` either — use `min-w-*` as an intrinsic floor (e.g. `flash-sale-product-card`'s `min-w-60`) and let the actual rendered width come from the parent's layout (a grid track, a flex basis), not the component. Preview this in Storybook by wrapping the story in the real parent context — a `grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]` for a card grid, a plain `inline-flex` wrapper for a single card at its natural size — instead of rendering the component bare (see `FlashSaleProductCard`'s `InGrid`/`Default` stories).

## Props & TypeScript

- Give every optional prop a sensible rendering fallback — don't interpolate an optional value directly into surrounding literal text (e.g. `` `.${sold}` `` renders a bare "." when `sold` is undefined). Guard with a conditional or default value instead.
- Before adding a new prop/behavior to a component, check whether a sibling or parent component already solves it (e.g. `Button` already renders a leading icon via its `icon` prop — don't hand-roll `<RenderIcon className="mr-2" .../>` as a child instead of using it). Reusing the existing prop keeps sizing/spacing in sync automatically when the shared component changes.
- Avoid `any`; keep exported prop types explicit so Storybook controls and consumers get real autocomplete.

## Accessibility

- Every content image needs a real `alt` (e.g. `alt={name}` for a product image) — empty `alt=""` is only for purely decorative images.
- The Storybook a11y addon is already wired up (`libs/ui/.storybook`) — check the Accessibility panel for a new/changed story before considering it done, not just the visual result.
