import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const list = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    return NextResponse.json({ categories: list });
  } catch (error) {
    console.error("Erreur categories:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (!body.slug || !body.name) {
      return NextResponse.json({ error: "Nom et identifiant slug requis" }, { status: 400 });
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        slug: body.slug,
        name: body.name,
        tagline: body.tagline || "",
        description: body.description || "",
        imageUrl: body.imageUrl || "",
        sortOrder: Number(body.sortOrder) || 0,
      })
      .returning();

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    }
    console.error("Erreur création catégorie:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
