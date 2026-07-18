# design-sync notes — SellersPlace

- 2026-07-18: First formal sync (spec-first, per user). Target project
  "SellersPlace Design System" (re-adopted — it was hand-seeded from this
  session the day before).
- This repo is a **Next.js app**, not a component-library package: no
  Storybook, no `dist/`, components are server-coupled (Prisma, server
  actions, next/link). The standard converter flow does not apply.
- Layout is therefore hand-produced: `styles.css` (entry) → `@import
  colors_and_type.css` (all tokens + component recipes), `preview/*.html`
  cards with first-line `@dsCard` markers, README with conventions header.
- **Not uploaded**: `_ds_bundle.js` / compiled components. Next iteration
  option: extract browser-safe presentational components (ProductCard,
  Stars, badges, chips) into an esbuild bundle with next/link stubbed.
- Verification honesty: preview cards were sanity-checked (token refs
  resolve against the stylesheet; @dsCard markers present) but not
  pixel-graded in a browser — no headless browser available in this
  environment.
- Source of truth in-app: `src/app/globals.css`, `src/config/store.ts`,
  `src/components/admin/StatusBadge.tsx` (status colors).
- Keep app and DS in lockstep: any change to globals.css tokens/recipes
  should be mirrored in the project's colors_and_type.css and vice versa.
