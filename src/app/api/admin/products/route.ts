import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { adminProductSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireAdmin();

    const list = await db.select().from(products).orderBy(desc(products.id));
    return NextResponse.json({ products: list });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    }
    console.error("Erreur admin products GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = adminProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données de produit invalides" },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Vérifier unicité du slug
    const [existing] = await db.select().from(products).where(eq(products.slug, data.slug)).limit(1);
    if (existing) {
      return NextResponse.json(
        { error: "Un produit avec cet identifiant unique (slug) existe déjà." },
        { status: 400 },
      );
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        slug: data.slug,
        name: data.name,
        brand: data.brand,
        categorySlug: data.categorySlug,
        summary: data.summary,
        description: data.description,
        price: data.price,
        compareAtPrice: data.compareAtPrice ?? null,
        images: data.images,
        highlights: data.highlights,
        tags: data.tags,
        colors: data.colors,
        stock: data.stock,
        featured: data.featured,
        badge: data.badge ?? null,
      })
      .returning();

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    }
    console.error("Erreur admin products POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
