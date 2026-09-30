ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" varchar(40) DEFAULT 'paid' NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "moncash_order_id" varchar(32);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_moncash_order_id_unique" ON "orders" ("moncash_order_id");