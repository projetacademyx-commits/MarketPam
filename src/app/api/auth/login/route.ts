import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, safeUser, SESSION_COOKIE_NAME, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = loginSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Identifiants invalides" },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Adresse email ou mot de passe incorrect." },
        { status: 401 },
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Adresse email ou mot de passe incorrect." },
        { status: 401 },
      );
    }

    const { token, expiresAt } = await createSession(user.id);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return NextResponse.json({ user: safeUser(user) }, { status: 200 });
  } catch (error) {
    console.error("Erreur connexion:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la connexion." },
      { status: 500 },
    );
  }
}
