ALTER TABLE "orders" ADD COLUMN "preview_token" text;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_preview_token_unique" UNIQUE("preview_token");