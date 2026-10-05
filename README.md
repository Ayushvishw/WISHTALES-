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

Copy `.env.example` to `.env.local` for production-like settings. In production, set `APP_URL`, `DATABASE_URL`, the `S3_*` variables and the `RAZORPAY_*` variables. The app refuses mock payments in production unless `ALLOW_MOCK_PAYMENTS` is set (for staging only). Point the Razorpay webhook at `/api/payments/webhook` with the `payment.captured` and `payment.failed` events.

## Adding a template

1. Add a config to `src/lib/templates/catalog/index.ts`, or a new version of an existing one. Never edit a published version in place.
2. Run `npm test`. The schema check catches duplicate keys, missing required fields and puzzles that point at optional photo slots.
3. Run `npm run db:seed`. It inserts only versions that don't exist yet.

## Not built yet

- Admin panel (section 16): templates, versions, pricing, orders, disabling links, audit log viewer. The `admin_users` and `audit_log` tables are in place.
- Retention job that deletes photos after the agreed period (proposed: 12 months).
- A shared rate-limit store for multi-instance deploys. The current limiter is in-memory.
