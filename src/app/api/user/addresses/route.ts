import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { addressSchema } from "@/lib/validations";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const list = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, user.id))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));

  return NextResponse.json({ addresses: list });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = addressSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données d'adresse invalides" },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Vérifier si l'utilisateur a déjà des adresses
    const existing = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(eq(addresses.userId, user.id));

    const shouldBeDefault = data.isDefault || existing.length === 0;

    if (shouldBeDefault) {
      // Désactiver le statut par défaut des autres adresses
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, user.id));
    }

    const [newAddress] = await db
      .insert(addresses)
      .values({
        userId: user.id,
        fullName: data.fullName,
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone || null,
        isDefault: shouldBeDefault,
      })
      .returning();

    return NextResponse.json({ address: newAddress }, { status: 201 });
  } catch (error) {
    console.error("Erreur création adresse:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'enregistrement de l'adresse." },
      { status: 500 },
    );
  }
}
