import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, safeUser } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json({ user: safeUser(user) });
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = updateProfileSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données de profil invalides" },
        { status: 400 },
      );
    }

    const { firstName, lastName, email } = parsed.data;

    // Vérifier si l'email est déjà pris par un autre utilisateur
    if (email !== user.email) {
      const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing && existing.id !== user.id) {
        return NextResponse.json(
          { error: "Cette adresse email est déjà utilisée par un autre compte." },
          { status: 400 },
        );
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        firstName,
        lastName,
        email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json({ user: safeUser(updatedUser) });
  } catch (error) {
    console.error("Erreur modification profil:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour du profil." },
      { status: 500 },
    );
  }
}
