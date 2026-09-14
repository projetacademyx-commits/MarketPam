import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { adminProductSchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = adminProductSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(products)
      .set(parsed.data)
      .where(eq(products.id, productId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ product: updated });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    }
    console.error("Erreur modification produit:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
    }

    await db.delete(products).where(eq(products.id, productId));

    return NextResponse.json({ success: true, message: "Produit supprimé avec succès" });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    }
    console.error("Erreur suppression produit:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
