import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createSession,
  hashPassword,
  invalidateAllUserSessions,
  safeUser,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = resetPasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;

    // Rechercher l'utilisateur avec ce token non expiré
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.resetToken, token), gt(users.resetExpires, new Date())))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Ce lien de réinitialisation est invalide ou a expiré." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    // Mettre à jour le mot de passe et vider les tokens
    await db
      .update(users)
      .set({
        passwordHash,
        resetToken: null,
        resetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Révoquer les anciennes sessions
    await invalidateAllUserSessions(user.id);

    // Ouvrir une nouvelle session sécurisée
    const { token: sessionToken, expiresAt } = await createSession(user.id);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return NextResponse.json({
      message: "Votre mot de passe a été réinitialisé avec succès.",
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Erreur réinitialisation mot de passe:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la réinitialisation." },
      { status: 500 },
    );
  }
}
