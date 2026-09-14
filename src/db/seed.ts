import { sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, reviews } from "@/db/schema";
import { reviewsForProduct, seedCategories, seedProducts } from "@/db/seed-data";

let seedPromise: Promise<void> | null = null;

async function runSeed() {
  const [row] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(products);

  if ((row?.count ?? 0) > 0) return;

  await db.insert(categories).values(seedCategories).onConflictDoNothing();

  await db
    .insert(products)
    .values(
      seedProducts.map((p) => ({
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        categorySlug: p.categorySlug,
        summary: p.summary,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        images: p.images,
        highlights: p.highlights,
        tags: p.tags,
        colors: p.colors,
        stock: p.stock,
        featured: p.featured ?? false,
        badge: p.badge ?? null,
      })),
    )
    .onConflictDoNothing();

  const allReviews = seedProducts.flatMap((p, i) => reviewsForProduct(p.slug, i));
  await db.insert(reviews).values(allReviews);
}

export function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = runSeed().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}
