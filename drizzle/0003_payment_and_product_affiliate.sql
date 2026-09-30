-- Migration 0003 : Support Paiements (Visa/Mastercard, COD + GPS) et Affiliation Produits
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "affiliate_url" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_affiliate" boolean NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" varchar(60) NOT NULL DEFAULT 'card';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "card_brand" varchar(40);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "latitude" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "longitude" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "location_accuracy" text;
