# Building with SellersPlace

## Setup — one stylesheet, no provider

There is no JS provider or theme wrapper. Everything works once
`styles.css` is loaded (it `@import`s `colors_and_type.css`, which carries
every token and component recipe). Fonts (Geist, Geist Mono) load from
inside that stylesheet. Without it you get unstyled HTML — there is no
partial fallback.

## Styling idiom — CSS custom properties + recipe classes

Style with `var(--*)` tokens and the recipe classes below. **Never
hard-code a brand hex**: the brand hue is a per-merchant variable. Use
`var(--brand)` and its two derived states:

- Colors: `--brand`, `--brand-hover`, `--brand-soft`, `--brand-foreground`,
  `--background`, `--surface`, `--border`, `--muted`, `--foreground`
- Status pairs (bg/fg per state): `--status-pending-*`, `--status-confirmed-*`,
  `--status-processing-*`, `--status-shipped-*`, `--status-delivered-*`,
  `--status-cancelled-*`, `--status-partial-*`, `--status-refunded-*`
- Radius: `--radius-sm` (8px), `--radius-md` (12px — buttons/inputs),
  `--radius-lg` (16px — cards/images), `--radius-full` (chips/badges)
- Type: `--font-sans` (Geist — everything), `--font-mono` (SKUs/codes only);
  sizes `--text-xs` … `--text-5xl`; default UI size is `--text-sm` (14px)
- Spacing: `--space-1` … `--space-10` (4px base)
- Shadows: `--shadow-sm`, `--shadow-lg` (dropdowns only — depth comes from
  the `--surface` tint, not shadows)

Recipe classes (in `colors_and_type.css`): `.btn` + `.btn-primary` /
`.btn-outline` / `.btn-ghost`, `.input-field`, `.card`, `.card-surface`,
`.chip` / `.chip-active`, `.badge` / `.badge-brand`. Type helpers:
`.t-hero`, `.t-page-title`, `.t-section`, `.t-body`, `.t-meta`, `.t-price`,
`.t-code`.

## Where the truth lives

Read `styles.css` → `colors_and_type.css` before styling anything — every
token and recipe above is defined there with comments. Preview cards in
`preview/` show intended composition (cards, badges, chips, buttons,
status vocabulary).

## Idiomatic snippet — product card

```html
<a class="card-surface" style="display:flex; flex-direction:column; gap:4px; padding:var(--space-3); text-decoration:none">
  <div style="position:relative; aspect-ratio:1; border-radius:var(--radius-md); background:var(--background)">
    <span class="badge" style="position:absolute; left:8px; top:8px; background:var(--brand); color:var(--brand-foreground); font-weight:600">-23%</span>
  </div>
  <span class="t-body">Wireless Headphones</span>
  <span><span class="t-price">₦45,999</span>
    <span class="t-meta" style="text-decoration:line-through">₦59,999</span></span>
  <span class="badge badge-brand" style="width:fit-content">Chat to order</span>
</a>
```

Commerce context: prices are NGN (`₦`), offerings can be products **or
services** (services show "Book now" / "From ₦X" / "Request a quote"
instead of Add-to-Cart), and chat-to-order via WhatsApp is a first-class
purchase path.
