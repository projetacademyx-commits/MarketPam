import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { affiliateProducts, affiliateClicks } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/affiliate/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const productId = Number(id);

    const [product] = await db
      .select()
      .from(affiliateProducts)
      .where(eq(affiliateProducts.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const recentClicks = await db
      .select()
      .from(affiliateClicks)
      .where(eq(affiliateClicks.productId, productId))
      .orderBy(desc(affiliateClicks.clickedAt))
      .limit(20);

    return NextResponse.json({ product, recentClicks });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/admin/affiliate/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const productId = Number(id);
    const body = await req.json();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.brand !== undefined) updateData.brand = body.brand;
    if (body.categorySlug !== undefined) updateData.categorySlug = body.categorySlug;
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.compareAtPrice !== undefined)
      updateData.compareAtPrice = body.compareAtPrice ? Number(body.compareAtPrice) : null;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.affiliateUrl !== undefined) updateData.affiliateUrl = body.affiliateUrl;
    if (body.affiliateSource !== undefined) updateData.affiliateSource = body.affiliateSource;
    if (body.badge !== undefined) updateData.badge = body.badge || null;
    if (body.featured !== undefined) updateData.featured = Boolean(body.featured);
    if (body.stock !== undefined) updateData.stock = Number(body.stock);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const [updated] = await db
      .update(affiliateProducts)
      .set(updateData)
      .where(eq(affiliateProducts.id, productId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    return NextResponse.json({ product: updated });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    if (err?.code === "23505")
      return NextResponse.json({ error: "Ce slug est déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/admin/affiliate/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const productId = Number(id);

    await db.delete(affiliateProducts).where(eq(affiliateProducts.id, productId));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
