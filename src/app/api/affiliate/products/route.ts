import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { affiliateProducts } from "@/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";

// GET /api/affiliate/products — catalogue public (sans affiliateUrl)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");

    const conditions = [eq(affiliateProducts.isActive, true)];

    if (category && category !== "all") {
      conditions.push(eq(affiliateProducts.categorySlug, category));
    }

    if (search) {
      conditions.push(
        or(
          ilike(affiliateProducts.name, `%${search}%`),
          ilike(affiliateProducts.brand, `%${search}%`),
          ilike(affiliateProducts.summary, `%${search}%`),
        )!,
      );
    }

    if (featured === "true") {
      conditions.push(eq(affiliateProducts.featured, true));
    }

    const rows = await db
      .select({
        id: affiliateProducts.id,
        slug: affiliateProducts.slug,
        name: affiliateProducts.name,
        brand: affiliateProducts.brand,
        categorySlug: affiliateProducts.categorySlug,
        summary: affiliateProducts.summary,
        description: affiliateProducts.description,
        price: affiliateProducts.price,
        compareAtPrice: affiliateProducts.compareAtPrice,
        images: affiliateProducts.images,
        affiliateSource: affiliateProducts.affiliateSource,
        badge: affiliateProducts.badge,
        featured: affiliateProducts.featured,
        stock: affiliateProducts.stock,
        clickCount: affiliateProducts.clickCount,
        createdAt: affiliateProducts.createdAt,
        // affiliateUrl intentionally omitted
      })
      .from(affiliateProducts)
      .where(and(...conditions))
      .orderBy(affiliateProducts.createdAt);

    return NextResponse.json({ products: rows });
  } catch (err) {
    console.error("[affiliate/products] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
