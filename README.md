# SellersPlace

A customizable, installable e-commerce PWA. One codebase, deployed once per client and
re-skinned via config — doubles as a normal website and an installable app (Android via
Chrome's install prompt / "Add to Home Screen", iOS via Safari "Add to Home Screen").

## Stack

- **Next.js 16** (App Router, Turbopack, TypeScript)
- **Tailwind CSS v4**
- **Prisma 7** + PostgreSQL, via the `@prisma/adapter-pg` driver adapter
- **Paystack** for payments
- **web-push** for order-status push notifications
- Native `app/manifest.ts` + hand-written `public/sw.js` for PWA installability (no
  `next-pwa` dependency, to avoid Turbopack compatibility issues)

> **Prisma 7 note:** Prisma 7 moved connection URLs out of `schema.prisma` and into
> `prisma.config.ts`, and now requires instantiating `PrismaClient` with a driver adapter
> (`@prisma/adapter-pg` here) rather than a bare `new PrismaClient()`. Both are already set
> up in this repo (`prisma.config.ts` and `src/lib/prisma.ts`) — just make sure `DATABASE_URL`
> is set in `.env` before running any Prisma command.

## Setup (in order)

```bash
# 1. Clone the repo (skip if you already have it locally — just `git pull` instead)
git clone https://github.com/alphadevking/sellersplace.git
cd sellersplace

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# open .env and fill in real values — see "Environment variables" below

# 4. Generate VAPID keys for push notifications
pnpm dlx web-push generate-vapid-keys
# paste the output into NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env

# 5. Generate the Prisma client
pnpm dlx prisma generate

# 6. Run the first migration to create your database tables
pnpm dlx prisma migrate dev --name init

# 7. Start the dev server
pnpm dev
```

Then open `http://localhost:3000` — you should see the SellersPlace home page with
placeholder products.

## Environment variables

```dotenv
# Database (used by both Prisma Client at runtime and prisma.config.ts for the CLI)
DATABASE_URL="postgresql://user:password@localhost:5432/sellersplace?schema=public"

# Paystack
PAYSTACK_SECRET_KEY="sk_test_xxxxxxxxxxxx"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_xxxxxxxxxxxx"

# Auth
AUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Web Push (VAPID keys — from step 4 above)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:admin@sellersplace.app"

# Store branding (per-client customization)
NEXT_PUBLIC_STORE_NAME="SellersPlace"
NEXT_PUBLIC_STORE_PRIMARY_COLOR="#DC2626"
```

## Re-skinning for a new client

1. Edit `src/config/store.ts` (or just the env vars it reads) — store name, brand color, currency.
2. Swap `public/icons/*` with the client's logo assets (192px, 512px, and a 512px maskable icon).
3. Point `.env` at the client's own `DATABASE_URL` and Paystack keys.
4. Deploy.

## Project structure

```
src/app/(storefront)/   # customer-facing routes: home, categories, product, cart, checkout, orders
src/app/admin/          # admin dashboard: products, orders, customers, dashboard
src/app/api/            # checkout, Paystack webhook, order status updates, push subscribe
src/lib/                # prisma client, paystack helpers, push helpers, currency formatting
src/config/store.ts     # branding/config — the main file to edit per client
prisma/schema.prisma    # Product, Category, Order, OrderItem, OrderStatusEvent, User, etc.
prisma.config.ts        # Prisma 7 CLI config (connection URL, migrations path)
```

## Status / what's built so far

- [x] Project scaffold, Tailwind theming driven by CSS variables (brand color configurable)
- [x] Prisma schema: users, addresses, categories, products, orders (with status history), wishlist, push subscriptions
- [x] Storefront home page, bottom nav, header/search shell
- [x] Paystack checkout initialization + webhook handler (signature-verified)
- [x] Push notification sending on payment confirmation and order status changes
- [x] PWA manifest + service worker (offline shell caching + push handling)
- [x] Prisma 7 migration (adapter-pg, prisma.config.ts, serverExternalPackages)
- [ ] Admin dashboard UI (routes scaffolded, not yet built)
- [ ] Customer auth (login/signup)
- [ ] Product detail, cart, checkout UI (currently placeholder data on the home page)
- [ ] Order tracking timeline UI
- [ ] Seed script for local dev data

## Known TODOs

- `src/app/api/orders/[id]/status/route.ts` is currently unauthenticated — admin-only auth
  middleware needs to be added before production use.
