---
name: check-conventions
description: Check changed code against this project's CLAUDE.md conventions (design tokens vs arbitrary values, layout/positioning, component structure, props/TypeScript, accessibility). Use after or alongside /code-review — code-review hunts correctness bugs, this hunts violations of rules this project has explicitly chosen that a correctness review has no reason to flag. Use when the user asks to "check conventions", "check CLAUDE.md rules", or after adding/changing UI components in libs/ui.
---

# Check project conventions

`/code-review` looks for correctness bugs. It has no reason to flag a `p-[14px]` that duplicates the existing `p-3.5` token — that's valid, working code. This skill exists for exactly that gap: verifying changed code against the rules this project has written down in `CLAUDE.md`, not against general correctness.

## Workflow

1. Read `CLAUDE.md` at the repo root in full before reviewing anything — it is the source of truth. Don't rely on a memory of its rules from earlier in the conversation; it may have changed.
2. Determine scope: the argument passed to this skill (a path, branch, or PR), or if none given, the current diff (`git status`, `git diff HEAD`).
3. For each changed file under `libs/ui/**` (and any other file touching JSX/Tailwind classes), check it against every rule in `CLAUDE.md`, section by section. In particular:
   - **Component structure**: folder kebab-case, exported name/`Props` type matches the folder name, Storybook `title` matches, `cn()` used instead of manual string concatenation.
   - **Styling**: any Tailwind arbitrary value (`[...]`) or raw `style={{ ... }}` for a sizing/color need is a violation, full stop — there is no "one-off measurement" exception. Cross-check `libs/ui/tailwind.preset.cjs` (the single source of truth — colors, `fontSize`, `lineHeight`, and the `theme.extend.spacing` additions) and `libs/ui/theme/tokens.css` before flagging; if genuinely no token matches, the fix is adding one to the preset (+ `tokens.css` for a `fontSize` var, + `NUMERIC_TEXT_FONT_SIZES` in `libs/ui/helpers/utils.ts` for a new numeric `text-*` key), not leaving the arbitrary value in place. Don't guess the scale from memory — check the preset file. Also flag raw `style={{ ... }}` passed into a wrapper component's outer element when a class-override prop exists instead.
   - **Layout**: a shared component hardcoding a fixed width or `absolute`/`fixed` positioning with literal offsets, instead of flexible sizing (`w-full`/`max-w-*`/`min-w-*`) and consumer-controlled placement via `className`.
   - **Props & TypeScript**: an optional prop interpolated into text with no fallback, a declared prop that's never read by the component, a prop that reinvents something a parent/sibling component already provides, `any`.
   - **Accessibility**: an `<img>`/`UiImage` with no real `alt`, or `alt=""` on a non-decorative image.
4. Only report an actual violation of a rule as written. Do not invent new rules, and do not flag something CLAUDE.md explicitly permits — e.g. a one-off arbitrary value with no matching token is allowed per the Styling section; don't flag it just for being an arbitrary value.
5. Report findings with the `ReportFindings` tool: `file`, `line`, `summary` (name the specific CLAUDE.md rule violated), `failure_scenario` (what breaks or looks wrong as a result), `category` set to the CLAUDE.md section the rule lives in (`component-structure`, `styling-tokens`, `layout-positioning`, `props-typescript`, `accessibility`).
6. If nothing violates any rule, report an empty findings list rather than manufacturing something to say.
