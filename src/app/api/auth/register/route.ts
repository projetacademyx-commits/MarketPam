import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword, safeUser, SESSION_COOKIE_NAME } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = registerSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données d'inscription invalides" },
        { status: 400 },
      );
    }

    const { firstName, lastName, email, password } = parsed.data;

    // Vérifier si l'utilisateur existe déjà
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return NextResponse.json(
        { error: "Un compte avec cette adresse email existe déjà." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        passwordHash,
        role: "customer",
      })
      .returning();

    // Créer la session
    const { token, expiresAt } = await createSession(newUser.id);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return NextResponse.json({ user: safeUser(newUser) }, { status: 201 });
  } catch (error) {
    console.error("Erreur inscription:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de votre compte." },
      { status: 500 },
    );
  }
}
