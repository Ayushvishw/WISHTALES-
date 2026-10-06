# Wish Tale

Personalized, interactive celebration experiences that customers create, pay for, and share as one link. This repository is the web platform described in *Personalized Interactive Wishes Platform — Developer Requirements v1.0*. The first release covers Birthday, with three templates.

## How it fits together

```
Template version (JSON config) + personalization values + photos + music id  →  Experience
```

- **Templates are data.** Each template is a versioned config (`src/lib/templates/catalog`) with its theme, fields, photo rules, music default and ordered scenes. Configs are validated by `src/lib/templates/schema.ts` and stored in `template_versions`. Published versions are immutable, and every order points at the exact version it was bought with.
- **One engine renders every template.** `src/experience` holds the scene library (`hold`, `greeting`, `photos`, `puzzle`, `message`, `ritual`, `closing`) and the puzzle library (`scratch`, `swap`, `match`). A new template is normally just a new config.
- **Music is a separate layer.** Orders store a music id. Built-in tracks are synthesized in the browser (`builtin:hbd` is the public-domain Happy Birthday melody), so no licensed audio is bundled. Licensed files can be added to `music_tracks` later with a storage key.
- **Orders follow the documented lifecycle** (`src/lib/orders/state.ts`): `DRAFT → PREVIEW_READY → CHECKOUT_STARTED → PAYMENT_PENDING → PAID → PROCESSING → ACTIVE`, plus `EXPIRED`, `REFUNDED`, `CANCELLED`. Only a verified payment webhook can move an order to `PAID`. Webhook events are recorded by id in the same transaction as their effects, so duplicates are no-ops.
- **Links** are `/w/<22-character random token>`. The public page loads only the template config, resolved values, photo URLs and music source, with no ids, prices or contact details.
- **Photos** are validated by decoded format, size and dimensions, then re-encoded to WebP (1600 px, plus a 400 px thumbnail). This strips EXIF and location data. They are stored under random keys and served through `/api/media`.
- **Creators don't need accounts.** A draft is identified by a secret 32-character key in its URL (`/d/<key>`), which is also how a creator returns to their link.

## Stack

Next.js 16 (App Router, TypeScript) · PostgreSQL with Drizzle ORM · S3-compatible storage (Cloudflare R2 or S3) with sharp · Razorpay · Vercel.

Local development needs no services: without `DATABASE_URL` the app uses an embedded PGlite database in `.data/db`, without `S3_BUCKET` uploads go to `.data/uploads`, and without Razorpay keys a mock provider sends signed test webhooks through the real verification path.

## Getting started

```bash
npm install
npm run setup      # apply migrations and seed occasions, music and the 3 Birthday templates
npm run dev        # http://localhost:3000
```

Other commands:

```bash
npm test           # unit tests + order/payment integration tests (in-memory database)
npm run lint       # type check
npm run build
npm run db:generate  # create a migration after editing src/db/schema.ts
```

Copy `.env.example` to `.env.local` for production-like settings. In production, set `APP_URL`, `DATABASE_URL`, the `S3_*` variables and the `RAZORPAY_*` variables. Without the Razorpay keys the site runs in **demo mode**: payment is simulated, and every page shows a "Demo" banner. Add the keys to take real payments. Point the Razorpay webhook at `/api/payments/webhook` with the `payment.captured` and `payment.failed` events.

## Adding a template

1. Add a config to `src/lib/templates/catalog/index.ts`, or a new version of an existing one. Never edit a published version in place.
2. Run `npm test`. The schema check catches duplicate keys, missing required fields and puzzles that point at optional photo slots.
3. Run `npm run db:seed`. It inserts only versions that don't exist yet.

## Deploying on Vercel

1. Import the GitHub repository in Vercel. The framework is detected as Next.js.
2. In the project's **Storage** tab, create a **Neon** Postgres database and a **Blob** store (choose Private), and connect both to the project. They set `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` automatically.
3. In **Settings → Environment Variables**, add `ADMIN_SETUP_CODE` (any long random text). Add the three `RAZORPAY_*` keys when you're ready for real payments; until then the site runs in demo mode.
4. Deploy. On production deploys the `vercel-build` script applies migrations, seeds the catalog (idempotent, never edits published versions), then builds. Preview deploys only build: they share the production database, so they must never change it.
5. Open `/admin` to create the owner account, and point the Razorpay webhook at `https://<your-domain>/api/payments/webhook` with the `payment.captured` and `payment.failed` events.

Share links use `APP_URL` if set, otherwise the Vercel production domain.

## Admin panel

`/admin` is the operations panel (section 16 of the requirements):

- **Overview:** revenue, live surprises, payments in progress, and a 30-day funnel built from the analytics events.
- **Orders:** search by order number, share link or recipient name, and filter by state. An order page shows what the customer wrote, their photos, payments and history. From there you can switch a link off or back on, or record a refund. The refund itself is issued in Razorpay first.
- **Templates:** show or hide a template, change its price, choose which version is live, or create a new version from its settings. Every change creates a new version. Paid orders keep the version they were bought with.
- **Occasions and music:** set an occasion to live, coming soon or hidden, and retire or restore music tracks.
- **Team** (owners only): add accounts as owner, editor or support, and remove them.
- **Activity log** (owners only): every admin change and payment warning.

Roles: owners can do everything. Editors manage templates, occasions and music. Support manages orders and links. Passwords are hashed with scrypt. Sessions are random tokens in an httpOnly cookie, and only their SHA-256 hash is stored. Sign-in attempts are rate limited.

**First account.** Set `ADMIN_SETUP_CODE` in the environment and open `/admin`. While no accounts exist, the page asks for that code and creates the owner. Developers can also run `npm run admin:create -- you@example.com owner "a long password"`.

## Not built yet

- Retention job that deletes photos after the agreed period (proposed: 12 months).
- A shared rate-limit store for multi-instance deploys. The current limiter is in-memory.
