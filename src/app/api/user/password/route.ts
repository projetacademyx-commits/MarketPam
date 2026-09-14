import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations";

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = changePasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Le mot de passe actuel est incorrect." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ message: "Votre mot de passe a été mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur modification mot de passe:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du changement de mot de passe." },
      { status: 500 },
    );
  }
}
