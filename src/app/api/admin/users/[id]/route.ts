import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin, safeUser } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Identifiant utilisateur invalide" }, { status: 400 });
    }

    const body = await request.json();
    const role = body.role;
    if (role !== "customer" && role !== "admin") {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    if (userId === admin.id && role !== "admin") {
      return NextResponse.json(
        { error: "Vous ne pouvez pas révoquer vos propres droits administrateur." },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({ user: safeUser(updated) });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    }
    console.error("Erreur modification rôle utilisateur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
