import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { affiliateProducts, affiliateClicks } from "@/db/schema";
import { desc, count, sum } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/affiliate — liste tous les produits affiliés (avec l'URL affiliée — admin seulement)
export async function GET() {
  try {
    await requireAdmin();

    const rows = await db
      .select()
      .from(affiliateProducts)
      .orderBy(desc(affiliateProducts.createdAt));

    return NextResponse.json({ products: rows });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    console.error("[admin/affiliate GET] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/admin/affiliate — créer un nouveau produit affilié
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const {
      name,
      slug,
      brand,
      categorySlug,
      summary,
      description,
      price,
      compareAtPrice,
      images,
      affiliateUrl,
      affiliateSource,
      badge,
      featured,
      stock,
      isActive,
    } = body;

    if (!name || !slug || !affiliateUrl || !price) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants: name, slug, affiliateUrl, price" },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(affiliateProducts)
      .values({
        name: String(name),
        slug: String(slug),
        brand: brand ? String(brand) : "Externe",
        categorySlug: categorySlug ? String(categorySlug) : "home",
        summary: summary ? String(summary) : "",
        description: description ? String(description) : "",
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        images: Array.isArray(images) ? images : [],
        affiliateUrl: String(affiliateUrl),
        affiliateSource: affiliateSource ? String(affiliateSource) : "aliexpress",
        badge: badge ? String(badge) : null,
        featured: Boolean(featured),
        stock: stock ? Number(stock) : 999,
        isActive: isActive !== false,
      })
      .returning();

    return NextResponse.json({ product: created }, { status: 201 });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    if (err?.code === "23505")
      return NextResponse.json({ error: "Ce slug est déjà utilisé" }, { status: 409 });
    console.error("[admin/affiliate POST] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
