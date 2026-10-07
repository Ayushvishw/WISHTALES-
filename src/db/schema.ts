import { sql } from "drizzle-orm";
import {
  bigserial, boolean, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { ORDER_STATES } from "@/lib/orders/state";
import type { TemplateConfig } from "@/lib/templates/schema";

const id = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const orderState = pgEnum("order_state", ORDER_STATES);
export const publishStatus = pgEnum("publish_status", ["draft", "published", "unpublished", "archived"]);

export const occasions = pgTable("occasions", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  status: text("status", { enum: ["live", "coming_soon", "hidden"] }).notNull().default("coming_soon"),
  sort: integer("sort").notNull().default(0),
});

export const templates = pgTable("templates", {
  id: id(),
  occasionId: uuid("occasion_id").notNull().references(() => occasions.id),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  status: publishStatus("status").notNull().default("draft"),
  createdAt: createdAt(),
});

/**
 * Immutable once published. Orders point at a version, so editing a template
 * means publishing a new version; paid experiences never change underneath.
 * Fields, scenes, theme and media rules live inside `config`.
 */
export const templateVersions = pgTable(
  "template_versions",
  {
    id: id(),
    templateId: uuid("template_id").notNull().references(() => templates.id),
    version: text("version").notNull(),
    config: jsonb("config").$type<TemplateConfig>().notNull(),
    priceMinor: integer("price_minor").notNull(),
    currency: text("currency").notNull().default("INR"),
    status: publishStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("template_versions_template_version").on(t.templateId, t.version)],
);

export const musicTracks = pgTable("music_tracks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  /** "builtin:<generator>", "none", or a storage key for an uploaded licensed file. */
  source: text("source").notNull(),
  license: text("license").notNull(),
  status: text("status", { enum: ["active", "retired"] }).notNull().default("active"),
});

export const orders = pgTable(
  "orders",
  {
    id: id(),
    /** Shown to customers and support. Never used for access. */
    reference: text("reference").notNull().unique(),
    /** Secret capability that lets the creator edit their draft without an account. */
    draftKey: text("draft_key").notNull().unique(),
    templateVersionId: uuid("template_version_id").notNull().references(() => templateVersions.id),
    state: orderState("state").notNull().default("DRAFT"),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().default("INR"),
    musicId: text("music_id").references(() => musicTracks.id),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    /** Secret, view-only link to the watermarked preview, for showing family before paying. Never allows edits. */
    previewToken: text("preview_token").unique(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("orders_state").on(t.state)],
);

export const personalizations = pgTable("personalizations", {
  orderId: uuid("order_id").primaryKey().references(() => orders.id, { onDelete: "cascade" }),
  values: jsonb("values").$type<Record<string, string>>().notNull().default({}),
  updatedAt: updatedAt(),
});

export const media = pgTable(
  "media",
  {
    id: id(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["photo", "audio"] }).notNull(),
    /** Random object key. Customer file names are never used. */
    storageKey: text("storage_key").notNull().unique(),
    thumbKey: text("thumb_key"),
    position: integer("position").notNull(),
    width: integer("width"),
    height: integer("height"),
    bytes: integer("bytes"),
    contentType: text("content_type").notNull(),
    /** Display name for an uploaded song, cleaned from the file name. */
    title: text("title"),
    createdAt: createdAt(),
  },
  (t) => [index("media_order_position").on(t.orderId, t.position)],
);

/** Guest replies to an invitation. Only the host (through their order page) sees the full list. */
export const rsvps = pgTable(
  "rsvps",
  {
    id: id(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    attending: text("attending", { enum: ["yes", "no", "maybe"] }).notNull(),
    guests: integer("guests").notNull().default(1),
    /** A wish for the hosts. Shown on the invitation's wishes wall unless the host hides it. */
    message: text("message"),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("rsvps_order").on(t.orderId, t.createdAt)],
);

export const payments = pgTable("payments", {
  id: id(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  provider: text("provider").notNull(),
  providerOrderId: text("provider_order_id").notNull().unique(),
  providerPaymentId: text("provider_payment_id"),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  status: text("status", { enum: ["created", "captured", "failed", "refunded"] }).notNull().default("created"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Every webhook event id we have processed. The primary key makes processing idempotent. */
export const paymentEvents = pgTable(
  "payment_events",
  {
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.provider, t.eventId] })],
);

export const publicLinks = pgTable("public_links", {
  id: id(),
  orderId: uuid("order_id").notNull().unique().references(() => orders.id),
  token: text("token").notNull().unique(),
  status: text("status", { enum: ["active", "disabled", "expired"] }).notNull().default("active"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const adminUsers = pgTable("admin_users", {
  id: id(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["owner", "editor", "support"] }).notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

export const auditLog = pgTable("audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  details: jsonb("details"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

/** Product analytics (section 21). Only event names, template slugs and a random visit id. */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    templateSlug: text("template_slug"),
    visitId: text("visit_id"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("analytics_events_name_at").on(t.name, t.at)],
);

/** Admin sign-in sessions. Only a SHA-256 of the session token is stored. */
export const adminSessions = pgTable("admin_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
});
