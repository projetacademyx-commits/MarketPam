import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, orderItems, orders, products, reviews, shipmentTracking } from "@/db/schema";
import type { Category, Order, OrderItem, Product, Review, ShipmentTracking } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";

export type ProductWithStats = Product & { rating: number; reviewCount: number };

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "rating";

export type ProductFilters = {
  category?: string[];
  tags?: string[];
  brands?: string[];
  maxPrice?: number;
  minPrice?: number;
  q?: string;
  sort?: SortKey;
  limit?: number;
};

async function ratingMap() {
  const rows = await db
    .select({
      slug: reviews.productSlug,
      avg: sql<number>`cast(avg(${reviews.rating}) as double precision)`,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(reviews)
    .groupBy(reviews.productSlug);

  const map = new Map<string, { rating: number; reviewCount: number }>();
  for (const r of rows) {
    map.set(r.slug, { rating: Number(r.avg ?? 0), reviewCount: Number(r.count ?? 0) });
  }
  return map;
}

function withStats(list: Product[], map: Map<string, { rating: number; reviewCount: number }>) {
  return list.map((p) => ({
    ...p,
    rating: map.get(p.slug)?.rating ?? 0,
    reviewCount: map.get(p.slug)?.reviewCount ?? 0,
  }));
}

export async function getCategories(): Promise<Category[]> {
  await ensureSeeded();
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  await ensureSeeded();
  const [row] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return row;
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductWithStats[]> {
  await ensureSeeded();

  const conditions = [];
  if (filters.category?.length) conditions.push(inArray(products.categorySlug, filters.category));
  if (filters.brands?.length) conditions.push(inArray(products.brand, filters.brands));
  if (typeof filters.minPrice === "number") conditions.push(gte(products.price, filters.minPrice));
  if (typeof filters.maxPrice === "number") conditions.push(lte(products.price, filters.maxPrice));
  if (filters.q) {
    const term = `%${filters.q}%`;
    conditions.push(
      or(ilike(products.name, term), ilike(products.summary, term), ilike(products.brand, term)),
    );
  }
  if (filters.tags?.length) {
    const tagConditions = filters.tags.map(
      (tag) => sql`${products.tags} @> ${JSON.stringify([tag])}::jsonb`,
    );
    conditions.push(or(...tagConditions));
  }

  const sortKey: SortKey = filters.sort ?? "featured";
  const orderBy =
    sortKey === "price-asc"
      ? [asc(products.price)]
      : sortKey === "price-desc"
        ? [desc(products.price)]
        : sortKey === "newest"
          ? [desc(products.createdAt), desc(products.id)]
          : [desc(products.featured), asc(products.id)];

  const rows = await db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(...orderBy);

  const map = await ratingMap();
  let result = withStats(rows, map);

  if (sortKey === "rating") {
    result = result.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  }
  if (filters.limit) result = result.slice(0, filters.limit);
  return result;
}

export async function getFeaturedProducts(limit = 8): Promise<ProductWithStats[]> {
  await ensureSeeded();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.featured, true))
    .orderBy(asc(products.id))
    .limit(limit);
  const map = await ratingMap();
  return withStats(rows, map);
}

export async function getProductBySlug(slug: string): Promise<ProductWithStats | undefined> {
  await ensureSeeded();
  const [row] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!row) return undefined;
  const map = await ratingMap();
  return withStats([row], map)[0];
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<ProductWithStats[]> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.categorySlug, product.categorySlug))
    .orderBy(asc(products.id));
  const map = await ratingMap();
  return withStats(
    rows.filter((p) => p.slug !== product.slug),
    map,
  ).slice(0, limit);
}

export async function getReviews(slug: string): Promise<Review[]> {
  await ensureSeeded();
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.productSlug, slug))
    .orderBy(desc(reviews.createdAt));
}

export async function getBrands(): Promise<string[]> {
  await ensureSeeded();
  const rows = await db
    .select({ brand: products.brand })
    .from(products)
    .groupBy(products.brand)
    .orderBy(asc(products.brand));
  return rows.map((r) => r.brand);
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  if (!slugs.length) return [];
  await ensureSeeded();
  return db.select().from(products).where(inArray(products.slug, slugs));
}

export async function getOrder(
  orderNumber: string,
): Promise<{ order: Order; items: OrderItem[]; tracking: ShipmentTracking | null } | undefined> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!order) return undefined;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderNumber, orderNumber));
  const [tracking] = await db
    .select()
    .from(shipmentTracking)
    .where(eq(shipmentTracking.orderNumber, orderNumber))
    .limit(1);
  return { order, items, tracking: tracking ?? null };
}
