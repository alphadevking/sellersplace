# SellersPlace

A customizable, installable e-commerce PWA. One codebase, deployed once per client and
re-skinned via config — doubles as a normal website and an installable app (Android via
Chrome's install prompt / "Add to Home Screen", iOS via Safari "Add to Home Screen").

Built and licensed by [Nexhub Labs](https://nexhublabs.vercel.app) — putting small
businesses online without big-website costs. **Live demo:**
[sellersplace.vercel.app](https://sellersplace.vercel.app)

## Licensing

This repository is **source-available, not open source**. The code is public for
transparency and evaluation; deploying it as a live store requires a commercial
license per store.

- [LICENSE](LICENSE) — the terms
- [LICENSING.md](LICENSING.md) — how per-store licensing works
- Get your business online: [nexhublabs@gmail.com](mailto:nexhublabs@gmail.com)

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

Then open `http://localhost:3005` — you should see the SellersPlace home page with
placeholder products.

## Environment variables

```dotenv
# Database (used by both Prisma Client at runtime and prisma.config.ts for the CLI)
# Local Postgres:
DATABASE_URL="postgresql://user:password@localhost:5432/sellersplace?schema=public"
# Or a hosted Neon database (use the pooled connection string, keep sslmode=require):
# DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Paystack
PAYSTACK_SECRET_KEY="sk_test_xxxxxxxxxxxx"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_xxxxxxxxxxxx"

# Auth
AUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3005"

# Web Push (VAPID keys — from step 4 above)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:admin@sellersplace.app"

# Store branding (per-client customization)
NEXT_PUBLIC_STORE_NAME="SellersPlace"
NEXT_PUBLIC_STORE_PRIMARY_COLOR="#DC2626"
```

## Database notes (Neon / hosted Postgres)

- When `DATABASE_URL` points at a `*.neon.tech` host, the app automatically connects through
  Neon's serverless driver — Postgres tunneled over a **WebSocket on port 443** — instead of
  raw TCP on port 5432 (`src/lib/db-adapter.ts`). Many home/office networks block outbound
  5432, which shows up as Prisma error P1001 *"Can't reach database server"*; 443 is
  essentially always open. Local/other Postgres hosts keep using node-postgres directly.
- The Prisma **CLI** (`prisma migrate`, `db seed` runs through the app adapter, but `migrate`
  does not) still connects over TCP 5432. If migrations fail with P1001 on your network,
  run them from a network that allows 5432, or use Neon's SQL editor to apply the migration
  SQL by hand.
- If you still can't connect, check in this order:
  1. **Is the Neon compute active?** Free-tier databases suspend after inactivity — open the
     project in the Neon console and retry (first request after a cold start can be slow).
  2. **Password correct / recently rotated?** Auth failures and unreachable errors look
     different — P1001 is network, P1000 is credentials.
  3. **Firewall/VPN blocking 5432?** Test with `psql "<your-connection-string>"` — if psql
     can't connect either, it's the network, not the app.
- Never commit a real connection string to `.env.example` or anywhere else in the repo —
  `.env` is gitignored for a reason. If a credential does leak into git history, rotate the
  database password immediately in the Neon console.

## Re-skinning for a new client

1. Edit the env vars `src/config/store.ts` reads — store name, brand color, logo URL,
   hero media, contact channels, vocabulary (`NEXT_PUBLIC_STORE_*`).
2. Icons are generated automatically from `NEXT_PUBLIC_STORE_LOGO` (favicon,
   apple-touch, PWA install icons, OG cards) — no image assets to prepare.
3. Point `.env` at the client's own `DATABASE_URL` and Paystack keys.
4. Deploy.

The "Built by Nexhub Labs" attribution is part of the product and stays across
re-skins (see [LICENSE](LICENSE) §2c); white-label is a licensed upgrade.

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
- [x] Storefront: home, categories, product listing/detail — all wired to Prisma (no more placeholder data)
- [x] Cart (localStorage-backed) and guest/logged-in checkout, both hitting the Paystack API
- [x] Customer auth (Auth.js v5, email + password) — signup, login, session-aware header, account page with order history
- [x] Order tracking timeline UI at `/orders/[id]`
- [x] Paystack checkout initialization + webhook handler (signature-verified)
- [x] Push notification sending on payment confirmation and order status changes
- [x] PWA manifest + service worker (offline shell caching + push handling)
- [x] Prisma 7 migration (adapter-pg, prisma.config.ts, serverExternalPackages)
- [x] Seed script (`pnpm dlx prisma db seed`) for local dev data — includes a dev admin user
- [x] Admin dashboard: stats, orders (list/detail/status updates with customer push), products
      (create/edit/publish toggle), customers — role-guarded (ADMIN/STAFF)
- [x] Wishlist: heart button on product cards + detail page (Etsy-style), `/wishlist` page,
      synced per-account
- [ ] Google sign-in (structured so it can slot in later — see note in `src/lib/auth.ts`)

## Auth notes

- Using Auth.js v5 with a Credentials provider only (no OAuth yet), JWT sessions — no database
  adapter/extra tables needed for this. `src/lib/auth.ts` has a comment on what changes when
  Google sign-in gets added later.
- Guest checkout still works for anyone who doesn't want to create an account: it finds-or-creates
  a `User` row by email with `isGuest: true` and no password. Signing up later with that same email
  "claims" the guest account (attaches the password, flips `isGuest` to false) rather than creating
  a duplicate — past orders stay attached.
- Sessions now carry the user's `role`; `/admin` (and the order-status API route) are guarded
  to `ADMIN`/`STAFF` via `src/lib/admin.ts`.
- The seed script creates a dev admin (`admin@sellersplace.app` / `changeme123`, overridable
  with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) — change this before any real deployment.
  You can also promote any user by setting `role = 'ADMIN'` on their row.
