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

## Forms

- Keep `Form` / `useAppForm` and Valibot validation. Inside each form, use the published `FormLayout` for the content width, `FormSection` for related fields (`variant="card"` for panels), and `FormGrid columns={1 | 2 | 3}` for responsive field rows. Use `FormGridItem span="full"` for notes or full-width content; avoid viewport-based column spans.
- Put submit/cancel controls in `FormActions` after the sections, secondary actions first and the primary action last. Autosaved meter readings have no submit bar. Keep wizard navigation and dialog actions at the bottom.
- File fields use `form.AppField` and its `field.UploadField`, with `File[]` values; standalone file operations use kit `UploadField`. Keep file selection separate from persisted file IDs and explicit API payloads. Private upload tickets, upload purposes, byte/type/count limits and saved previews remain owned by the feature. Use the kit's `DatePicker`, `MonthPicker`, `NumberInput` and `InputPassword` for those controls.
- Preserve labels and test IDs. The kit upload test ID names the wrapper; its native file input has the `-input` suffix. When selecting by label in Playwright, intersect with `input[type="file"]` to distinguish it from the labelled kit trigger.

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

Action placement (Stay web):

- Page actions (create, import, export, bulk share/issue) go in the toolbar row directly above the table or list, right-aligned: pass them to `FilterBar`'s `actions` slot (a page without filters renders `<FilterBar actions={…} />`). Never in the page header of a list and never below the list.
- Page heading: `ScreenHeader` renders a visually hidden `<h1>` and sends its text description to the app header under the breadcrumb; only the overview keeps a visible title (`visible`). Page reads: header → filter card (`FilterBar` with filters renders as a surface card) → table/list.
- Lists show skeletons only on the first load (`loading: query.isPending`); refetches keep the rows (`ListTable refreshing` / `Refreshing`: dimmed, `aria-busy`).
- Order: secondary actions first (Xuất, Nhập, Chia sẻ…), the primary action last.
- Detail pages (invoice, contract, room, tenant) keep their actions on the right of the header, same order; destructive actions use `variant="danger"` or ghost.
- Icons, as children of the kit Button: create/add `plus`, import `upload`, export/download `download`, share `share`, link `link`, copy `copy`, print `printer`, edit `edit`, delete/void/revoke `delete`, reverse a record `rotateLeft`, view/preview `view`, collect money `moneyReceive`. Register every glyph in `apps/stay/web/src/libraries/ui-theme.ts`.
- Row actions are IconButtons (the rule above); keep the accessible names the e2e specs use.
- Exceptions that stay at the bottom: form submit/cancel bars, wizard step navigation, dialog/drawer footers and destructive confirmations.

## Code spacing

- Separate hook calls, derived data, handler declarations and the returned JSX with blank lines. Keep a blank line between top-level type declarations and components/functions. Biome does not insert all semantic blank lines; check these manually after formatting.

## Backend TypeScript

- API query services use `ModelOrder<ModelAttributes>` and `StringField<ModelAttributes>` from `apps/api/src/types/database.ts`; SQL `SortDirection` is shared there. Avoid Sequelize's broad `Order` type for simple sorting.
- Supply model attributes to `WhereOptions<ModelAttributes>`. Validate untrusted HTTP values at runtime before normalization; do not bypass compiler errors with assertions.
- Run `pnpm --filter @p4/api typecheck` and `pnpm --filter @p4/api test:lists` after API changes. For DB query changes, run the documented local integration suite against the existing development stack.

- Keep DTO field lists in their owning service; inline single-use lists. Services call `selectFields` directly for simple DTO selection; do not create mapper functions that only wrap this helper. Mappers with actual transformations use `selectFields` from `apps/api/src/utils/select-fields.ts` for direct fields and keep explicit DTO return types. Keep date/relationship transformations explicit; never select credential or internal fields into public DTOs. Do not cast mapper output to bypass type errors.

## Auth, audit and SDK

- Better Auth owns sessions; use `@p4/api-sdk/auth` on clients. Never reintroduce
  localStorage tokens or a parallel JWT refresh engine.
- Authorization uses CASL via `@p4/ability` (see its README). Guard routes with
  `requireAbility(action, subject)`; check owned records with `canAccessRecord`, not
  inline `userId` comparisons. On the web use route `ability` and `useCanAccess`.
- Add explicit action policy next to every router. Use `auditedCommand` /
  `auditedTransaction` for business writes; preserve the transaction isolation
  required by the service. Do not perform provider side effects before commit.
- Regenerate OpenAPI then `@p4/api-sdk` after API contract changes. SDK shared/auth
  exports work without React; React context is an optional separate export.
