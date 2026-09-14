import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { generateToken } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = forgotPasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Email invalide" },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Même si l'utilisateur n'existe pas, on renvoie une réponse générique pour des raisons de sécurité
    if (!user) {
      return NextResponse.json({
        message: "Si un compte existe avec cet email, un lien de réinitialisation a été généré.",
      });
    }

    const token = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await db
      .update(users)
      .set({
        resetToken: token,
        resetExpires: expires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // En environnement local/démo sans serveur SMTP externe, on fournit le lien directement
    const resetUrl = `/reset-password?token=${token}`;

    return NextResponse.json({
      message: "Lien de réinitialisation généré avec succès.",
      resetUrl,
    });
  } catch (error) {
    console.error("Erreur mot de passe oublié:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la demande." },
      { status: 500 },
    );
  }
}
