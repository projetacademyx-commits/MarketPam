-- Migration 0002 : Système d'Affiliation B2C
-- Crée les tables affiliate_products et affiliate_clicks

-- Table des produits affiliés
CREATE TABLE IF NOT EXISTS "affiliate_products" (
  "id"               SERIAL PRIMARY KEY,
  "slug"             VARCHAR(140) NOT NULL UNIQUE,
  "name"             VARCHAR(180) NOT NULL,
  "brand"            VARCHAR(120) NOT NULL DEFAULT 'Externe',
  "category_slug"    VARCHAR(96)  NOT NULL DEFAULT 'home',
  "summary"          TEXT         NOT NULL DEFAULT '',
  "description"      TEXT         NOT NULL DEFAULT '',
  "price"            INTEGER      NOT NULL,
  "compare_at_price" INTEGER,
  "images"           JSONB        NOT NULL DEFAULT '[]',
  "affiliate_url"    TEXT         NOT NULL,
  "affiliate_source" VARCHAR(60)  NOT NULL DEFAULT 'aliexpress',
  "badge"            VARCHAR(40),
  "featured"         BOOLEAN      NOT NULL DEFAULT false,
  "stock"            INTEGER      NOT NULL DEFAULT 999,
  "is_active"        BOOLEAN      NOT NULL DEFAULT true,
  "click_count"      INTEGER      NOT NULL DEFAULT 0,
  "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Table de tracking des clics
CREATE TABLE IF NOT EXISTS "affiliate_clicks" (
  "id"           SERIAL PRIMARY KEY,
  "product_id"   INTEGER NOT NULL REFERENCES "affiliate_products"("id") ON DELETE CASCADE,
  "product_name" VARCHAR(180) NOT NULL,
  "price_shown"  INTEGER NOT NULL,
  "user_id"      INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "session_id"   VARCHAR(128),
  "ip_address"   VARCHAR(64),
  "user_agent"   TEXT,
  "referrer"     TEXT,
  "clicked_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les stats rapides
CREATE INDEX IF NOT EXISTS "idx_aff_clicks_product_id" ON "affiliate_clicks"("product_id");
CREATE INDEX IF NOT EXISTS "idx_aff_clicks_clicked_at" ON "affiliate_clicks"("clicked_at" DESC);
