# Project conventions

Monorepo (pnpm + Turborepo). Linting/formatting is **Biome only** (`pnpm lint` / `pnpm format`) — there is no ESLint, so anything below that isn't caught by Biome must be caught in code review by hand.

## Component structure (`libs/ui/components/**`, `libs/ui/modules/**`)

- One folder per component, **kebab-case** (`icon-button`, `product-card`).
- `index.tsx` exports the component; co-locate `*.stories.tsx` in the same folder.
- The exported component name and its `Props` type must be **PascalCase and match the folder name** (folder `product-card` → `ProductCard` / `ProductCardProps`, not `ProductCart`). The Storybook `title` should match too (e.g. `Components/ProductCard`).
- Use the shared `cn()` helper (`libs/ui/helpers/utils.ts`) to merge Tailwind classes — don't concatenate class strings manually.
- When a class/spacing/color choice isn't obvious from the code (matches a specific design spec, deliberately differs from a nearby similar component, etc.), leave a short comment referencing `docs/design/*` like existing components do (see `button/index.tsx`, `icon-button/index.tsx`). Don't explain what the code obviously does.

## Styling: prefer design tokens over arbitrary values

- Reach for a token in `config/tailwind/tailwind.preset.ts` (colors, `fontSize`, `lineHeight`, etc.) before reaching for a Tailwind arbitrary value (`w-[15px]`, `text-[#333]`) or a raw `style={{ ... }}` prop — most sizing/color needs already have a token.
- A one-off arbitrary value (e.g. `-top-[5px]`, `h-[18px]` for a badge offset in `icon-button/index.tsx`) is acceptable when it's a precise, non-reusable design measurement that doesn't belong in the shared scale — but never use it as a substitute for a token that already exists (e.g. don't write `text-[#EA580C]` when `text-primary` exists).
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
