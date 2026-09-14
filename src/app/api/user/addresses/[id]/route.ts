import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { addressSchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const addressId = parseInt(id, 10);
    if (isNaN(addressId)) {
      return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
    }

    const json = await request.json();
    const parsed = addressSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Vérifier l'appartenance
    const [existing] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Adresse non trouvée" }, { status: 404 });
    }

    if (data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, user.id));
    }

    const [updated] = await db
      .update(addresses)
      .set({
        fullName: data.fullName,
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone || null,
        isDefault: data.isDefault,
        updatedAt: new Date(),
      })
      .where(eq(addresses.id, addressId))
      .returning();

    return NextResponse.json({ address: updated });
  } catch (error) {
    console.error("Erreur modification adresse:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const addressId = parseInt(id, 10);
    if (isNaN(addressId)) {
      return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Adresse non trouvée" }, { status: 404 });
    }

    await db.delete(addresses).where(eq(addresses.id, addressId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression adresse:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
