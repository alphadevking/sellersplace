# Store Onboarding Checklist

Everything a business needs set up to run a SellersPlace store — accounts to
create, keys to collect, and the switches to flip before going live. Written
for the person deploying a store (Nexhub Labs or a licensed operator); the
matching variable names live in [.env.example](.env.example).

**Cost summary:** every service below has a free tier that comfortably runs a
small store. The only unavoidable spend is a custom domain (optional —
`*.vercel.app` works) and Paystack's per-transaction fee.

---

## 1. Required — the store cannot run without these

| Service | What it's for | What you need |
|---|---|---|
| **[Vercel](https://vercel.com)** (free) | Hosting + daily crons | Account connected to the GitHub repo; every env var below entered in Project → Settings → Environment Variables |
| **[Neon](https://neon.tech)** (free) | PostgreSQL database | A project; copy the **pooled** connection string → `DATABASE_URL` (keep `sslmode=require`) |
| **[Paystack](https://paystack.com)** | Payments (cards, transfer, USSD) | Registered business account. `PAYSTACK_SECRET_KEY` + `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (test keys first, live keys at launch) |
| **Auth secret** | Session signing | Generate once: `pnpm dlx auth secret` → `AUTH_SECRET`; set `NEXTAUTH_URL` to the production URL |
| **Site URL** | SEO, sitemap, share cards, copy-links | `NEXT_PUBLIC_SITE_URL` = the deployed origin, no trailing slash |

### Paystack dashboard configuration (per mode — Test and Live separately)

- **Webhook URL:** `https://<your-domain>/api/paystack/webhook`
- **Callback URL:** `https://<your-domain>/account` (fallback only — the app
  sets per-transaction callbacks itself)

---

## 2. Branding — what makes it *their* store

All env-driven; a redeploy applies them everywhere (header, footer, favicon,
PWA install icons, share cards, JSON-LD):

| Variable | What it controls |
|---|---|
| `NEXT_PUBLIC_STORE_NAME` | Store name, everywhere |
| `NEXT_PUBLIC_STORE_PRIMARY_COLOR` | Brand color (hex) — theme, buttons, icons |
| `NEXT_PUBLIC_STORE_LOGO` | Logo URL (upload to Cloudinary) — header, favicon, install icons, OG cards |
| `NEXT_PUBLIC_STORE_KIND` | `retail` \| `services` \| `hybrid` — storefront vocabulary |
| `NEXT_PUBLIC_STORE_HERO_VIDEO` / `_HERO_IMAGE` / `_HERO_HREF` | Home hero / ad slot |
| `NEXT_PUBLIC_STORE_WHATSAPP` / `_PHONE` | Chat-to-order + call buttons + help links |
| `NEXT_PUBLIC_STORE_EXPRESS_BADGE` | Fulfilment wordmark on product cards (optional) |
| `NEXT_PUBLIC_DELIVERY_ETA_DAYS` | Delivery promise, e.g. `"2-5"` business days |

Also review the delivery fee (`deliveryFeeFlat` in
[src/config/store.ts](src/config/store.ts)) — currently a flat ₦ amount.

---

## 3. Recommended — the store runs without them, but weaker

| Service | What it unlocks | Variables |
|---|---|---|
| **[Cloudinary](https://cloudinary.com)** (free) | Product image uploads from the admin dashboard (without it, admins paste image URLs) | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| **Web Push (VAPID)** (free, no account) | Order-status + support-chat push notifications | Generate: `pnpm dlx web-push generate-vapid-keys` → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |
| **Support LLM** (optional, any one) | AI answers in support chat before agent escalation (FAQ bot works without it) | One of `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` / `MISTRAL_API_KEY`; optional `SUPPORT_LLM_PROVIDER`, `SUPPORT_LLM_MODEL` |
| **[Resend](https://resend.com)** (free tier) — *planned* | Email verification at signup, password reset, order-confirmation emails, daily sales digest | `RESEND_API_KEY` (feature in progress — key can be collected now) |

---

## 4. Data setup

1. **Migrate:** `pnpm exec prisma migrate deploy` (or `migrate dev` locally).
2. **Admin account:** seeding creates `admin@sellersplace.app` / `changeme123`
   (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). **Change this
   password immediately** — or create the owner's account via signup and
   promote it (`role = 'ADMIN'`).
3. **Catalog:** add categories and products/services in `/admin` — names,
   prices, images, stock, deposit percentages for bespoke work.

---

## 5. Go-live checklist

- [ ] Paystack switched to **live** keys; webhook + callback set in the Live tab
- [ ] `NEXT_PUBLIC_SITE_URL` points at the final domain
- [ ] Seed admin password changed
- [ ] One **real test order** end-to-end: checkout → pay → status flow →
      delivery confirmation (then refund it in Paystack)
- [ ] One **invoice** test: create in admin → open pay link → pay
- [ ] Install prompt on a phone shows the store's logo
- [ ] Share the homepage + one product on WhatsApp — correct preview cards
      (use Meta's Sharing Debugger to purge a stale cache)
- [ ] [Google Search Console](https://search.google.com/search-console):
      verify the domain, submit `/sitemap.xml`
- [ ] Support chat answered: FAQ replies work; escalation pings the admin
- [ ] `/terms` and `/privacy` reviewed — adjust returns/delivery specifics to
      how this business actually operates

---

## 6. Optional growth steps (when the business is ready)

- **Custom domain** on Vercel (then update `NEXT_PUBLIC_SITE_URL` and
  Paystack URLs)
- **Google Business Profile** — the map/knowledge panel in search results
- **Google Merchant Center** — free product listings in the Shopping tab
- **WhatsApp Business** app on the store's number (the site deep-links to it)
