# SellerSpace

A customizable, installable e-commerce PWA — one storefront + admin dashboard codebase,
re-skinned per client via `src/config/store.ts` and env vars. Doubles as a normal website
and an installable app (Android via "Add to Home Screen" / Chrome install prompt, iOS via
Safari "Add to Home Screen").

## Stack

- **Next.js 16** (App Router, Turbopack, TypeScript)
- **Tailwind CSS v4**
- **Prisma** + PostgreSQL
- **Paystack** for payments
- **web-push** for order-status push notifications
- Native `app/manifest.ts` + hand-written `public/sw.js` for PWA installability (no `next-pwa`
  dependency, to avoid Turbopack compatibility issues)

## Getting started

```bash
npm install
cp .env.example .env   # then fill in real values
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

> **Note:** `npx prisma generate` needs to reach `binaries.prisma.sh` to download query engine
> binaries. If you're working in a network-restricted sandbox, run this step in your Codespace,
> local machine, or CI instead — it's a one-time step per environment.

## Generating VAPID keys for push notifications

```bash
npx web-push generate-vapid-keys
```

Put the output in `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.

## Re-skinning for a new client

1. Edit `src/config/store.ts` (or just the env vars it reads) — store name, brand color, currency.
2. Swap `public/icons/*` with the client's logo assets (192px, 512px, and a 512px maskable icon).
3. Update `.env` with the client's own `DATABASE_URL` and Paystack keys.
4. Deploy.

## Project structure

```
src/app/(storefront)/   # customer-facing routes: home, categories, product, cart, checkout, orders
src/app/admin/          # admin dashboard: products, orders, customers, dashboard
src/app/api/            # checkout, Paystack webhook, order status updates, push subscribe
src/lib/                # prisma client, paystack helpers, push helpers, currency formatting
src/config/store.ts     # branding/config — the main file to edit per client
prisma/schema.prisma    # Product, Category, Order, OrderItem, OrderStatusEvent, User, etc.
```

## Status / what's built so far

- [x] Project scaffold, Tailwind theming driven by CSS variables (brand color configurable)
- [x] Prisma schema: users, addresses, categories, products, orders (with status history), wishlist, push subscriptions
- [x] Storefront home page, bottom nav, header/search shell
- [x] Paystack checkout initialization + webhook handler (signature-verified)
- [x] Push notification sending on payment confirmation and order status changes
- [x] PWA manifest + service worker (offline shell caching + push handling)
- [ ] Admin dashboard UI (routes scaffolded, not yet built)
- [ ] Customer auth (login/signup)
- [ ] Product detail, cart, checkout UI (currently placeholder data on the home page)
- [ ] Order tracking timeline UI
- [ ] Seed script for local dev data

## Auth note

Order status routes are currently unauthenticated — there's a `TODO` in
`src/app/api/orders/[id]/status/route.ts` marking where admin-only auth middleware needs to be
added before production use.
