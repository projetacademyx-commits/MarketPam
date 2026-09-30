import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 180 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("customer"), // 'customer' | 'admin'
  resetToken: varchar("reset_token", { length: 255 }),
  resetExpires: timestamp("reset_expires", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 180 }).notNull(),
  street: text("street").notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  postalCode: varchar("postal_code", { length: 40 }).notNull(),
  country: varchar("country", { length: 120 }).notNull().default("France"),
  phone: varchar("phone", { length: 40 }),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  brand: varchar("brand", { length: 120 }).notNull().default("MarketPam"),
  categorySlug: varchar("category_slug", { length: 96 }).notNull(),
  summary: text("summary").notNull().default(""),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  compareAtPrice: integer("compare_at_price"),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  colors: jsonb("colors").$type<string[]>().notNull().default([]),
  stock: integer("stock").notNull().default(25),
  featured: boolean("featured").notNull().default(false),
  badge: varchar("badge", { length: 40 }),
  affiliateUrl: text("affiliate_url"),
  isAffiliate: boolean("is_affiliate").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productSlug: varchar("product_slug", { length: 140 }).notNull(),
  author: varchar("author", { length: 120 }).notNull(),
  rating: integer("rating").notNull(),
  title: varchar("title", { length: 180 }).notNull().default(""),
  body: text("body").notNull().default(""),
  verified: boolean("verified").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 24 }).notNull().unique(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  email: varchar("email", { length: 180 }).notNull(),
  fullName: varchar("full_name", { length: 180 }).notNull(),
  address: text("address").notNull().default(""),
  city: varchar("city", { length: 120 }).notNull().default(""),
  postalCode: varchar("postal_code", { length: 40 }).notNull().default(""),
  country: varchar("country", { length: 120 }).notNull().default(""),
  shippingMethod: varchar("shipping_method", { length: 60 }).notNull().default("standard"),
  paymentMethod: varchar("payment_method", { length: 60 }).notNull().default("card"), // 'card' | 'cod'
  cardBrand: varchar("card_brand", { length: 40 }),
  paymentStatus: varchar("payment_status", { length: 40 }).notNull().default("paid"),
  moncashOrderId: varchar("moncash_order_id", { length: 32 }).unique(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  locationAccuracy: text("location_accuracy"),
  subtotal: integer("subtotal").notNull(),
  shipping: integer("shipping").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  total: integer("total").notNull(),
  status: varchar("status", { length: 40 }).notNull().default("confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 24 }).notNull(),
  productSlug: varchar("product_slug", { length: 140 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  imageUrl: text("image_url").notNull().default(""),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export const shipmentTracking = pgTable("shipment_tracking", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 24 })
    .notNull()
    .unique()
    .references(() => orders.orderNumber, { onDelete: "cascade" }),
  carrier: varchar("carrier", { length: 80 }).notNull().default("DHL Express"),
  trackingNumber: varchar("tracking_number", { length: 100 }).notNull().default(""),
  trackingUrl: text("tracking_url").notNull().default(""),
  estimatedDelivery: timestamp("estimated_delivery", { withTimezone: true }),
  currentStatus: varchar("current_status", { length: 60 }).notNull().default("confirmed"),
  statusMessage: text("status_message").notNull().default("Commande validée et enregistrée."),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productSlug: varchar("product_slug", { length: 140 }).notNull(),
  variant: varchar("variant", { length: 120 }),
  quantity: integer("quantity").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sellerListings = pgTable("seller_listings", {
  id: serial("id").primaryKey(),
  sellerName: varchar("seller_name", { length: 160 }).notNull(),
  email: varchar("email", { length: 180 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  categorySlug: varchar("category_slug", { length: 96 }).notNull().default("home"),
  condition: varchar("condition", { length: 40 }).notNull().default("like-new"),
  askingPrice: integer("asking_price").notNull().default(0),
  description: text("description").notNull().default(""),
  status: varchar("status", { length: 40 }).notNull().default("in-review"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Système d'Affiliation B2C ─────────────────────────────────────────────

/**
 * Produits affiliés : fiches catalogue avec lien affilié stocké côté serveur.
 * Le champ `affiliateUrl` n'est JAMAIS renvoyé au client directement.
 */
export const affiliateProducts = pgTable("affiliate_products", {
  id:              serial("id").primaryKey(),
  slug:            varchar("slug", { length: 140 }).notNull().unique(),
  name:            varchar("name", { length: 180 }).notNull(),
  brand:           varchar("brand", { length: 120 }).notNull().default("Externe"),
  categorySlug:    varchar("category_slug", { length: 96 }).notNull().default("home"),
  summary:         text("summary").notNull().default(""),
  description:     text("description").notNull().default(""),
  price:           integer("price").notNull(),           // en centimes ex: 4999 = 49,99€
  compareAtPrice:  integer("compare_at_price"),
  images:          jsonb("images").$type<string[]>().notNull().default([]),
  // ⚠️  Ce champ ne doit jamais être exposé dans les réponses publiques
  affiliateUrl:    text("affiliate_url").notNull(),
  affiliateSource: varchar("affiliate_source", { length: 60 }).notNull().default("aliexpress"),
  badge:           varchar("badge", { length: 40 }),
  featured:        boolean("featured").notNull().default(false),
  stock:           integer("stock").notNull().default(999), // stock virtuel/illimité
  isActive:        boolean("is_active").notNull().default(true),
  clickCount:      integer("click_count").notNull().default(0),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Tracking des clics affiliés : chaque clic sur "Acheter" crée une ligne.
 * Permet de prouver les conversions et calculer les commissions estimées.
 */
export const affiliateClicks = pgTable("affiliate_clicks", {
  id:          serial("id").primaryKey(),
  productId:   integer("product_id")
    .notNull()
    .references(() => affiliateProducts.id, { onDelete: "cascade" }),
  productName: varchar("product_name", { length: 180 }).notNull(),
  priceShown:  integer("price_shown").notNull(),          // prix affiché au moment du clic
  userId:      integer("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId:   varchar("session_id", { length: 128 }),    // hash anonyme si non connecté
  ipAddress:   varchar("ip_address", { length: 64 }),
  userAgent:   text("user_agent"),
  referrer:    text("referrer"),
  clickedAt:   timestamp("clicked_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  idxProductId: index("idx_aff_clicks_product_id").on(t.productId),
  idxClickedAt: index("idx_aff_clicks_clicked_at").on(t.clickedAt),
}));

// ─── Type Exports ────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type ShipmentTracking = typeof shipmentTracking.$inferSelect;
export type CartItemRecord = typeof cartItems.$inferSelect;
export type AffiliateProduct = typeof affiliateProducts.$inferSelect;
export type NewAffiliateProduct = typeof affiliateProducts.$inferInsert;
export type AffiliateClick = typeof affiliateClicks.$inferSelect;
